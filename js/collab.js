// =============================================================================
// js/collab.js — Collaboratie berichtenboard
// MyFamTreeCollab v2.2.0
// -----------------------------------------------------------------------------
// Verantwoordelijkheden:
//   - Alle toegankelijke stambomen laden per rol:
//       Owner/Admin → eigen bomen (CloudSync.listStambomen) + gedeeld (ShareModule.listSharedWithMe)
//       Editor/Viewer → alleen gedeelde bomen (ShareModule.listSharedWithMe)
//   - Per boom discussies laden uit collab_messages
//   - Zoekbalk + formulier ALLEEN actief voor de stamboom == activeBoomId in localStorage
//   - Inactieve bomen: lees-only weergave met uitleg banner
//   - Statusicoontjes: 🆕 Nieuw · 🔓 Open · 🔄 In behandeling · ✅ Gesloten
//   - Berichten verwijderen (owner modereert alle, iedereen eigen bericht)
//
// Wijzigingen v2.2.0 (sessie 19):
//   - laadAlleToegankelijkeStambomen() vervangt laadDiscussies()
//   - Owner: eigen bomen via CloudSync + gedeeld via ShareModule
//   - Editor/Viewer: alleen gedeeld via ShareModule
//   - Actieve boom gemarkeerd met badge; zoekbalk + formulier alleen actief daar
//   - Inactieve bomen: lees-only modus met uitleg banner + link naar Opslag
//   - renderAlleStambomen() met sortering (actief eerst, dan alfabetisch)
//   - Rol per boom opgeslagen in staat.bomen voor correcte formulierrechten
//   - verzendBericht() gebruikt rol van de specifieke boom (niet globale tier)
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
    var STATUS_CONFIG = {
        nieuw:         { label: 'Nieuw',          icoon: '🆕', klasse: 'status-nieuw' },
        open:          { label: 'Open',           icoon: '🔓', klasse: 'status-open' },
        inbehandeling: { label: 'In behandeling', icoon: '🔄', klasse: 'status-inbehandeling' },
        gesloten:      { label: 'Gesloten',       icoon: '✅', klasse: 'status-gesloten' }
    };

    var STATUS_FALLBACK = 'nieuw';    // Fallback als status onbekend of leeg is

    // ---------------------------------------------------------------------------
    // STAAT — centrale pagina-staat, nooit globaal lekken
    // ---------------------------------------------------------------------------
    var staat = {
        activeBoomId: null,    // UUID actieve stamboom (uit localStorage)
        boomNaam:     null,    // Naam actieve stamboom
        gebruiker:    null,    // Supabase auth user object
        profiel:      null,    // { username, tier, ... } uit AuthModule.getProfile()
        rol:          null,    // Globale tier van gebruiker (owner/editor/viewer/admin)
        supabase:     null,    // Supabase client instantie
        // Per boom: { [boomId]: { naam, rol, isActief, discussies: { [pid]: { naam, berichten[] } } } }
        bomen: {}
    };

    // ---------------------------------------------------------------------------
    // INITIALISATIE
    // ---------------------------------------------------------------------------

    document.addEventListener('DOMContentLoaded', function () {
        initialiseer();
    });

    async function initialiseer() {

        // Controleer verplichte modules
        if (!window.AuthModule) {
            toonFout('AuthModule niet geladen. Controleer de laadvolgorde.');
            return;
        }
        staat.supabase = window.AuthModule.getClient();    // Gedeelde Supabase client

        if (!window.ShareModule) {
            toonFout('ShareModule niet geladen. Controleer de laadvolgorde.');
            return;
        }

        // Actieve stamboom uit localStorage
        staat.activeBoomId = localStorage.getItem(STORAGE_KEY_BOOM) || null;
        staat.boomNaam     = localStorage.getItem(STORAGE_KEY_NAAM) || 'Onbekende stamboom';

        // Update subtitel met actieve boomnaam
        var subtitel = document.getElementById('actieve-boom-label');
        if (subtitel) {
            subtitel.textContent = staat.activeBoomId
                ? 'Actieve stamboom: ' + ftSafe(staat.boomNaam)
                : 'Geen actieve stamboom — u kunt alleen meelezen.';
        }

        // Controleer of gebruiker ingelogd is
        staat.gebruiker = await window.AuthModule.getUser();
        if (!staat.gebruiker) {
            toonGeenToegang();
            return;
        }

        // Haal profiel op voor weergavenaam in berichten
        var profielResult = await window.AuthModule.getProfile();
        staat.profiel = profielResult.profile || null;

        // Globale tier ophalen uit profiel (owner/editor/viewer/admin)
        staat.rol = staat.profiel ? (staat.profiel.tier || 'viewer') : 'viewer';

        // Toon interface en laad alle toegankelijke bomen
        toonCollabInterface();
        await laadAlleToegankelijkeStambomen();
        koppelModal();
    }

    // ---------------------------------------------------------------------------
    // ALLE TOEGANKELIJKE STAMBOMEN LADEN
    // ---------------------------------------------------------------------------

    // Haalt alle bomen op waar de gebruiker toegang toe heeft,
    // laadt per boom de discussies, slaat op in staat.bomen en rendert alles
    async function laadAlleToegankelijkeStambomen() {
        var bomenLijst = [];    // Accumuleert { id, naam, rol, isActief }

        // --- Stap 1: Eigen bomen (alleen owner/admin via CloudSync) ---
        if (window.CloudSync && ['owner', 'admin'].includes(staat.rol)) {
            var eigenResult = await window.CloudSync.listStambomen();
            if (eigenResult.success && eigenResult.stambomen) {
                eigenResult.stambomen.forEach(function (b) {
                    bomenLijst.push({
                        id:      b.id,
                        naam:    b.naam,
                        rol:     'owner',                              // Eigenaar heeft altijd owner-rol
                        isActief: b.id === staat.activeBoomId          // Markeer actieve boom
                    });
                });
            }
        }

        // --- Stap 2: Gedeelde bomen (alle rollen via ShareModule) ---
        var gedeeldResult = await window.ShareModule.listSharedWithMe();
        if (!gedeeldResult.error && gedeeldResult.data) {
            gedeeldResult.data.forEach(function (b) {
                // Voorkom dubbele vermeldingen (eigenaar die ook in gedeeld staat)
                var bestaatAl = bomenLijst.some(function (x) { return x.id === b.stamboom_id; });
                if (!bestaatAl) {
                    bomenLijst.push({
                        id:      b.stamboom_id,
                        naam:    b.naam,
                        rol:     b.rol,                                // 'viewer' of 'editor'
                        isActief: b.stamboom_id === staat.activeBoomId
                    });
                }
            });
        }

        // Geen bomen gevonden
        if (bomenLijst.length === 0) {
            verbergLaadIndicator();
            var container = document.getElementById('discussie-container');
            if (container) {
                container.innerHTML =
                    '<div class="laad-indicator">' +
                        'Geen toegankelijke stambomen gevonden. ' +
                        'Vraag een eigenaar om je uit te nodigen, of ' +
                        '<a href="/MyFamTreeCollab/stamboom/storage.html">laad een stamboom</a>.' +
                    '</div>';
            }
            return;
        }

        // --- Stap 3: Per boom de discussies laden ---
        for (var i = 0; i < bomenLijst.length; i++) {
            var boom = bomenLijst[i];
            var discussies = await laadDiscussiesVoorBoom(boom.id);
            staat.bomen[boom.id] = {
                naam:      boom.naam,
                rol:       boom.rol,
                isActief:  boom.isActief,
                discussies: discussies
            };
        }

        verbergLaadIndicator();

        // --- Stap 4: Alles renderen ---
        renderAlleStambomen();
    }

    // Laad alle berichten voor één boom, gegroepeerd per persoon_id
    // @returns { [persoonId]: { naam, berichten[] } }
    async function laadDiscussiesVoorBoom(boomId) {
        var result = await staat.supabase
            .from('collab_messages')
            .select('*')
            .eq('boom_id', boomId)
            .order('persoon_id',    { ascending: true })
            .order('aangemaakt_op', { ascending: true });

        if (result.error) {
            console.warn('[collab] berichten laden mislukt voor boom', boomId, result.error.message);
            return {};
        }

        var groepen = {};
        (result.data || []).forEach(function (b) {
            var pid = b.persoon_id;
            if (!groepen[pid]) groepen[pid] = { naam: b.persoon_naam, berichten: [] };
            groepen[pid].berichten.push(b);    // Voeg bericht toe aan groep van deze persoon
        });
        return groepen;
    }

    // ---------------------------------------------------------------------------
    // RENDEREN — ALLE STAMBOMEN
    // ---------------------------------------------------------------------------

    // Render alle stamboomsecties in de container
    function renderAlleStambomen() {
        var container = document.getElementById('discussie-container');
        if (!container) return;
        container.innerHTML = '';

        var boomIds = Object.keys(staat.bomen);

        if (boomIds.length === 0) {
            container.innerHTML = '<div class="laad-indicator">Geen stambomen gevonden.</div>';
            return;
        }

        // Sorteer: actieve boom bovenaan, daarna alfabetisch op naam
        boomIds.sort(function (a, b) {
            var ba = staat.bomen[a], bb = staat.bomen[b];
            if (ba.isActief && !bb.isActief) return -1;
            if (!ba.isActief && bb.isActief) return 1;
            return ba.naam.localeCompare(bb.naam);
        });

        boomIds.forEach(function (boomId) {
            var sectie = maakStamboomSectie(boomId, staat.bomen[boomId]);
            container.appendChild(sectie);
        });
    }

    // Maak een volledige stamboom-sectie: header + optionele zoekbalk + discussieblokken
    function maakStamboomSectie(boomId, boom) {
        var sectie = document.createElement('div');
        sectie.className = 'stamboom-sectie' + (boom.isActief ? ' stamboom-actief' : ' stamboom-inactief');
        sectie.dataset.boomId = boomId;

        var aantalOnderwerpen = Object.keys(boom.discussies).length;

        // --- Sectie header ---
        var header = document.createElement('div');
        header.className = 'stamboom-sectie-header';

        // Rol-badge: toont de rol van de gebruiker voor deze specifieke boom
        var rolBadgeHtml = '<span class="boom-rol-badge boom-rol-' + ftSafe(boom.rol) + '">' +
            rolLabel(boom.rol) + '</span>';

        // Actief/inactief badge
        var statusBadgeHtml = boom.isActief
            ? '<span class="boom-actief-badge">✓ Actief</span>'
            : '<span class="boom-inactief-hint">Alleen lezen</span>';

        header.innerHTML =
            '<span class="stamboom-sectie-icoon">📚</span>' +
            '<span class="stamboom-sectie-naam">' + ftSafe(boom.naam) + '</span>' +
            rolBadgeHtml +
            statusBadgeHtml +
            '<span class="stamboom-sectie-teller" data-boom-id="' + ftSafe(boomId) + '">' +
                aantalOnderwerpen + ' onderwerp' + (aantalOnderwerpen !== 1 ? 'en' : '') +
            '</span>';

        sectie.appendChild(header);

        // --- Inactief-banner: uitleg met link naar Opslag ---
        if (!boom.isActief) {
            var banner = document.createElement('div');
            banner.className = 'inactief-banner';
            banner.innerHTML =
                '💡 Laad deze stamboom via ' +
                '<a href="/MyFamTreeCollab/stamboom/storage.html">Opslag</a> ' +
                'om nieuwe discussies te starten of te reageren.';
            sectie.appendChild(banner);
        }

        // --- Zoekbalk: alleen voor actieve boom ---
        if (boom.isActief) {
            var zoekSectie = document.createElement('div');
            zoekSectie.className = 'zoek-sectie';
            zoekSectie.id = 'zoek-sectie-' + boomId;
            zoekSectie.innerHTML =
                '<span class="zoek-label">Voeg een persoon toe aan de discussie:</span>' +
                '<input type="text" class="persoon-zoek-input" ' +
                    'data-boom-id="' + ftSafe(boomId) + '" ' +
                    'placeholder="Zoek op naam of ID…" autocomplete="off">' +
                '<button class="knop-primair zoek-knop" data-boom-id="' + ftSafe(boomId) + '">' +
                    'Discussie starten' +
                '</button>';
            sectie.appendChild(zoekSectie);

            // Koppel livesearch na DOM-insert
            setTimeout(function () { koppelZoekbalkVoorBoom(boomId, zoekSectie); }, 0);
        }

        // --- Discussieblokken ---
        var innerContainer = document.createElement('div');
        innerContainer.className = 'discussie-container-inner';
        innerContainer.id = 'discussies-' + boomId;

        var persoonIds = Object.keys(boom.discussies);

        if (persoonIds.length === 0) {
            innerContainer.innerHTML =
                '<div class="laad-indicator" style="padding:16px 0;">' +
                    (boom.isActief
                        ? 'Nog geen discussies. Start er één via de zoekbalk hierboven.'
                        : 'Nog geen discussies in deze stamboom.') +
                '</div>';
        } else {
            persoonIds.forEach(function (pid) {
                var groep = boom.discussies[pid];
                var blok  = maakDiscussieBlok(boomId, pid, groep.naam, groep.berichten, boom.isActief, boom.rol);
                innerContainer.appendChild(blok);
            });
        }

        sectie.appendChild(innerContainer);
        return sectie;
    }

    // ---------------------------------------------------------------------------
    // DISCUSSIEBLOK
    // ---------------------------------------------------------------------------

    // Maak een discussieblok voor één persoon binnen een stamboom
    function maakDiscussieBlok(boomId, persoonId, persoonNaam, berichten, isActief, rolVoorDezeBoom) {
        var blok = document.createElement('div');
        blok.className = 'discussie-blok';
        blok.dataset.persoonId = persoonId;
        blok.dataset.boomId    = boomId;

        // Huidige status = status van het laatste bericht, of fallback
        var huidigStatus = berichten.length > 0
            ? (berichten[berichten.length - 1].status || STATUS_FALLBACK)
            : STATUS_FALLBACK;
        if (!STATUS_CONFIG[huidigStatus]) huidigStatus = STATUS_FALLBACK;

        var statusConf = STATUS_CONFIG[huidigStatus];

        // --- Header ---
        var header = document.createElement('div');
        header.className = 'discussie-header';
        header.innerHTML =
            '<div style="display:flex;align-items:center;flex:1;min-width:0;">' +
                '<span class="discussie-persoon-naam">' + ftSafe(persoonNaam) + '</span>' +
                '<span class="discussie-persoon-id">' + ftSafe(persoonId) + '</span>' +
            '</div>' +
            '<span class="status-badge ' + statusConf.klasse + '">' +
                statusConf.icoon + ' ' + statusConf.label +
            '</span>' +
            '<span class="discussie-toggle-pijl">▼</span>';

        header.addEventListener('click', function () {
            blok.classList.toggle('ingeklapt');
        });

        // --- Body ---
        var body = document.createElement('div');
        body.className = 'discussie-body';

        var lijst = maakBerichtenLijst(berichten, boomId, persoonId);
        body.appendChild(lijst);

        // Formulier alleen voor actieve boom, lees-only melding voor inactieve boom
        if (isActief) {
            body.appendChild(maakNieuwBerichtForm(boomId, persoonId, huidigStatus, blok, lijst, rolVoorDezeBoom));
        } else {
            var leesOnly = document.createElement('div');
            leesOnly.className = 'lees-only-melding';
            leesOnly.textContent = '🔒 Activeer deze stamboom om te reageren.';
            body.appendChild(leesOnly);
        }

        blok.appendChild(header);
        blok.appendChild(body);
        return blok;
    }

    // Maak scrollbare berichtenlijst
    function maakBerichtenLijst(berichten, boomId, persoonId) {
        var lijst = document.createElement('div');
        lijst.className = 'bericht-lijst';
        lijst.id = 'lijst-' + boomId + '-' + persoonId;    // Uniek ID per boom+persoon

        if (berichten.length === 0) {
            lijst.innerHTML = '<div class="bericht-leeg">Nog geen berichten in deze discussie.</div>';
            return lijst;
        }

        berichten.forEach(function (b) { lijst.appendChild(maakBerichtItem(b)); });
        setTimeout(function () { lijst.scrollTop = lijst.scrollHeight; }, 50);
        return lijst;
    }

    // Maak één bericht-item DOM element
    function maakBerichtItem(bericht) {
        var isEigen = staat.gebruiker && bericht.user_id === staat.gebruiker.id;
        var isOwner = ['owner', 'admin'].includes(staat.rol);

        var item = document.createElement('div');
        item.className = 'bericht-item' + (isEigen ? ' eigen' : '');
        item.dataset.id = bericht.id;

        var tijdstip = bericht.aangemaakt_op
            ? new Date(bericht.aangemaakt_op).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })
            : '';

        var voornaam = (bericht.auteur_naam || 'Onbekend').split(' ')[0];    // Eerste woord = voornaam

        var berichtStatusConf = STATUS_CONFIG[bericht.status] || STATUS_CONFIG[STATUS_FALLBACK];

        var magVerwijderen = isOwner || isEigen;
        var verwijderHtml  = magVerwijderen
            ? '<button class="bericht-verwijder" data-id="' + bericht.id + '" title="Verwijderen">✕</button>'
            : '';

        var diffHtml = bericht.diff_voorstel
            ? '<div class="diff-blok"><strong>📝 Wijzigingsvoorstel:</strong><br>' +
              ftSafe(bericht.diff_voorstel) + '</div>'
            : '';

        item.innerHTML =
            '<div class="bericht-meta">' +
                '<span>' +
                    '<span class="bericht-auteur">' + ftSafe(voornaam) + '</span>' +
                    '<span class="rol-label rol-' + ftSafe(bericht.rol) + '">' + ftSafe(bericht.rol) + '</span>' +
                '</span>' +
                '<span style="display:flex;align-items:center;gap:6px;">' +
                    '<span style="font-size:0.75rem;color:#bbb;">' + ftSafe(tijdstip) + '</span>' +
                    '<span class="bericht-status-icoon" title="' + ftSafe(berichtStatusConf.label) + '">' +
                        berichtStatusConf.icoon + '</span>' +
                    verwijderHtml +
                '</span>' +
            '</div>' +
            '<div class="bericht-tekst">' + ftSafe(bericht.bericht) + '</div>' +
            diffHtml;

        if (magVerwijderen) {
            var knop = item.querySelector('.bericht-verwijder');
            if (knop) {
                knop.addEventListener('click', function (e) {
                    e.stopPropagation();
                    verwijderBericht(bericht.id, item);
                });
            }
        }

        return item;
    }

    // Maak formulier voor nieuw bericht (alleen voor actieve boom)
    function maakNieuwBerichtForm(boomId, persoonId, huidigStatus, blokEl, lijstEl, rolVoorDezeBoom) {
        var form = document.createElement('div');
        form.className = 'nieuw-bericht-form';

        var kanStatusWijzigen = ['owner', 'editor', 'admin'].includes(rolVoorDezeBoom);

        // Bouw status-opties voor alle 4 statussen
        var statusOptiesHtml = '';
        Object.keys(STATUS_CONFIG).forEach(function (sleutel) {
            var conf = STATUS_CONFIG[sleutel];
            statusOptiesHtml += '<option value="' + sleutel + '"' +
                (sleutel === huidigStatus ? ' selected' : '') + '>' +
                conf.icoon + ' ' + conf.label + '</option>';
        });

        var statusSelectHtml = kanStatusWijzigen
            ? '<select class="status-select">' + statusOptiesHtml + '</select>'
            : '';

        var kanDiff = ['owner', 'editor', 'admin'].includes(rolVoorDezeBoom);
        var diffToggleHtml = kanDiff
            ? '<button class="knop-diff-toggle" type="button">📝 Wijziging voorstellen</button>' +
              '<div class="diff-invoer-wrapper"><label>Beschrijf de voorgestelde wijziging:</label>' +
              '<textarea placeholder="bijv. Geboortedatum was 1923, niet 1932…"></textarea></div>'
            : '';

        form.innerHTML =
            '<textarea placeholder="Schrijf een bericht…" maxlength="1000"></textarea>' +
            '<div class="form-acties">' + statusSelectHtml + diffToggleHtml +
            '<button class="knop-verzend" type="button">Versturen</button></div>';

        var diffToggle  = form.querySelector('.knop-diff-toggle');
        var diffWrapper = form.querySelector('.diff-invoer-wrapper');
        if (diffToggle && diffWrapper) {
            diffToggle.addEventListener('click', function () {
                diffWrapper.classList.toggle('zichtbaar');
                diffToggle.textContent = diffWrapper.classList.contains('zichtbaar')
                    ? '✕ Wijziging annuleren' : '📝 Wijziging voorstellen';
            });
        }

        var textarea     = form.querySelector('textarea');
        var verzendKnop  = form.querySelector('.knop-verzend');
        var statusSelect = form.querySelector('.status-select');
        var diffTextarea = diffWrapper ? diffWrapper.querySelector('textarea') : null;

        verzendKnop.addEventListener('click', async function () {
            var tekst = textarea.value.trim();
            if (!tekst) return;

            var nieuweStatus = statusSelect ? statusSelect.value : huidigStatus;
            var diffVoorstel = (diffTextarea && diffWrapper && diffWrapper.classList.contains('zichtbaar'))
                ? diffTextarea.value.trim() : null;

            verzendKnop.disabled    = true;
            verzendKnop.textContent = 'Bezig…';

            var result = await verzendBericht(boomId, persoonId, tekst, nieuweStatus, diffVoorstel);

            verzendKnop.disabled    = false;
            verzendKnop.textContent = 'Versturen';

            if (!result.success) { toonFout('Bericht verzenden mislukt: ' + result.error); return; }

            var leegEl = lijstEl.querySelector('.bericht-leeg');
            if (leegEl) leegEl.remove();

            lijstEl.appendChild(maakBerichtItem(result.data));
            lijstEl.scrollTop = lijstEl.scrollHeight;

            textarea.value = '';
            if (diffTextarea) diffTextarea.value = '';
            if (diffWrapper)  diffWrapper.classList.remove('zichtbaar');
            if (diffToggle)   diffToggle.textContent = '📝 Wijziging voorstellen';

            // Update statusbadge in blok-header
            var badge = blokEl.querySelector('.status-badge');
            if (badge) {
                var nieuweConf = STATUS_CONFIG[nieuweStatus] || STATUS_CONFIG[STATUS_FALLBACK];
                badge.textContent = nieuweConf.icoon + ' ' + nieuweConf.label;
                badge.className   = 'status-badge ' + nieuweConf.klasse;
            }
            huidigStatus = nieuweStatus;
        });

        return form;
    }

    // ---------------------------------------------------------------------------
    // SUPABASE SCHRIJFACTIES
    // ---------------------------------------------------------------------------

    async function verzendBericht(boomId, persoonId, tekst, status, diffVoorstel) {
        var auteurNaam = (staat.profiel && staat.profiel.username)
            ? staat.profiel.username
            : (staat.gebruiker ? staat.gebruiker.email : 'Onbekend');

        var persoonNaam = (staat.bomen[boomId] && staat.bomen[boomId].discussies[persoonId])
            ? staat.bomen[boomId].discussies[persoonId].naam
            : persoonId;

        // Gebruik de rol van déze specifieke boom (niet de globale tier)
        var rolVoorDezeBoom = staat.bomen[boomId] ? staat.bomen[boomId].rol : staat.rol;

        var record = {
            boom_id:       boomId,
            persoon_id:    persoonId,
            persoon_naam:  persoonNaam,
            user_id:       staat.gebruiker.id,
            auteur_naam:   auteurNaam,
            rol:           rolVoorDezeBoom,    // Rol voor deze boom specifiek
            bericht:       tekst,
            diff_voorstel: diffVoorstel || null,
            status:        status
        };

        var result = await staat.supabase
            .from('collab_messages')
            .insert([record])
            .select()
            .single();

        if (result.error) return { success: false, data: null, error: result.error.message };

        // Sla ook op in lokale staat voor consistentie
        if (staat.bomen[boomId] && staat.bomen[boomId].discussies[persoonId]) {
            staat.bomen[boomId].discussies[persoonId].berichten.push(result.data);
        }

        return { success: true, data: result.data, error: null };
    }

    async function verwijderBericht(berichtId, itemEl) {
        if (!confirm('Dit bericht verwijderen?')) return;

        var result = await staat.supabase
            .from('collab_messages')
            .delete()
            .eq('id', berichtId);

        if (result.error) { toonFout('Verwijderen mislukt: ' + result.error.message); return; }
        itemEl.remove();
    }

    // ---------------------------------------------------------------------------
    // PERSOON-ZOEKER — livesearch per actieve boom
    // ---------------------------------------------------------------------------

    // Koppel zoekbalk aan een specifieke boom-sectie
    function koppelZoekbalkVoorBoom(boomId, zoekSectie) {
        var zoekInput = zoekSectie.querySelector('.persoon-zoek-input');
        var zoekKnop  = zoekSectie.querySelector('.zoek-knop');
        if (!zoekInput) return;

        // Dropdown container — gepositioneerd onder de zoekbalk
        var dropdown = document.createElement('div');
        dropdown.className = 'zoek-dropdown';
        dropdown.style.cssText =
            'position:absolute;top:100%;left:0;right:0;background:#fff;' +
            'border:1px solid #ccc;border-radius:5px;' +
            'box-shadow:0 4px 12px rgba(0,0,0,0.12);max-height:240px;' +
            'overflow-y:auto;z-index:500;display:none;';
        zoekSectie.appendChild(dropdown);

        zoekInput.addEventListener('input', function () {
            var query = zoekInput.value.trim().toLowerCase();
            if (query.length < 1) { dropdown.style.display = 'none'; return; }
            toonZoekResultaten(query, dropdown, zoekInput, boomId);
        });

        zoekInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                var eerste = dropdown.querySelector('.zoek-resultaat-item');
                if (eerste) eerste.click();
            }
            if (e.key === 'Escape') dropdown.style.display = 'none';
        });

        if (zoekKnop) {
            zoekKnop.addEventListener('click', function () {
                var waarde = zoekInput.value.trim();
                if (!waarde) return;
                openNieuweDiscussieModal(boomId, waarde, '');
                dropdown.style.display = 'none';
            });
        }

        document.addEventListener('click', function (e) {
            if (!zoekSectie.contains(e.target)) dropdown.style.display = 'none';
        });
    }

    // Toon zoekresultaten uit StamboomStorage
    function toonZoekResultaten(query, dropdown, zoekInput, boomId) {
        dropdown.innerHTML = '';

        var personen = window.StamboomStorage ? window.StamboomStorage.get() : [];

        if (!personen || personen.length === 0) {
            dropdown.innerHTML = '<div style="padding:10px;font-size:0.85rem;color:#888;">Geen lokale stamboomdata gevonden.</div>';
            dropdown.style.display = 'block';
            return;
        }

        var resultaten = personen.filter(function (p) {
            var naam = ((p.Roepnaam || '') + ' ' + (p.Achternaam || '')).toLowerCase();
            var id   = (p.ID || '').toLowerCase();
            return naam.includes(query) || id.includes(query);
        }).slice(0, 10);    // Max 10 resultaten

        if (resultaten.length === 0) {
            dropdown.innerHTML = '<div style="padding:10px;font-size:0.85rem;color:#888;">Geen personen gevonden voor "' + ftSafe(query) + '".</div>';
            dropdown.style.display = 'block';
            return;
        }

        resultaten.forEach(function (p) {
            var naam     = ((p.Roepnaam || '') + ' ' + (p.Prefix || '') + ' ' + (p.Achternaam || '')).trim();
            var pid      = p.ID || '';
            var geboorte = p.Geboortedatum ? p.Geboortedatum.substring(0, 4) : '';

            var item = document.createElement('div');
            item.className = 'zoek-resultaat-item';
            item.style.cssText = 'padding:9px 12px;cursor:pointer;font-size:0.88rem;' +
                'border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;';
            item.innerHTML =
                '<span>' + ftSafe(naam) + '</span>' +
                '<span style="font-size:0.78rem;color:#999;font-family:monospace;">' +
                    ftSafe(pid) + (geboorte ? ' · ' + ftSafe(geboorte) : '') + '</span>';

            item.addEventListener('mouseenter', function () { item.style.background = '#f0f7ff'; });
            item.addEventListener('mouseleave', function () { item.style.background = ''; });

            item.addEventListener('click', function () {
                dropdown.style.display = 'none';
                zoekInput.value = naam;
                openNieuweDiscussieModal(boomId, pid, naam);
            });

            dropdown.appendChild(item);
        });

        dropdown.style.display = 'block';
    }

    // ---------------------------------------------------------------------------
    // NIEUWE DISCUSSIE MODAL
    // ---------------------------------------------------------------------------

    function koppelModal() {
        var annuleer = document.getElementById('modal-annuleer');
        var bevestig = document.getElementById('modal-bevestig');
        var overlay  = document.getElementById('nieuwe-discussie-modal');

        if (annuleer) annuleer.addEventListener('click', sluitModal);
        if (bevestig) bevestig.addEventListener('click', bevestigNieuweDiscussie);

        if (overlay) {
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) sluitModal();
            });
        }
    }

    // Open modal voor een specifieke boom
    function openNieuweDiscussieModal(boomId, persoonId, persoonNaam) {
        var modal     = document.getElementById('nieuwe-discussie-modal');
        var idInput   = document.getElementById('modal-persoon-id');
        var naamInput = document.getElementById('modal-persoon-naam');
        if (!modal || !idInput || !naamInput) return;

        idInput.value    = persoonId || '';
        naamInput.value  = persoonNaam || '';
        idInput.readOnly = !!persoonId;
        modal.dataset.boomId = boomId;    // Bewaar boomId op het modal element

        modal.classList.add('actief');
        setTimeout(function () { (idInput.value ? naamInput : idInput).focus(); }, 100);
    }

    function sluitModal() {
        var modal = document.getElementById('nieuwe-discussie-modal');
        if (modal) { modal.classList.remove('actief'); modal.dataset.boomId = ''; }
        var idInput   = document.getElementById('modal-persoon-id');
        var naamInput = document.getElementById('modal-persoon-naam');
        if (idInput)   { idInput.value = ''; idInput.readOnly = false; }
        if (naamInput)  naamInput.value = '';
        document.querySelectorAll('.persoon-zoek-input').forEach(function (el) { el.value = ''; });
    }

    function bevestigNieuweDiscussie() {
        var modal       = document.getElementById('nieuwe-discussie-modal');
        var boomId      = modal ? modal.dataset.boomId : null;
        var persoonId   = document.getElementById('modal-persoon-id').value.trim();
        var persoonNaam = document.getElementById('modal-persoon-naam').value.trim();

        if (!persoonId || !persoonNaam) {
            alert('Vul zowel het persoon-ID als de naam in.');
            return;
        }
        if (!boomId || !staat.bomen[boomId]) {
            alert('Stamboom niet gevonden. Vernieuw de pagina.');
            return;
        }

        // Scroll naar bestaande discussie
        if (staat.bomen[boomId].discussies[persoonId]) {
            sluitModal();
            var bestaand = document.querySelector('[data-boom-id="' + boomId + '"][data-persoon-id="' + persoonId + '"]');
            if (bestaand) bestaand.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        // Nieuwe discussie toevoegen
        staat.bomen[boomId].discussies[persoonId] = { naam: persoonNaam, berichten: [] };

        // Update teller
        var teller = document.querySelector('.stamboom-sectie-teller[data-boom-id="' + boomId + '"]');
        var aantalOnderwerpen = Object.keys(staat.bomen[boomId].discussies).length;
        if (teller) teller.textContent = aantalOnderwerpen + ' onderwerp' + (aantalOnderwerpen !== 1 ? 'en' : '');

        // Verwijder lege-staat placeholder en voeg blok toe
        var innerContainer = document.getElementById('discussies-' + boomId);
        if (innerContainer) {
            var leeg = innerContainer.querySelector('.laad-indicator');
            if (leeg) leeg.remove();
            var blok = maakDiscussieBlok(
                boomId, persoonId, persoonNaam, [],
                staat.bomen[boomId].isActief,
                staat.bomen[boomId].rol
            );
            innerContainer.appendChild(blok);
        }

        sluitModal();
        setTimeout(function () {
            var nieuw = document.querySelector('[data-boom-id="' + boomId + '"][data-persoon-id="' + persoonId + '"]');
            if (nieuw) nieuw.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // ---------------------------------------------------------------------------
    // INTERFACE HULPFUNCTIES
    // ---------------------------------------------------------------------------

    function toonGeenToegang() {
        verbergLaadIndicator();
        var el = document.getElementById('geen-toegang-blok');
        if (el) el.style.display = 'block';
        var iface = document.getElementById('collab-interface');
        if (iface) iface.style.display = 'none';
    }

    function toonCollabInterface() {
        var el = document.getElementById('geen-toegang-blok');
        if (el) el.style.display = 'none';
        var iface = document.getElementById('collab-interface');
        if (iface) iface.style.display = 'block';
    }

    function verbergLaadIndicator() {
        var ind = document.getElementById('laad-indicator');
        if (ind) ind.style.display = 'none';
    }

    function toonFout(html) {
        var container = document.getElementById('fout-container');
        if (!container) return;
        container.style.display = 'block';
        container.innerHTML = '<div class="fout-melding">' + html + '</div>';
    }

    // Leesbare rolnaam voor de badge
    function rolLabel(rol) {
        var labels = { owner: '👑 Owner', editor: '✏️ Editor', viewer: '👁 Viewer', admin: '⚙️ Admin' };
        return labels[rol] || rol;
    }

    // XSS-veilige escaping
    function ftSafe(tekst) {
        if (window.ftSafe) return window.ftSafe(tekst);
        return String(tekst || '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

})();
