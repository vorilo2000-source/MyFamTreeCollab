// =============================================================================
// js/collab.js — Collaboratie berichtenboard
// MyFamTreeCollab v2.0.0
// -----------------------------------------------------------------------------
// Verantwoordelijkheden:
//   - Rolcheck via ShareModule.getMyRoleForTree() (owner/editor/viewer)
//   - Supabase client via AuthModule.getClient()
//   - Auteursnaam via AuthModule.getProfile() → username
//   - Livesearch op StamboomStorage.get() voor persoon-zoeker
//   - Discussies laden en renderen geclusterd per persoon-ID
//   - Berichten verzenden (tekst + optioneel diff-voorstel)
//   - Statuswijziging (owner + editor)
//   - Berichten verwijderen (owner modereert alle, iedereen eigen bericht)
//
// Wijzigingen v2.0.0:
//   - Rolcheck herschreven: ShareModule.getMyRoleForTree() i.p.v. collab_toegang tabel
//   - Supabase client: AuthModule.getClient() i.p.v. window.supabaseClient
//   - Auteursnaam: AuthModule.getProfile() → username
//   - Persoon-zoeker: livesearch dropdown op StamboomStorage.get()
//   - boom_id nu UUID (was TEXT)
//   - Polling verwijderd: alleen laden bij paginaöpening en na eigen bericht
//   - AccessGuard check toegevoegd
//
// Afhankelijkheden (verplichte laadvolgorde):
//   supabase-js → utils.js → schema.js → storage.js → auth.js →
//   shareModule.js → accessGuard.js → collab.js
// =============================================================================

