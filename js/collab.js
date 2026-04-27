// =============================================================================
// js/collab.js — Collaboratie berichtenboard
// MyFamTreeCollab v2.1.0
// -----------------------------------------------------------------------------
// Verantwoordelijkheden:
//   - Rolcheck via ShareModule.getMyRoleForTree() (owner/editor/viewer)
//   - Supabase client via AuthModule.getClient()
//   - Auteursnaam via AuthModule.getProfile() → username (voornaam)
//   - Livesearch op StamboomStorage.get() voor persoon-zoeker
//   - Discussies laden en renderen geclusterd per persoon-ID
//   - Stamboom-sectie header boven alle discussies
//   - Berichten verzenden (tekst + optioneel diff-voorstel)
//   - Statuswijziging (owner + editor): nieuw / open / inbehandeling / gesloten
//   - Berichten verwijderen (owner modereert alle, iedereen eigen bericht)
//   - Statusicoontjes: 🆕 Nieuw · 🔓 Open · 🔄 In behandeling · ✅ Gesloten
//
// Wijzigingen v2.1.0 (sessie 19):
//   - Status uitgebreid van 3 naar 4: nieuw / open / inbehandeling / gesloten
//   - Statusicoontjes toegevoegd in badge en per bericht
//   - Stamboom-sectie header boven de discussielijst
//   - Berichtweergave: bijdrager voornaam (eerste woord van username) zichtbaar
//   - CSS-klassen bijgewerkt naar nieuwe statusnamen
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

    // Status definities: waarde → { label, icoon, css-klasse }
    // Wordt gebruikt in badges, select-opties en berichtrijen
    var STATUS_CONFIG = {
        nieuw:          { label: 'Nieuw',          icoon: '🆕', klasse: 'status-nieuw' },
        open:           { label: 'Open',           icoon: '🔓', klasse: 'status-open' },
        inbehandeling:  { label: 'In behandeling', icoon: '🔄', klasse: 'status-inbehandeling' },
        gesloten:       { label: 'Gesloten',       icoon: '✅', klasse: 'status-gesloten' }
    };

    // Fallback als een onbekende statuswaarde uit de database komt
    var STATUS_FALLBACK = 'nieuw';

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

        // Geen actieve boom → foutmelding en stoppen
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

    // Toon het geen-toegang blok en verberg de interface
    function toonGeenToegang() {
        verbergLaadIndicator();
        var el = document.getElementById('geen-toegang-blok');
        if (el) el.style.display = 'block';
        var iface = document.getElementById('collab-interface');
        if (iface) iface.style.display = 'none';
    }

    // Toon de collab interface en verberg het geen-toegang blok
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

    // Toon een foutmelding boven de interface (HTML toegestaan voor links)
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
            .eq('boom_id', staat.boomId)                       // Alleen berichten van deze boom
            .order('persoon_id', { ascending: true })          // Groepeer per persoon
            .order('aangemaakt_op', { ascending: true });      // Oudste bericht eerst

        verbergLaadIndicator();

        if (result.error) {
            toonFout('Fout bij laden van berichten: ' + result.error.message);
            return;
        }

        // Groepeer berichten per persoon-ID
        staat.discussies = groepeertBerichtenPerPersoon(result.data || []);

        // Render alle discussieblokken met stamboom-header
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
            groepen[pid].berichten.push(b);    // Voeg bericht toe aan de groep van deze persoon
        });
        return groepen;
    }

    // ---------------------------------------------------------------------------
    // RENDEREN — STAMBOOM-HEADER + DISCUSSIEBLOKKEN
    // ---------------------------------------------------------------------------

    // Render alle discussieblokken in de container, met stamboom-header bovenaan
    function renderDiscussies() {
        var container = document.getElementById('discussie-container');
        if (!container) return;
        container.innerHTML = '';    // Leeg de container voor nieuwe render

        var persoonIds = Object.keys(staat.discussies);

        if (persoonIds.length === 0) {
            // Geen discussies aanwezig: toon instructietekst
            container.innerHTML = '<div class="laad-indicator">Nog geen discussies. Start er één via de zoekbalk hierboven.</div>';
            return;
        }

        // Stamboom-sectie header — één header boven alle discussies van deze boom
        var sectieHeader = maakStamboomSectieHeader(staat.boomNaam, persoonIds.length);
        container.appendChild(sectieHeader);

        // Render één discussieblok per persoon
        persoonIds.forEach(function (pid) {
            var groep = staat.discussies[pid];
            var blok  = maakDiscussieBlok(pid, groep.naam, groep.berichten);
            container.appendChild(blok);
        });
    }

    // Maak de stamboom-sectie header (toont boomnaam + aantal onderwerpen)
    function maakStamboomSectieHeader(boomNaam, aantalOnderwerpen) {
        var header = document.createElement('div');
        header.className = 'stamboom-sectie-header';

        // Icoon + naam + teller in één flexrij
        header.innerHTML =
            '<span class="stamboom-sectie-icoon">📚</span>' +
            '<span class="stamboom-sectie-naam">' + ftSafe(boomNaam) + '</span>' +
            '<span class="stamboom-sectie-teller">' + aantalOnderwerpen + ' onderwerp' +
                (aantalOnderwerpen !== 1 ? 'en' : '') +    // Meervoud als meer dan 1
            '</span>';

        return header;
    }

    // Maak een volledig discussieblok voor één persoon (onderwerp)
    function maakDiscussieBlok(persoonId, persoonNaam, berichten) {
        var blok = document.createElement('div');
        blok.className = 'discussie-blok';
        blok.dataset.persoonId = persoonId;    // Bewaar ID voor event handlers en scroll

        // Bepaal de huidige status op basis van het laatste bericht
        var huidigStatus = berichten.length > 0
            ? (berichten[berichten.length - 1].status || STATUS_FALLBACK)
            : STATUS_FALLBACK;

        // Zorg dat de status geldig is, anders fallback naar 'nieuw'
        if (!STATUS_CONFIG[huidigStatus]) huidigStatus = STATUS_FALLBACK;

        // --- Header met persoon-naam, ID en statusbadge ---
        var header = document.createElement('div');
        header.className = 'discussie-header';

        var statusConf = STATUS_CONFIG[huidigStatus];    // Configuratie voor huidige status

        header.innerHTML =
            '<div style="display:flex;align-items:center;flex:1;min-width:0;">' +
                '<span class="discussie-persoon-naam">' + ftSafe(persoonNaam) + '</span>' +
                '<span class="discussie-persoon-id">' + ftSafe(persoonId) + '</span>' +
            '</div>' +
            '<span class="status-badge ' + statusConf.klasse + '">' +
                statusConf.icoon + ' ' + statusConf.label +
            '</span>' +
            '<span class="discussie-toggle-pijl">▼</span>';

        // Klik op header = in/uitklappen van de discussie
        header.addEventListener('click', function () {
            blok.classList.toggle('ingeklapt');
        });

        // --- Body met berichtenlijst en formulier ---
        var body = document.createElement('div');
        body.className = 'discussie-body';

        // Berichtenlijst — scrollbaar, max hoogte via CSS
        var lijst = maakBerichtenLijst(berichten, persoonId);
        body.appendChild(lijst);

        // Nieuw bericht formulier onderaan de discussie
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
        lijst.id = 'lijst-' + persoonId;    // Uniek ID zodat collab.js de lijst later kan vinden

        if (berichten.length === 0) {
            // Lege staat: informatieve placeholder
            lijst.innerHTML = '<div class="bericht-leeg">Nog geen berichten in deze discussie.</div>';
            return lijst;
        }

        // Render elk bericht als een item
        berichten.forEach(function (b) {
            lijst.appendChild(maakBerichtItem(b));
        });

        // Scroll automatisch naar het nieuwste bericht
        setTimeout(function () { lijst.scrollTop = lijst.scrollHeight; }, 50);

        return lijst;
    }

    // Maak één bericht-item DOM-element
    // Toont: auteur voornaam + rol + tijdstip + statusicoon + tekst + optioneel diff
    function maakBerichtItem(bericht) {
        var isEigen = staat.gebruiker && bericht.user_id === staat.gebruiker.id;    // Is dit het bericht van de huidige gebruiker?
        var isOwner = staat.rol === 'owner';                                         // Is de huidige gebruiker owner?

        var item = document.createElement('div');
        item.className = 'bericht-item' + (isEigen ? ' eigen' : '');    // Eigen berichten krijgen blauwe achtergrond
        item.dataset.id = bericht.id;

        // Tijdstip formatteren naar Nederlands (dag-maand-jaar uur:min)
        var tijdstip = bericht.aangemaakt_op
            ? new Date(bericht.aangemaakt_op).toLocaleString('nl-NL', {
                dateStyle: 'short', timeStyle: 'short'
              })
            : '';

        // Voornaam = eerste woord van de auteursnaam (bijv. "Jan" uit "Jan de Vries")
        var volledigeNaam = bericht.auteur_naam || 'Onbekend';
        var voornaam = volledigeNaam.split(' ')[0];    // Neem alleen het eerste woord als voornaam

        // Statusicoon voor dit specifieke bericht (status op moment van verzenden)
        var berichtStatus = bericht.status || STATUS_FALLBACK;
        var berichtStatusConf = STATUS_CONFIG[berichtStatus] || STATUS_CONFIG[STATUS_FALLBACK];

        // Verwijderknop: owner verwijdert alles, anderen alleen eigen berichten
        var magVerwijderen = isOwner || isEigen;
        var verwijderHtml = magVerwijderen
            ? '<button class="bericht-verwijder" data-id="' + bericht.id + '" title="Verwijderen">✕</button>'
            : '';

        // Diff-voorstel blok — alleen zichtbaar als er een wijzigingsvoorstel is
        var diffHtml = bericht.diff_voorstel
            ? '<div class="diff-blok"><strong>📝 Wijzigingsvoorstel:</strong><br>' +
              ftSafe(bericht.diff_voorstel) + '</div>'
            : '';

        // HTML-structuur van één bericht:
        // [Voornaam] [rol-label]          [tijdstip] [statusicoon] [verwijder]
        // Berichttekst...
        // [Optioneel diff-blok]
        item.innerHTML =
            '<div class="bericht-meta">' +
                '<span>' +
                    '<span class="bericht-auteur">' + ftSafe(voornaam) + '</span>' +
                    '<span class="rol-label rol-' + ftSafe(bericht.rol) + '">' + ftSafe(bericht.rol) + '</span>' +
                '</span>' +
                '<span style="display:flex;align-items:center;gap:6px;">' +
                    '<span style="font-size:0.75rem;color:#bbb;">' + ftSafe(tijdstip) + '</span>' +
                    '<span class="bericht-status-icoon" title="' + ftSafe(berichtStatusConf.label) + '">' +
                        berichtStatusConf.icoon +                        // Statusicoon als visuele hint
                    '</span>' +
                    verwijderHtml +
                '</span>' +
            '</div>' +
            '<div class="bericht-tekst">' + ftSafe(bericht.bericht) + '</div>' +
            diffHtml;

        // Koppel verwijder-handler als de gebruiker dit bericht mag verwijderen
        if (magVerwijderen) {
            var knop = item.querySelector('.bericht-verwijder');
            if (knop) {
                knop.addEventListener('click', function (e) {
                    e.stopPropagation();    // Voorkom dat de header in/uitklapt bij klikken
                    verwijderBericht(bericht.id, item);
                });
            }
        }

        return item;
    }

    // Maak het formulier voor een nieuw bericht onderaan een discussieblok
    // Bevat: tekstarea, status-select (voor editor/owner), diff-toggle (voor editor/owner), verzendknop
    function maakNieuwBerichtForm(persoonId, huidigStatus, blokEl, lijstEl) {
        var form = document.createElement('div');
        form.className = 'nieuw-bericht-form';

        // Status-selector — alleen voor editor en owner, viewers mogen status niet wijzigen
        var kanStatusWijzigen = (staat.rol === 'owner' || staat.rol === 'editor');

        // Bouw status-opties op basis van STATUS_CONFIG (alle 4 statussen)
        var statusOptiesHtml = '';
        Object.keys(STATUS_CONFIG).forEach(function (sleutel) {
            var conf = STATUS_CONFIG[sleutel];
            var geselecteerd = (sleutel === huidigStatus) ? ' selected' : '';
            statusOptiesHtml +=
                '<option value="' + sleutel + '"' + geselecteerd + '>' +
                    conf.icoon + ' ' + conf.label +
                '</option>';
        });

        var statusSelectHtml = kanStatusWijzigen
            ? '<select class="status-select" title="Verander de discussiestatus">' +
                  statusOptiesHtml +
              '</select>'
            : '';

        // Diff-toggle knop — alleen voor editor en owner
        var kanDiff = (staat.rol === 'owner' || staat.rol === 'editor');
        var diffToggleHtml = kanDiff
            ? '<button class="knop-diff-toggle" type="button">📝 Wijziging voorstellen</button>' +
              '<div class="diff-invoer-wrapper">' +
                  '<label>Beschrijf de voorgestelde wijziging:</label>' +
                  '<textarea placeholder="bijv. Geboortedatum was 1923, niet 1932…"></textarea>' +
              '</div>'
            : '';

        // Formulier HTML — tekstarea bovenaan, acties eronder
        form.innerHTML =
            '<textarea placeholder="Schrijf een bericht…" maxlength="1000"></textarea>' +
            '<div class="form-acties">' +
                statusSelectHtml +
                diffToggleHtml +
                '<button class="knop-verzend" type="button">Versturen</button>' +
            '</div>';

        // --- Diff toggle koppelen ---
        var diffToggle  = form.querySelector('.knop-diff-toggle');
        var diffWrapper = form.querySelector('.diff-invoer-wrapper');
        if (diffToggle && diffWrapper) {
            diffToggle.addEventListener('click', function () {
                diffWrapper.classList.toggle('zichtbaar');    // Toon/verberg het diff-invoerveld
                diffToggle.textContent = diffWrapper.classList.contains('zichtbaar')
                    ? '✕ Wijziging annuleren'
                    : '📝 Wijziging voorstellen';
            });
        }

        // --- Verzend handler ---
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

            // Knop uitschakelen tijdens verzenden om dubbele submits te voorkomen
            verzendKnop.disabled    = true;
            verzendKnop.textContent = 'Bezig…';

            var result = await verzendBericht(persoonId, tekst, nieuweStatus, diffVoorstel);

            // Knop herstellen
            verzendKnop.disabled    = false;
            verzendKnop.textContent = 'Versturen';

            if (!result.success) {
                toonFout('Bericht verzenden mislukt: ' + result.error);
                return;
            }

            // Verwijder lege-state placeholder als aanwezig
            var leegEl = lijstEl.querySelector('.bericht-leeg');
            if (leegEl) leegEl.remove();

            // Voeg het nieuwe bericht direct toe aan de lijst zonder herladen
            lijstEl.appendChild(maakBerichtItem(result.data));
            lijstEl.scrollTop = lijstEl.scrollHeight;    // Scroll naar het nieuwe bericht

            // Reset het formulier
            textarea.value = '';
            if (diffTextarea) diffTextarea.value = '';
            if (diffWrapper) diffWrapper.classList.remove('zichtbaar');
            if (diffToggle) diffToggle.textContent = '📝 Wijziging voorstellen';

            // Update de statusbadge in de header van dit discussieblok
            var badge = blokEl.querySelector('.status-badge');
            if (badge) {
                var nieuweConf = STATUS_CONFIG[nieuweStatus] || STATUS_CONFIG[STATUS_FALLBACK];
                badge.textContent = nieuweConf.icoon + ' ' + nieuweConf.label;
                badge.className   = 'status-badge ' + nieuweConf.klasse;
            }

            // Bewaar de nieuwe status voor het volgende bericht in dezelfde sessie
            huidigStatus = nieuweStatus;
        });

        return form;
    }

    // ---------------------------------------------------------------------------
    // SUPABASE SCHRIJFACTIES
    // ---------------------------------------------------------------------------

    // Verstuur een nieuw bericht naar Supabase collab_messages tabel
    // @returns {{ success: boolean, data: object|null, error: string|null }}
    async function verzendBericht(persoonId, tekst, status, diffVoorstel) {

        // Bepaal weergavenaam: username uit profiel, anders e-mailadres, anders 'Onbekend'
        var auteurNaam = (staat.profiel && staat.profiel.username)
            ? staat.profiel.username
            : (staat.gebruiker ? staat.gebruiker.email : 'Onbekend');

        // Haal persoon-naam op uit lokale staat (gedenormaliseerd voor leessnelheid)
        var persoonNaam = staat.discussies[persoonId]
            ? staat.discussies[persoonId].naam
            : persoonId;

        // Stel het record samen voor de database
        var record = {
            boom_id:       staat.boomId,          // UUID van de actieve stamboom
            persoon_id:    persoonId,              // ID van de besproken persoon (bijv. P-0042)
            persoon_naam:  persoonNaam,            // Naam van de persoon (denormalisatie voor snelheid)
            user_id:       staat.gebruiker.id,     // Supabase auth user UUID van de afzender
            auteur_naam:   auteurNaam,             // Weergavenaam van de afzender
            rol:           staat.rol,              // Rol van de afzender (owner/editor/viewer)
            bericht:       tekst,                  // Berichttekst
            diff_voorstel: diffVoorstel || null,   // Optioneel wijzigingsvoorstel (null als leeg)
            status:        status                  // Status van de discussie na dit bericht
        };

        // Voer de insert uit en haal het opgeslagen record terug
        var result = await staat.supabase
            .from('collab_messages')
            .insert([record])
            .select()
            .single();

        if (result.error) return { success: false, data: null, error: result.error.message };
        return { success: true, data: result.data, error: null };
    }

    // Verwijder een bericht uit Supabase
    // Owner mag alle berichten verwijderen, anderen alleen hun eigen (RLS regelt dit ook serverside)
    async function verwijderBericht(berichtId, itemEl) {
        if (!confirm('Dit bericht verwijderen?')) return;    // Bevestiging vragen

        var result = await staat.supabase
            .from('collab_messages')
            .delete()
            .eq('id', berichtId);

        if (result.error) {
            toonFout('Verwijderen mislukt: ' + result.error.message);
            return;
        }

        itemEl.remove();    // Verwijder het item uit de DOM zonder herladen
    }

    // ---------------------------------------------------------------------------
    // PERSOON-ZOEKER — livesearch op StamboomStorage
    // ---------------------------------------------------------------------------

    // Koppel de zoekbalk en dropdown aan StamboomStorage voor persoon-zoeken
    function koppelZoekbalk() {
        var zoekInput = document.getElementById('persoon-zoek-input');
        var zoekKnop  = document.getElementById('zoek-knop');

        if (!zoekInput) return;

        // Maak een dropdown container aan die onder de zoekbalk verschijnt
        var dropdown = document.createElement('div');
        dropdown.id = 'zoek-dropdown';
        dropdown.style.cssText = [
            'position: absolute',
            'top: 100%',                    // Direct onder de zoeksectie
            'left: 0',
            'right: 0',
            'background: #fff',
            'border: 1px solid #ccc',
            'border-radius: 5px',
            'box-shadow: 0 4px 12px rgba(0,0,0,0.12)',
            'max-height: 240px',
            'overflow-y: auto',
            'z-index: 500',
            'display: none'
        ].join(';');

        // Voeg de dropdown toe aan de zoeksectie (die al position:relative heeft)
        var zoekSectie = zoekInput.closest('.zoek-sectie') || zoekInput.parentNode;
        zoekSectie.appendChild(dropdown);

        // Livesearch: toon resultaten bij elke toetsaanslag
        zoekInput.addEventListener('input', function () {
            var query = zoekInput.value.trim().toLowerCase();
            if (query.length < 1) {
                dropdown.style.display = 'none';    // Verberg dropdown bij leeg veld
                return;
            }
            toonZoekResultaten(query, dropdown, zoekInput);
        });

        // Keyboard navigatie: Enter selecteert eerste resultaat, Escape sluit dropdown
        zoekInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                var eerste = dropdown.querySelector('.zoek-resultaat-item');
                if (eerste) eerste.click();    // Klik het eerste resultaat aan
            }
            if (e.key === 'Escape') {
                dropdown.style.display = 'none';
            }
        });

        // Zoekknop opent de modal met de handmatig ingevulde waarde
        if (zoekKnop) {
            zoekKnop.addEventListener('click', function () {
                var waarde = zoekInput.value.trim();
                if (!waarde) return;
                openNieuweDiscussieModal(waarde, '');
                dropdown.style.display = 'none';
            });
        }

        // Sluit de dropdown als de gebruiker ergens anders klikt
        document.addEventListener('click', function (e) {
            if (!zoekSectie.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    // Toon zoekresultaten in de dropdown op basis van StamboomStorage
    function toonZoekResultaten(query, dropdown, zoekInput) {
        dropdown.innerHTML = '';    // Leeg de dropdown voor nieuwe resultaten

        // Haal alle personen op uit localStorage via StamboomStorage
        var personen = window.StamboomStorage ? window.StamboomStorage.get() : [];

        if (!personen || personen.length === 0) {
            // Geen lokale stamboomdata aanwezig
            dropdown.innerHTML = '<div style="padding:10px;font-size:0.85rem;color:#888;">Geen lokale stamboomdata gevonden.</div>';
            dropdown.style.display = 'block';
            return;
        }

        // Filter personen op naam (roepnaam + achternaam) of ID
        var resultaten = personen.filter(function (p) {
            var naam = ((p.Roepnaam || '') + ' ' + (p.Achternaam || '')).toLowerCase();
            var id   = (p.ID || '').toLowerCase();
            return naam.includes(query) || id.includes(query);
        }).slice(0, 10);    // Beperk tot maximaal 10 resultaten

        if (resultaten.length === 0) {
            dropdown.innerHTML = '<div style="padding:10px;font-size:0.85rem;color:#888;">Geen personen gevonden voor "' + ftSafe(query) + '".</div>';
            dropdown.style.display = 'block';
            return;
        }

        // Render elk zoekresultaat als een klikbare rij
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

            // Toon naam links, ID + geboortejaar rechts
            item.innerHTML =
                '<span>' + ftSafe(naam) + '</span>' +
                '<span style="font-size:0.78rem;color:#999;font-family:monospace;">' +
                    ftSafe(persoonId) +
                    (geboortejr ? ' · ' + ftSafe(geboortejr) : '') +    // Geboortejaar optioneel
                '</span>';

            // Hover effect
            item.addEventListener('mouseenter', function () { item.style.background = '#f0f7ff'; });
            item.addEventListener('mouseleave', function () { item.style.background = ''; });

            // Klik op resultaat: sluit dropdown en open de nieuwe discussie modal
            item.addEventListener('click', function () {
                dropdown.style.display = 'none';
                zoekInput.value = naam;    // Vul het zoekveld met de geselecteerde naam
                openNieuweDiscussieModal(persoonId, naam);
            });

            dropdown.appendChild(item);
        });

        dropdown.style.display = 'block';
    }

    // ---------------------------------------------------------------------------
    // NIEUWE DISCUSSIE MODAL
    // ---------------------------------------------------------------------------

    // Koppel event listeners aan de nieuwe discussie modal
    function koppelModal() {
        var annuleer = document.getElementById('modal-annuleer');
        var bevestig = document.getElementById('modal-bevestig');
        var overlay  = document.getElementById('nieuwe-discussie-modal');

        if (annuleer) annuleer.addEventListener('click', sluitModal);
        if (bevestig) bevestig.addEventListener('click', bevestigNieuweDiscussie);

        // Klik buiten het modal-venster sluit de modal
        if (overlay) {
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) sluitModal();
            });
        }
    }

    // Open de modal met een ingevuld persoon-ID en naam (vanuit livesearch of handmatig)
    function openNieuweDiscussieModal(persoonId, persoonNaam) {
        var modal     = document.getElementById('nieuwe-discussie-modal');
        var idInput   = document.getElementById('modal-persoon-id');
        var naamInput = document.getElementById('modal-persoon-naam');

        if (!modal || !idInput || !naamInput) return;

        idInput.value   = persoonId || '';
        naamInput.value = persoonNaam || '';

        // Zet het ID-veld op readonly als het al ingevuld is vanuit livesearch
        idInput.readOnly = !!persoonId;

        modal.classList.add('actief');

        // Focus op het eerste lege veld voor snelle invoer
        setTimeout(function () {
            (idInput.value ? naamInput : idInput).focus();
        }, 100);
    }

    // Sluit de modal en reset alle invoervelden
    function sluitModal() {
        var modal = document.getElementById('nieuwe-discussie-modal');
        if (modal) modal.classList.remove('actief');
        var idInput   = document.getElementById('modal-persoon-id');
        var naamInput = document.getElementById('modal-persoon-naam');
        if (idInput)   { idInput.value = ''; idInput.readOnly = false; }
        if (naamInput) naamInput.value = '';

        // Reset ook het zoekveld
        var zoekInput = document.getElementById('persoon-zoek-input');
        if (zoekInput) zoekInput.value = '';
    }

    // Verwerk de bevestiging van de nieuwe discussie modal
    function bevestigNieuweDiscussie() {
        var persoonId   = document.getElementById('modal-persoon-id').value.trim();
        var persoonNaam = document.getElementById('modal-persoon-naam').value.trim();

        if (!persoonId || !persoonNaam) {
            alert('Vul zowel het persoon-ID als de naam in.');
            return;
        }

        // Als er al een discussie bestaat voor dit ID, scroll ernaar toe
        if (staat.discussies[persoonId]) {
            sluitModal();
            var bestaand = document.querySelector('[data-persoon-id="' + persoonId + '"]');
            if (bestaand) bestaand.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        // Voeg nieuwe lege discussie toe aan de staat
        staat.discussies[persoonId] = { naam: persoonNaam, berichten: [] };

        // Update de stamboom-teller in de sectie header
        var teller = document.querySelector('.stamboom-sectie-teller');
        var aantalOnderwerpen = Object.keys(staat.discussies).length;
        if (teller) {
            teller.textContent = aantalOnderwerpen + ' onderwerp' +
                (aantalOnderwerpen !== 1 ? 'en' : '');
        }

        // Voeg een nieuwe discussieblok toe aan de container
        var container       = document.getElementById('discussie-container');
        var leegPlaceholder = container ? container.querySelector('.laad-indicator') : null;
        if (leegPlaceholder) leegPlaceholder.remove();    // Verwijder de lege-staat melding

        // Als er nog geen header is (eerste discussie), voeg hem toe
        if (!container.querySelector('.stamboom-sectie-header')) {
            var sectieHeader = maakStamboomSectieHeader(staat.boomNaam, aantalOnderwerpen);
            container.insertBefore(sectieHeader, container.firstChild);
        }

        // Render het nieuwe blok en voeg toe aan de container
        var blok = maakDiscussieBlok(persoonId, persoonNaam, []);
        if (container) container.appendChild(blok);

        sluitModal();

        // Scroll naar het nieuwe discussieblok
        setTimeout(function () {
            blok.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // ---------------------------------------------------------------------------
    // HULPFUNCTIES
    // ---------------------------------------------------------------------------

    // XSS-veilige tekst escaping — gebruik window.ftSafe als beschikbaar (utils.js)
    function ftSafe(tekst) {
        if (window.ftSafe) return window.ftSafe(tekst);    // Gebruik de versie uit utils.js
        return String(tekst || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

})();