(function () {
    'use strict';

    // ---------------------------------------------------------------------------
    // CONSTANTEN
    // ---------------------------------------------------------------------------
    var STORAGE_KEY_BOOM = 'activeBoomId';      // localStorage key voor actieve boom UUID
    var STORAGE_KEY_NAAM = 'activeBoomNaam';    // localStorage key voor boomnaam

    // ---------------------------------------------------------------------------
    // STAAT — centrale pagina-staat, nooit globaal lekken
    // ---------------------------------------------------------------------------
    var staat = {
        boomId:     null,    // UUID van actieve stamboom
        boomNaam:   null,    // Naam van actieve stamboom
        gebruiker:  null,    // Supabase auth user object
        profiel:    null,    // { username, tier, ... } uit AuthModule.getProfile()
        rol:        null,    // 'owner' | 'editor' | 'viewer'
        discussies: {},      // { persoonId: { naam, berichten[] } }
        supabase:   null     // Supabase client instantie
    };

    // ---------------------------------------------------------------------------
    // INITIALISATIE
    // ---------------------------------------------------------------------------

    // Start na volledig laden van de DOM
    document.addEventListener('DOMContentLoaded', function () {
        initialiseer();
    });

    // Hoofdfunctie: haal auth + rol op, laad dan data
    async function initialiseer() {

        // Haal Supabase client op via AuthModule (auth.js)
        if (!window.AuthModule) {
            toonFout('AuthModule niet geladen. Controleer de laadvolgorde.');
            return;
        }
        staat.supabase = window.AuthModule.getClient();    // Gedeelde Supabase client

        // Controleer of ShareModule beschikbaar is
        if (!window.ShareModule) {
            toonFout('ShareModule niet geladen. Controleer de laadvolgorde.');
            return;
        }

        // Haal actieve stamboom op uit localStorage
        staat.boomId   = localStorage.getItem(STORAGE_KEY_BOOM) || null;
        staat.boomNaam = localStorage.getItem(STORAGE_KEY_NAAM) || 'Onbekende stamboom';

        // Update subtitel met boomnaam
        var subtitel = document.getElementById('actieve-boom-label');
        if (subtitel) {
            subtitel.textContent = staat.boomId
                ? 'Stamboom: ' + ftSafe(staat.boomNaam)
                : 'Geen actieve stamboom gevonden.';
        }

        // Geen actieve boom → foutmelding
        if (!staat.boomId) {
            toonFout('Geen actieve stamboom gevonden. <a href="storage.html">Ga naar Opslag</a> om een stamboom te laden.');
            return;
        }

        // Controleer of gebruiker ingelogd is
        staat.gebruiker = await window.AuthModule.getUser();
        if (!staat.gebruiker) {
            toonGeenToegang();    // Niet ingelogd = geen toegang
            return;
        }

        // Haal profiel op voor weergavenaam in berichten
        var profielResult = await window.AuthModule.getProfile();
        staat.profiel = profielResult.profile || null;

        // Haal rol op voor de actieve stamboom via ShareModule
        var rolResult = await window.ShareModule.getMyRoleForTree(staat.boomId);

        if (rolResult.error || !rolResult.rol) {
            toonGeenToegang();    // Geen toegang tot deze stamboom
            return;
        }

        staat.rol = rolResult.rol;    // 'owner', 'editor' of 'viewer'

        // Toon de collab interface en laad discussies
        toonCollabInterface();
        await laadDiscussies();
        koppelZoekbalk();
        koppelModal();
    }

    // ---------------------------------------------------------------------------
    // INTERFACE TONEN / VERBERGEN
    // ---------------------------------------------------------------------------

    // Toon het geen-toegang blok
    function toonGeenToegang() {
        verbergLaadIndicator();
        var el = document.getElementById('geen-toegang-blok');
        if (el) el.style.display = 'block';
        var iface = document.getElementById('collab-interface');
        if (iface) iface.style.display = 'none';
    }

    // Toon de collab interface
    function toonCollabInterface() {
        var el = document.getElementById('geen-toegang-blok');
        if (el) el.style.display = 'none';
        var iface = document.getElementById('collab-interface');
        if (iface) iface.style.display = 'block';
    }

    // Verberg de laad-indicator
    function verbergLaadIndicator() {
        var ind = document.getElementById('laad-indicator');
        if (ind) ind.style.display = 'none';
    }

    // Toon een foutmelding boven de interface
    function toonFout(html) {
        var container = document.getElementById('fout-container');
        if (!container) return;
        container.style.display = 'block';
        container.innerHTML = '<div class="fout-melding">' + html + '</div>';
    }

    // ---------------------------------------------------------------------------
    // DATA LADEN
    // ---------------------------------------------------------------------------

    // Haal alle berichten op voor de actieve boom, gesorteerd op persoon + tijd
    async function laadDiscussies() {
        var result = await staat.supabase
            .from('collab_messages')
            .select('*')
            .eq('boom_id', staat.boomId)                      // Alleen berichten van deze boom
            .order('persoon_id', { ascending: true })
            .order('aangemaakt_op', { ascending: true });

        verbergLaadIndicator();

        if (result.error) {
            toonFout('Fout bij laden van berichten: ' + result.error.message);
            return;
        }

        // Groepeer berichten per persoon-ID
        staat.discussies = groepeertBerichtenPerPersoon(result.data || []);

        // Render alle discussieblokken
        renderDiscussies();
    }

    // Groepeer platte berichtenarray per persoon_id
    // Geeft terug: { persoonId: { naam, berichten[] } }
    function groepeertBerichtenPerPersoon(berichten) {
        var groepen = {};
        berichten.forEach(function (b) {
            var pid = b.persoon_id;
            if (!groepen[pid]) {
                groepen[pid] = { naam: b.persoon_naam, berichten: [] };
            }
            groepen[pid].berichten.push(b);
        });
        return groepen;
    }

    // ---------------------------------------------------------------------------
    // RENDEREN — DISCUSSIEBLOKKEN
    // ---------------------------------------------------------------------------

    // Render alle discussieblokken in de container
    function renderDiscussies() {
        var container = document.getElementById('discussie-container');
        if (!container) return;
        container.innerHTML = '';    // Reset container

        var persoonIds = Object.keys(staat.discussies);

        if (persoonIds.length === 0) {
            container.innerHTML = '<div class="laad-indicator">Nog geen discussies. Start er één via de zoekbalk hierboven.</div>';
            return;
        }

        // Render één blok per persoon
        persoonIds.forEach(function (pid) {
            var groep = staat.discussies[pid];
            var blok  = maakDiscussieBlok(pid, groep.naam, groep.berichten);
            container.appendChild(blok);
        });
    }

    // Maak een volledig discussieblok voor één persoon
    function maakDiscussieBlok(persoonId, persoonNaam, berichten) {
        var blok = document.createElement('div');
        blok.className = 'discussie-blok';
        blok.dataset.persoonId = persoonId;    // Opslaan voor event handlers

        // Bepaal status van de discussie op basis van laatste bericht
        var huidigStatus = berichten.length > 0
            ? berichten[berichten.length - 1].status
            : 'open';

        // --- Header ---
        var header = document.createElement('div');
        header.className = 'discussie-header';
        header.innerHTML =
            '<div style="display:flex;align-items:center;flex:1;">' +
                '<span class="discussie-persoon-naam">' + ftSafe(persoonNaam) + '</span>' +
                '<span class="discussie-persoon-id">' + ftSafe(persoonId) + '</span>' +
            '</div>' +
            '<span class="status-badge ' + statusKlasse(huidigStatus) + '">' +
                ftSafe(huidigStatus) +
            '</span>' +
            '<span class="discussie-toggle-pijl">▼</span>';

        // Klik op header = in/uitklappen
        header.addEventListener('click', function () {
            blok.classList.toggle('ingeklapt');
        });

        // --- Body ---
        var body = document.createElement('div');
        body.className = 'discussie-body';

        // Berichtenlijst
        var lijst = maakBerichtenLijst(berichten, persoonId);
        body.appendChild(lijst);

        // Nieuw bericht formulier
        var form = maakNieuwBerichtForm(persoonId, huidigStatus, blok, lijst);
        body.appendChild(form);

        blok.appendChild(header);
        blok.appendChild(body);

        return blok;
    }

    // Maak scrollbare berichtenlijst voor een discussieblok
    function maakBerichtenLijst(berichten, persoonId) {
        var lijst = document.createElement('div');
        lijst.className = 'bericht-lijst';
        lijst.id = 'lijst-' + persoonId;    // Uniek ID voor later updaten

        if (berichten.length === 0) {
            lijst.innerHTML = '<div class="bericht-leeg">Nog geen berichten in deze discussie.</div>';
            return lijst;
        }

        berichten.forEach(function (b) {
            lijst.appendChild(maakBerichtItem(b));
        });

        // Scroll naar nieuwste bericht
        setTimeout(function () { lijst.scrollTop = lijst.scrollHeight; }, 50);

        return lijst;
    }

    // Maak één bericht-item DOM-element
    function maakBerichtItem(bericht) {
        var isEigen = staat.gebruiker && bericht.user_id === staat.gebruiker.id;
        var isOwner = staat.rol === 'owner';

        var item = document.createElement('div');
        item.className = 'bericht-item' + (isEigen ? ' eigen' : '');
        item.dataset.id = bericht.id;

        // Tijdstip formatteren
        var tijdstip = bericht.aangemaakt_op
            ? new Date(bericht.aangemaakt_op).toLocaleString('nl-NL', {
                dateStyle: 'short', timeStyle: 'short'
              })
            : '';

        // Verwijderknop: owner mag alles verwijderen, anderen alleen eigen berichten
        var magVerwijderen = isOwner || isEigen;
        var verwijderHtml = magVerwijderen
            ? '<button class="bericht-verwijder" data-id="' + bericht.id + '" title="Verwijderen">✕</button>'
            : '';

        // Diff-voorstel blok — alleen tonen als aanwezig
        var diffHtml = bericht.diff_voorstel
            ? '<div class="diff-blok"><strong>📝 Wijzigingsvoorstel:</strong><br>' +
              ftSafe(bericht.diff_voorstel) + '</div>'
            : '';

        item.innerHTML =
            '<div class="bericht-meta">' +
                '<span>' +
                    '<span class="bericht-auteur">' + ftSafe(bericht.auteur_naam) + '</span>' +
                    '<span class="rol-label rol-' + ftSafe(bericht.rol) + '">' + ftSafe(bericht.rol) + '</span>' +
                '</span>' +
                '<span style="display:flex;align-items:center;gap:6px;">' +
                    '<span style="font-size:0.75rem;color:#bbb;">' + ftSafe(tijdstip) + '</span>' +
                    verwijderHtml +
                '</span>' +
            '</div>' +
            '<div>' + ftSafe(bericht.bericht) + '</div>' +
            diffHtml;

        // Koppel verwijder-handler
        if (magVerwijderen) {
            var knop = item.querySelector('.bericht-verwijder');
            if (knop) {
                knop.addEventListener('click', function (e) {
                    e.stopPropagation();    // Voorkom uitklappen van blok
                    verwijderBericht(bericht.id, item);
                });
            }
        }

        return item;
    }

    // Maak het formulier voor een nieuw bericht onderaan een discussieblok
    function maakNieuwBerichtForm(persoonId, huidigStatus, blokEl, lijstEl) {
        var form = document.createElement('div');
        form.className = 'nieuw-bericht-form';

        // Status-selector — owner en editor mogen status wijzigen
        var kanStatusWijzigen = (staat.rol === 'owner' || staat.rol === 'editor');
        var statusSelectHtml = kanStatusWijzigen
            ? '<select class="status-select">' +
                  '<option value="open"'     + (huidigStatus === 'open'     ? ' selected' : '') + '>🟡 Open</option>' +
                  '<option value="review"'   + (huidigStatus === 'review'   ? ' selected' : '') + '>🔵 In review</option>' +
                  '<option value="opgelost"' + (huidigStatus === 'opgelost' ? ' selected' : '') + '>🟢 Opgelost</option>' +
              '</select>'
            : '';

        // Diff-toggle — alleen voor editor en owner
        var kanDiff = (staat.rol === 'owner' || staat.rol === 'editor');
        var diffToggleHtml = kanDiff
            ? '<button class="knop-diff-toggle" type="button">📝 Wijziging voorstellen</button>' +
              '<div class="diff-invoer-wrapper">' +
                  '<label>Beschrijf de voorgestelde wijziging:</label>' +
                  '<textarea placeholder="bijv. Geboortedatum was 1923, niet 1932…"></textarea>' +
              '</div>'
            : '';

        form.innerHTML =
            '<textarea placeholder="Schrijf een bericht…" maxlength="1000"></textarea>' +
            '<div class="form-acties">' +
                statusSelectHtml +
                diffToggleHtml +
                '<button class="knop-verzend" type="button">Versturen</button>' +
            '</div>';

        // Diff toggle handler
        var diffToggle  = form.querySelector('.knop-diff-toggle');
        var diffWrapper = form.querySelector('.diff-invoer-wrapper');
        if (diffToggle && diffWrapper) {
            diffToggle.addEventListener('click', function () {
                diffWrapper.classList.toggle('zichtbaar');
                diffToggle.textContent = diffWrapper.classList.contains('zichtbaar')
                    ? '✕ Wijziging annuleren'
                    : '📝 Wijziging voorstellen';
            });
        }

        // Verzend handler
        var textarea     = form.querySelector('textarea');
        var verzendKnop  = form.querySelector('.knop-verzend');
        var statusSelect = form.querySelector('.status-select');
        var diffTextarea = diffWrapper ? diffWrapper.querySelector('textarea') : null;

        verzendKnop.addEventListener('click', async function () {
            var tekst = textarea.value.trim();
            if (!tekst) return;    // Lege berichten niet verzenden

            var nieuweStatus = statusSelect ? statusSelect.value : huidigStatus;
            var diffVoorstel = (diffTextarea && diffWrapper && diffWrapper.classList.contains('zichtbaar'))
                ? diffTextarea.value.trim()
                : null;

            verzendKnop.disabled    = true;
            verzendKnop.textContent = 'Bezig…';

            var result = await verzendBericht(persoonId, tekst, nieuweStatus, diffVoorstel);

            verzendKnop.disabled    = false;
            verzendKnop.textContent = 'Versturen';

            if (!result.success) {
                toonFout('Bericht verzenden mislukt: ' + result.error);
                return;
            }

            // Voeg nieuw bericht toe aan lijst zonder herladen
            var leegEl = lijstEl.querySelector('.bericht-leeg');
            if (leegEl) leegEl.remove();

            lijstEl.appendChild(maakBerichtItem(result.data));
            lijstEl.scrollTop = lijstEl.scrollHeight;    // Scroll naar nieuw bericht

            // Reset formulier
            textarea.value = '';
            if (diffTextarea) diffTextarea.value = '';
            if (diffWrapper) diffWrapper.classList.remove('zichtbaar');
            if (diffToggle) diffToggle.textContent = '📝 Wijziging voorstellen';

            // Update status badge in blok-header
            var badge = blokEl.querySelector('.status-badge');
            if (badge) {
                badge.textContent = nieuweStatus;
                badge.className   = 'status-badge ' + statusKlasse(nieuweStatus);
            }

            // Update huidigStatus voor volgende bericht in dezelfde sessie
            huidigStatus = nieuweStatus;
        });

        return form;
    }

    // ---------------------------------------------------------------------------
    // SUPABASE SCHRIJFACTIES
    // ---------------------------------------------------------------------------

    // Verstuur een nieuw bericht naar Supabase
    // @returns {{ success: boolean, data: object|null, error: string|null }}
    async function verzendBericht(persoonId, tekst, status, diffVoorstel) {

        // Bepaal weergavenaam: username uit profiel, fallback naar e-mail
        var auteurNaam = (staat.profiel && staat.profiel.username)
            ? staat.profiel.username
            : (staat.gebruiker ? staat.gebruiker.email : 'Onbekend');

        // Persoon naam uit staat
        var persoonNaam = staat.discussies[persoonId]
            ? staat.discussies[persoonId].naam
            : persoonId;

        var record = {
            boom_id:       staat.boomId,          // UUID van de actieve stamboom
            persoon_id:    persoonId,              // ID van de besproken persoon
            persoon_naam:  persoonNaam,            // Naam (denormalisatie voor snelheid)
            user_id:       staat.gebruiker.id,     // Supabase auth user UUID
            auteur_naam:   auteurNaam,             // Weergavenaam afzender
            rol:           staat.rol,              // Rol van afzender
            bericht:       tekst,                  // Berichttekst
            diff_voorstel: diffVoorstel || null,   // Optioneel wijzigingsvoorstel
            status:        status                  // Discussiestatus
        };

        var result = await staat.supabase
            .from('collab_messages')
            .insert([record])
            .select()
            .single();

        if (result.error) return { success: false, data: null, error: result.error.message };
        return { success: true, data: result.data, error: null };
    }

    // Verwijder een bericht uit Supabase
    // Owner mag alles verwijderen, anderen alleen eigen berichten (RLS regelt dit ook)
    async function verwijderBericht(berichtId, itemEl) {
        if (!confirm('Dit bericht verwijderen?')) return;

        var result = await staat.supabase
            .from('collab_messages')
            .delete()
            .eq('id', berichtId);

        if (result.error) {
            toonFout('Verwijderen mislukt: ' + result.error.message);
            return;
        }

        itemEl.remove();    // Verwijder uit DOM zonder herladen
    }

    // ---------------------------------------------------------------------------
    // PERSOON-ZOEKER — livesearch op StamboomStorage
    // ---------------------------------------------------------------------------

    // Koppel de zoekbalk aan de livesearch dropdown
    function koppelZoekbalk() {
        var zoekInput = document.getElementById('persoon-zoek-input');
        var zoekKnop  = document.getElementById('zoek-knop');

        if (!zoekInput) return;

        // Maak dropdown container aan direct onder de zoekbalk
        var dropdown = document.createElement('div');
        dropdown.id = 'zoek-dropdown';
        dropdown.style.cssText = [
            'position: absolute',
            'background: #fff',
            'border: 1px solid #ccc',
            'border-radius: 5px',
            'box-shadow: 0 4px 12px rgba(0,0,0,0.12)',
            'max-height: 240px',
            'overflow-y: auto',
            'z-index: 500',
            'display: none',
            'min-width: 280px'
        ].join(';');

        // Positie dropdown relatief aan zoeksectie
        var zoekSectie = zoekInput.closest('.zoek-sectie') || zoekInput.parentNode;
        zoekSectie.style.position = 'relative';    // Ankerpunt voor dropdown
        zoekSectie.appendChild(dropdown);

        // Livesearch bij typen
        zoekInput.addEventListener('input', function () {
            var query = zoekInput.value.trim().toLowerCase();
            if (query.length < 1) {
                dropdown.style.display = 'none';
                return;
            }
            toonZoekResultaten(query, dropdown, zoekInput);
        });

        // Enter-toets opent modal met huidig zoekresultaat
        zoekInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                var eerste = dropdown.querySelector('.zoek-resultaat-item');
                if (eerste) eerste.click();
            }
            if (e.key === 'Escape') {
                dropdown.style.display = 'none';
            }
        });

        // Zoekknop opent modal met ingevulde waarde
        if (zoekKnop) {
            zoekKnop.addEventListener('click', function () {
                var waarde = zoekInput.value.trim();
                if (!waarde) return;
                openNieuweDiscussieModal(waarde, '');
                dropdown.style.display = 'none';
            });
        }

        // Sluit dropdown bij klik buiten zoeksectie
        document.addEventListener('click', function (e) {
            if (!zoekSectie.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    // Toon zoekresultaten uit StamboomStorage in de dropdown
    function toonZoekResultaten(query, dropdown, zoekInput) {
        dropdown.innerHTML = '';

        // Haal alle personen op uit localStorage
        var personen = window.StamboomStorage ? window.StamboomStorage.get() : [];

        if (!personen || personen.length === 0) {
            dropdown.innerHTML = '<div style="padding:10px;font-size:0.85rem;color:#888;">Geen lokale stamboomdata gevonden.</div>';
            dropdown.style.display = 'block';
            return;
        }

        // Filter op naam of ID
        var resultaten = personen.filter(function (p) {
            var naam = ((p.Roepnaam || '') + ' ' + (p.Achternaam || '')).toLowerCase();
            var id   = (p.ID || '').toLowerCase();
            return naam.includes(query) || id.includes(query);
        }).slice(0, 10);    // Max 10 resultaten tonen

        if (resultaten.length === 0) {
            dropdown.innerHTML = '<div style="padding:10px;font-size:0.85rem;color:#888;">Geen personen gevonden voor "' + ftSafe(query) + '".</div>';
            dropdown.style.display = 'block';
            return;
        }

        // Render resultaten als klikbare rijen
        resultaten.forEach(function (p) {
            var naam       = ((p.Roepnaam || '') + ' ' + (p.Prefix || '') + ' ' + (p.Achternaam || '')).trim();
            var persoonId  = p.ID || '';
            var geboortejr = p.Geboortedatum ? p.Geboortedatum.substring(0, 4) : '';

            var item = document.createElement('div');
            item.className = 'zoek-resultaat-item';
            item.style.cssText = [
                'padding: 9px 12px',
                'cursor: pointer',
                'font-size: 0.88rem',
                'border-bottom: 1px solid #f0f0f0',
                'display: flex',
                'justify-content: space-between',
                'align-items: center'
            ].join(';');

            item.innerHTML =
                '<span>' + ftSafe(naam) + '</span>' +
                '<span style="font-size:0.78rem;color:#999;font-family:monospace;">' +
                    ftSafe(persoonId) +
                    (geboortejr ? ' · ' + ftSafe(geboortejr) : '') +
                '</span>';

            item.addEventListener('mouseenter', function () {
                item.style.background = '#f0f7ff';
            });
            item.addEventListener('mouseleave', function () {
                item.style.background = '';
            });

            // Klik op resultaat: open modal met ingevulde persoon
            item.addEventListener('click', function () {
                dropdown.style.display = 'none';
                zoekInput.value = naam;    // Vul zoekveld met naam
                openNieuweDiscussieModal(persoonId, naam);
            });

            dropdown.appendChild(item);
        });

        dropdown.style.display = 'block';
    }

    // ---------------------------------------------------------------------------
    // NIEUWE DISCUSSIE MODAL
    // ---------------------------------------------------------------------------

    // Koppel event listeners aan de modal
    function koppelModal() {
        var annuleer = document.getElementById('modal-annuleer');
        var bevestig = document.getElementById('modal-bevestig');
        var overlay  = document.getElementById('nieuwe-discussie-modal');

        if (annuleer) annuleer.addEventListener('click', sluitModal);
        if (bevestig) bevestig.addEventListener('click', bevestigNieuweDiscussie);

        // Klik buiten modal sluit hem
        if (overlay) {
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) sluitModal();
            });
        }
    }

    // Open de modal met ingevulde persoon-ID en naam
    function openNieuweDiscussieModal(persoonId, persoonNaam) {
        var modal     = document.getElementById('nieuwe-discussie-modal');
        var idInput   = document.getElementById('modal-persoon-id');
        var naamInput = document.getElementById('modal-persoon-naam');

        if (!modal || !idInput || !naamInput) return;

        idInput.value   = persoonId || '';
        naamInput.value = persoonNaam || '';

        // ID-veld readonly als al ingevuld vanuit livesearch
        idInput.readOnly = !!persoonId;

        modal.classList.add('actief');

        // Focus op leeg veld
        setTimeout(function () {
            (idInput.value ? naamInput : idInput).focus();
        }, 100);
    }

    // Sluit de modal en reset velden
    function sluitModal() {
        var modal = document.getElementById('nieuwe-discussie-modal');
        if (modal) modal.classList.remove('actief');
        var idInput   = document.getElementById('modal-persoon-id');
        var naamInput = document.getElementById('modal-persoon-naam');
        if (idInput)   { idInput.value = ''; idInput.readOnly = false; }
        if (naamInput) naamInput.value = '';

        // Reset zoekveld
        var zoekInput = document.getElementById('persoon-zoek-input');
        if (zoekInput) zoekInput.value = '';
    }

    // Verwerk de bevestiging van een nieuwe discussie
    function bevestigNieuweDiscussie() {
        var persoonId   = document.getElementById('modal-persoon-id').value.trim();
        var persoonNaam = document.getElementById('modal-persoon-naam').value.trim();

        if (!persoonId || !persoonNaam) {
            alert('Vul zowel het persoon-ID als de naam in.');
            return;
        }

        // Discussie bestaat al — scroll naar bestaand blok
        if (staat.discussies[persoonId]) {
            sluitModal();
            var bestaand = document.querySelector('[data-persoon-id="' + persoonId + '"]');
            if (bestaand) bestaand.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        // Voeg nieuwe lege discussie toe aan staat en render
        staat.discussies[persoonId] = { naam: persoonNaam, berichten: [] };

        var container       = document.getElementById('discussie-container');
        var leegPlaceholder = container.querySelector('.laad-indicator');
        if (leegPlaceholder) leegPlaceholder.remove();

        var blok = maakDiscussieBlok(persoonId, persoonNaam, []);
        container.appendChild(blok);

        sluitModal();

        // Scroll naar nieuw blok
        setTimeout(function () {
            blok.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // ---------------------------------------------------------------------------
    // HULPFUNCTIES
    // ---------------------------------------------------------------------------

    // Geef CSS-klasse terug voor een statuslabel
    function statusKlasse(status) {
        var klassen = { open: 'status-open', review: 'status-review', opgelost: 'status-opgelost' };
        return klassen[status] || 'status-open';
    }

    // XSS-veilige tekst escaping — gebruik window.ftSafe als beschikbaar
    function ftSafe(tekst) {
        if (window.ftSafe) return window.ftSafe(tekst);    // Gebruik utils.js versie
        return String(tekst || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

})();
