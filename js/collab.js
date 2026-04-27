// =============================================================================
// js/collab.js — Collaboratie berichtenboard
// MyFamTreeCollab v2.3.0
// -----------------------------------------------------------------------------
// Verantwoordelijkheden:
//   - Alle toegankelijke stambomen laden per rol:
//       Owner/Admin → eigen bomen (CloudSync.listStambomen) + gedeeld (ShareModule.listSharedWithMe)
//       Editor/Viewer → alleen gedeelde bomen (ShareModule.listSharedWithMe)
//   - Per boom discussies laden uit collab_messages
//   - Zoekbalk + formulier ALLEEN actief voor de actieve boom
//   - Inactieve bomen: lees-only weergave met uitleg banner
//   - Statusicoontjes: 🆕 Nieuw · 🔓 Open · 🔄 In behandeling · ✅ Gesloten
//
// Wijzigingen v2.3.0 (sessie 19 — bugfix):
//   - activeBoomId === null fallback: als localStorage leeg is, wordt de eerste
//     eigen boom automatisch als actief beschouwd (owner zonder actieve boom)
//   - bepaalActiveBoom() centrale functie voor actief-markering
//   - Livesearch werkt altijd op StamboomStorage.get() ongeacht activeBoomId
//   - Zoekbalk gerenderd voor alle bomen waar gebruiker editor/owner van is,
//     niet alleen de stam die toevallig in localStorage staat
//
// Wijzigingen v2.2.0:
//   - laadAlleToegankelijkeStambomen() — alle bomen per rol
//   - renderAlleStambomen() met sortering
//   - Rol per boom in staat.bomen
//
// Afhankelijkheden (verplichte laadvolgorde):
//   supabase-js → utils.js → schema.js → storage.js → auth.js →
//   cloudSync.js → shareModule.js → accessGuard.js → collab.js
// =============================================================================

(function () {
    'use strict';

    // ---------------------------------------------------------------------------
    // CONSTANTEN
    // ---------------------------------------------------------------------------
    var STORAGE_KEY_BOOM = 'stamboomActiefId';    // localStorage key voor actieve boom UUID (conform storage.js)
    var STORAGE_KEY_NAAM = 'stamboomActiefNaam'; // localStorage key voor boomnaam (conform storage.js)

    // Status definities: waarde → { label, icoon, css-klasse }
    var STATUS_CONFIG = {
        nieuw:         { label: 'Nieuw',          icoon: '🆕', klasse: 'status-nieuw' },
        open:          { label: 'Open',           icoon: '🔓', klasse: 'status-open' },
        inbehandeling: { label: 'In behandeling', icoon: '🔄', klasse: 'status-inbehandeling' },
        gesloten:      { label: 'Gesloten',       icoon: '✅', klasse: 'status-gesloten' }
    };

    var STATUS_FALLBACK = 'nieuw';    // Fallback als status onbekend of leeg is

    // ---------------------------------------------------------------------------
    // STAAT
    // ---------------------------------------------------------------------------
    var staat = {
        activeBoomId: null,    // UUID actieve stamboom — kan null zijn, zie bepaalActiveBoom()
        boomNaam:     null,    // Naam actieve stamboom
        gebruiker:    null,    // Supabase auth user object
        profiel:      null,    // { username, tier, ... }
        rol:          null,    // Globale tier (owner/editor/viewer/admin)
        supabase:     null,    // Supabase client
        // { [boomId]: { naam, rol, isActief, discussies: { [pid]: { naam, berichten[] } } } }
        bomen: {}
    };

    // ---------------------------------------------------------------------------
    // INITIALISATIE
    // ---------------------------------------------------------------------------

    document.addEventListener('DOMContentLoaded', function () {
        initialiseer();
    });

    async function initialiseer() {

        if (!window.AuthModule) {
            toonFout('AuthModule niet geladen. Controleer de laadvolgorde.');
            return;
        }
        staat.supabase = window.AuthModule.getClient();

        if (!window.ShareModule) {
            toonFout('ShareModule niet geladen. Controleer de laadvolgorde.');
            return;
        }

        // Lees activeBoomId uit localStorage — kan null zijn (zie bepaalActiveBoom() later)
        staat.activeBoomId = localStorage.getItem(STORAGE_KEY_BOOM) || null;
        staat.boomNaam     = localStorage.getItem(STORAGE_KEY_NAAM) || null;

        // Controleer of gebruiker ingelogd is
        staat.gebruiker = await window.AuthModule.getUser();
        if (!staat.gebruiker) {
            toonGeenToegang();
            return;
        }

        // Profiel ophalen voor weergavenaam en tier
        var profielResult = await window.AuthModule.getProfile();
        staat.profiel = profielResult.profile || null;
        staat.rol     = staat.profiel ? (staat.profiel.tier || 'viewer') : 'viewer';

        toonCollabInterface();
        await laadAlleToegankelijkeStambomen();
        koppelModal();
    }

    // ---------------------------------------------------------------------------
    // ACTIEVE BOOM BEPALEN
    // ---------------------------------------------------------------------------

    // Bepaalt welke boom als "actief" wordt gemarkeerd.
    // Logica (in volgorde van prioriteit):
    //   1. Als activeBoomId in localStorage staat én die boom in de lijst zit → gebruik die
    //   2. Als activeBoomId null is maar er zijn eigen bomen (owner) → eerste eigen boom is actief
    //   3. Als er alleen gedeelde bomen zijn → geen actieve boom (lees-only alles)
    // @param {Array} bomenLijst — [{ id, naam, rol, ... }]
    // @returns {string|null} — UUID van de actieve boom, of null
    function bepaalActiveBoom(bomenLijst) {
        if (!bomenLijst || bomenLijst.length === 0) return null;

        // Stap 1: localStorage-waarde staat in de lijst
        if (staat.activeBoomId) {
            var gevonden = bomenLijst.some(function (b) { return b.id === staat.activeBoomId; });
            if (gevonden) return staat.activeBoomId;
        }

        // Stap 2: geen activeBoomId → eerste eigen boom (owner/admin) als fallback
        var eigeneBoom = bomenLijst.find(function (b) {
            return b.rol === 'owner' || b.rol === 'admin';
        });
        if (eigeneBoom) {
            console.log('[collab] activeBoomId was null — fallback naar eerste eigen boom:', eigeneBoom.id);
            return eigeneBoom.id;    // Markeer als actief maar schrijf NIET terug naar localStorage
        }

        // Stap 3: alleen gedeelde bomen, geen eigenaar-boom → geen actief
        return null;
    }

    // ---------------------------------------------------------------------------
    // ALLE TOEGANKELIJKE STAMBOMEN LADEN
    // ---------------------------------------------------------------------------

    async function laadAlleToegankelijkeStambomen() {
        var bomenLijst = [];    // Accumuleert { id, naam, rol }

        // --- Stap 1: Eigen bomen voor owner/admin via CloudSync ---
        if (window.CloudSync && ['owner', 'admin'].includes(staat.rol)) {
            var eigenResult = await window.CloudSync.listStambomen();
            if (eigenResult.success && eigenResult.stambomen) {
                eigenResult.stambomen.forEach(function (b) {
                    bomenLijst.push({ id: b.id, naam: b.naam, rol: 'owner' });
                });
            } else {
                console.warn('[collab] CloudSync.listStambomen() mislukt:', eigenResult.error);
            }
        }

        // --- Stap 2: Gedeelde bomen voor alle rollen via ShareModule ---
        var gedeeldResult = await window.ShareModule.listSharedWithMe();
        if (!gedeeldResult.error && gedeeldResult.data) {
            gedeeldResult.data.forEach(function (b) {
                // Voorkom dubbelen (eigenaar kan ook als gedeeld staan)
                var bestaatAl = bomenLijst.some(function (x) { return x.id === b.stamboom_id; });
                if (!bestaatAl) {
                    bomenLijst.push({ id: b.stamboom_id, naam: b.naam, rol: b.rol });
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

        // --- Stap 3: Actieve boom bepalen (ook als activeBoomId null was) ---
        var actieveId = bepaalActiveBoom(bomenLijst);

        // --- Stap 4: Subtitel bijwerken met naam van actieve boom ---
        var actieveBoom = actieveId ? bomenLijst.find(function (b) { return b.id === actieveId; }) : null;
        var subtitel = document.getElementById('actieve-boom-label');
        if (subtitel) {
            subtitel.textContent = actieveBoom
                ? 'Actieve stamboom: ' + ftSafe(actieveBoom.naam)
                : 'Geen actieve stamboom — u kunt alleen meelezen.';
        }

        // --- Stap 5: Per boom de discussies laden en opslaan in staat.bomen ---
        for (var i = 0; i < bomenLijst.length; i++) {
            var boom = bomenLijst[i];
            var discussies = await laadDiscussiesVoorBoom(boom.id);
            staat.bomen[boom.id] = {
                naam:      boom.naam,
                rol:       boom.rol,
                isActief:  boom.id === actieveId,    // Markering op basis van bepaalActiveBoom()
                discussies: discussies
            };
        }

        verbergLaadIndicator();

        // --- Stap 6: Alles renderen ---
        renderAlleStambomen();
    }

    // Laad berichten voor één boom, gegroepeerd per persoon_id
    async function laadDiscussiesVoorBoom(boomId) {
        var result = await staat.supabase
            .from('collab_messages')
            .select('*')
            .eq('boom_id', boomId)
            .order('persoon_id',  { ascending: true })
            .order('created_at',  { ascending: true });    // Kolomnaam in Supabase (was: aangemaakt_op)

        if (result.error) {
            console.warn('[collab] berichten laden mislukt voor boom', boomId, result.error.message);
            return {};
        }

        var groepen = {};
        (result.data || []).forEach(function (b) {
            var pid = b.persoon_id;
            if (!groepen[pid]) groepen[pid] = { naam: b.persoon_naam, berichten: [] };
            groepen[pid].berichten.push(b);
        });
        return groepen;
    }

    // ---------------------------------------------------------------------------
    // RENDEREN
    // ---------------------------------------------------------------------------

    function renderAlleStambomen() {
        var container = document.getElementById('discussie-container');
        if (!container) return;
        container.innerHTML = '';

        var boomIds = Object.keys(staat.bomen);
        if (boomIds.length === 0) {
            container.innerHTML = '<div class="laad-indicator">Geen stambomen gevonden.</div>';
            return;
        }

        // Actieve boom bovenaan, daarna alfabetisch
        boomIds.sort(function (a, b) {
            var ba = staat.bomen[a], bb = staat.bomen[b];
            if (ba.isActief && !bb.isActief) return -1;
            if (!ba.isActief && bb.isActief) return 1;
            return ba.naam.localeCompare(bb.naam);
        });

        boomIds.forEach(function (boomId) {
            container.appendChild(maakStamboomSectie(boomId, staat.bomen[boomId]));
        });
    }

    // Maak stamboom-sectie: header + zoekbalk (indien van toepassing) + discussieblokken
    function maakStamboomSectie(boomId, boom) {
        var sectie = document.createElement('div');
        sectie.className = 'stamboom-sectie' + (boom.isActief ? ' stamboom-actief' : ' stamboom-inactief');
        sectie.dataset.boomId = boomId;

        var aantalOnderwerpen = Object.keys(boom.discussies).length;

        // Header
        var header = document.createElement('div');
        header.className = 'stamboom-sectie-header';
        header.innerHTML =
            '<span class="stamboom-sectie-icoon">📚</span>' +
            '<span class="stamboom-sectie-naam">' + ftSafe(boom.naam) + '</span>' +
            '<span class="boom-rol-badge boom-rol-' + ftSafe(boom.rol) + '">' + rolLabel(boom.rol) + '</span>' +
            (boom.isActief
                ? '<span class="boom-actief-badge">✓ Actief</span>'
                : '<span class="boom-inactief-hint">Alleen lezen</span>') +
            '<span class="stamboom-sectie-teller" data-boom-id="' + ftSafe(boomId) + '">' +
                aantalOnderwerpen + ' onderwerp' + (aantalOnderwerpen !== 1 ? 'en' : '') +
            '</span>';
        sectie.appendChild(header);

        // Ledenlijst — asynchroon laden via ShareModule, zichtbaar voor alle rollen
        var ledenEl = document.createElement('div');
        ledenEl.className = 'boom-leden-lijst';
        ledenEl.innerHTML = '<span class="boom-leden-laden">Leden laden…</span>';
        sectie.appendChild(ledenEl);
        laadEnToonLeden(boomId, boom.rol, ledenEl);    // Niet-blokkerend

        // Inactief-banner
        if (!boom.isActief) {
            var banner = document.createElement('div');
            banner.className = 'inactief-banner';
            banner.innerHTML =
                '💡 Laad deze stamboom via ' +
                '<a href="/MyFamTreeCollab/stamboom/storage.html">Opslag</a> ' +
                'om nieuwe discussies te starten of te reageren.';
            sectie.appendChild(banner);
        }

        // Zoekbalk — tonen als:
        //   a) dit de actieve boom is, OF
        //   b) gebruiker is owner/editor van deze boom én lokale data beschikbaar is
        // In v2.3.0: altijd tonen voor actieve boom; voor inactieve bomen alleen bij owner/editor
        var magZoekbalk = boom.isActief ||
            (['owner', 'editor', 'admin'].includes(boom.rol) && boom.isActief);
        // Vereenvoudigd: zoekbalk alleen voor actieve boom (livesearch werkt op lokale data)
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

            // Koppel livesearch na DOM-insert (setTimeout zodat element in DOM staat)
            (function (id, el) {
                setTimeout(function () { koppelZoekbalkVoorBoom(id, el); }, 0);
            })(boomId, zoekSectie);
        }

        // Discussieblokken
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
                innerContainer.appendChild(
                    maakDiscussieBlok(boomId, pid, groep.naam, groep.berichten, boom.isActief, boom.rol)
                );
            });
        }

        sectie.appendChild(innerContainer);
        return sectie;
    }

    // ---------------------------------------------------------------------------
    // DISCUSSIEBLOK
    // ---------------------------------------------------------------------------

    function maakDiscussieBlok(boomId, persoonId, persoonNaam, berichten, isActief, rolVoorDezeBoom) {
        var blok = document.createElement('div');
        blok.className = 'discussie-blok';
        blok.dataset.persoonId = persoonId;
        blok.dataset.boomId    = boomId;

        var huidigStatus = berichten.length > 0
            ? (berichten[berichten.length - 1].status || STATUS_FALLBACK)
            : STATUS_FALLBACK;
        if (!STATUS_CONFIG[huidigStatus]) huidigStatus = STATUS_FALLBACK;

        var statusConf = STATUS_CONFIG[huidigStatus];

        var header = document.createElement('div');
        header.className = 'discussie-header';
        header.innerHTML =
            '<div style="display:flex;align-items:center;flex:1;min-width:0;">' +
                '<span class="discussie-persoon-naam">' + ftSafe(persoonNaam) + '</span>' +
                '<span class="discussie-persoon-id">' + ftSafe(persoonId) + '</span>' +
            '</div>' +
            '<span class="status-badge ' + statusConf.klasse + '">' +
                statusConf.icoon + ' ' + statusConf.label + '</span>' +
            '<span class="discussie-toggle-pijl">▼</span>';
        header.addEventListener('click', function () { blok.classList.toggle('ingeklapt'); });

        var body = document.createElement('div');
        body.className = 'discussie-body';
        var lijst = maakBerichtenLijst(berichten, boomId, persoonId);
        body.appendChild(lijst);

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

    function maakBerichtenLijst(berichten, boomId, persoonId) {
        var lijst = document.createElement('div');
        lijst.className = 'bericht-lijst';
        lijst.id = 'lijst-' + boomId + '-' + persoonId;

        if (berichten.length === 0) {
            lijst.innerHTML = '<div class="bericht-leeg">Nog geen berichten in deze discussie.</div>';
            return lijst;
        }
        berichten.forEach(function (b) { lijst.appendChild(maakBerichtItem(b)); });
        setTimeout(function () { lijst.scrollTop = lijst.scrollHeight; }, 50);
        return lijst;
    }

    function maakBerichtItem(bericht) {
        var isEigen = staat.gebruiker && bericht.user_id === staat.gebruiker.id;
        var isOwner = ['owner', 'admin'].includes(staat.rol);

        var item = document.createElement('div');
        item.className = 'bericht-item' + (isEigen ? ' eigen' : '');
        item.dataset.id = bericht.id;

        var tijdstip = bericht.created_at                          // Kolomnaam in Supabase (was: aangemaakt_op)
            ? new Date(bericht.created_at).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })
            : '';

        var voornaam = (bericht.username || 'Onbekend').split(' ')[0];    // Kolomnaam: username (was: auteur_naam)
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
            '<div class="bericht-tekst">' + ftSafe(bericht.message) + '</div>' +    // Kolomnaam: message (was: bericht)
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

    function maakNieuwBerichtForm(boomId, persoonId, huidigStatus, blokEl, lijstEl, rolVoorDezeBoom) {
        var form = document.createElement('div');
        form.className = 'nieuw-bericht-form';

        var kanStatusWijzigen = ['owner', 'editor', 'admin'].includes(rolVoorDezeBoom);
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
            if (diffWrapper) diffWrapper.classList.remove('zichtbaar');
            if (diffToggle)  diffToggle.textContent = '📝 Wijziging voorstellen';

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

        var rolVoorDezeBoom = staat.bomen[boomId] ? staat.bomen[boomId].rol : staat.rol;

        var record = {
            boom_id:       boomId,              // UUID van de stamboom
            persoon_id:    persoonId,            // ID van de besproken persoon
            persoon_naam:  persoonNaam,          // Naam van de persoon (denormalisatie)
            user_id:       staat.gebruiker.id,   // UUID van de afzender
            username:      auteurNaam,           // Kolomnaam in Supabase tabel (was: auteur_naam)
            rol:           rolVoorDezeBoom,      // Rol van de afzender voor deze boom
            message:       tekst,               // Kolomnaam in Supabase tabel (was: bericht)
            diff_voorstel: diffVoorstel || null, // Optioneel wijzigingsvoorstel
            status:        status               // Discussiestatus
        };

        var result = await staat.supabase
            .from('collab_messages')
            .insert([record])
            .select()
            .single();

        if (result.error) return { success: false, data: null, error: result.error.message };

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
    // LIVESEARCH — altijd op StamboomStorage.get(), ongeacht activeBoomId
    // ---------------------------------------------------------------------------

    // Koppel zoekbalk voor een specifieke boom-sectie
    function koppelZoekbalkVoorBoom(boomId, zoekSectie) {
        var zoekInput = zoekSectie.querySelector('.persoon-zoek-input');
        var zoekKnop  = zoekSectie.querySelector('.zoek-knop');
        if (!zoekInput) return;

        // Dropdown container
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

    // Toon zoekresultaten — leest altijd uit StamboomStorage.get()
    // StamboomStorage.get() geeft de lokaal geladen stamboomdata terug,
    // ongeacht of activeBoomId in localStorage staat
    function toonZoekResultaten(query, dropdown, zoekInput, boomId) {
        dropdown.innerHTML = '';

        // Haal personen op uit localStorage — dit werkt altijd als er lokaal data is
        var personen = window.StamboomStorage ? window.StamboomStorage.get() : [];

        if (!personen || personen.length === 0) {
            // Geen lokale data: toon informatieve melding met link naar Opslag
            dropdown.innerHTML =
                '<div style="padding:10px;font-size:0.85rem;color:#888;">' +
                    'Geen lokale stamboomdata. ' +
                    '<a href="/MyFamTreeCollab/stamboom/storage.html" style="color:#1E90FF;">Laad de stamboom</a> eerst.' +
                '</div>';
            dropdown.style.display = 'block';
            return;
        }

        // Filter op naam (Roepnaam + Achternaam) of ID — veldnamen conform schema.js
        var resultaten = personen.filter(function (p) {
            var naam = ((p.Roepnaam || '') + ' ' + (p.Achternaam || '')).toLowerCase();
            var id   = (p.ID || '').toLowerCase();
            return naam.includes(query) || id.includes(query);
        }).slice(0, 10);    // Max 10 resultaten

        if (resultaten.length === 0) {
            dropdown.innerHTML =
                '<div style="padding:10px;font-size:0.85rem;color:#888;">Geen personen gevonden voor "' +
                ftSafe(query) + '".</div>';
            dropdown.style.display = 'block';
            return;
        }

        resultaten.forEach(function (p) {
            var naam     = ((p.Roepnaam || '') + ' ' + (p.Prefix || '') + ' ' + (p.Achternaam || '')).trim();
            var pid      = p.ID || '';
            var geboorte = p.Geboortedatum ? p.Geboortedatum.substring(0, 4) : '';

            var item = document.createElement('div');
            item.className = 'zoek-resultaat-item';
            item.style.cssText =
                'padding:9px 12px;cursor:pointer;font-size:0.88rem;' +
                'border-bottom:1px solid #f0f0f0;display:flex;' +
                'justify-content:space-between;align-items:center;';
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

    function openNieuweDiscussieModal(boomId, persoonId, persoonNaam) {
        var modal     = document.getElementById('nieuwe-discussie-modal');
        var idInput   = document.getElementById('modal-persoon-id');
        var naamInput = document.getElementById('modal-persoon-naam');
        if (!modal || !idInput || !naamInput) return;

        idInput.value    = persoonId || '';
        naamInput.value  = persoonNaam || '';
        idInput.readOnly = !!persoonId;
        modal.dataset.boomId = boomId;    // Bewaar boomId op modal element

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

        // Bestaande discussie → scroll ernaar toe
        if (staat.bomen[boomId].discussies[persoonId]) {
            sluitModal();
            var bestaand = document.querySelector(
                '[data-boom-id="' + boomId + '"][data-persoon-id="' + persoonId + '"]'
            );
            if (bestaand) bestaand.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        // Nieuwe discussie
        staat.bomen[boomId].discussies[persoonId] = { naam: persoonNaam, berichten: [] };

        var teller = document.querySelector('.stamboom-sectie-teller[data-boom-id="' + boomId + '"]');
        var aantalOnderwerpen = Object.keys(staat.bomen[boomId].discussies).length;
        if (teller) teller.textContent = aantalOnderwerpen + ' onderwerp' + (aantalOnderwerpen !== 1 ? 'en' : '');

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
    // LEDENLIJST PER STAMBOOM
    // ---------------------------------------------------------------------------

    // Laad de lijst van leden (eigenaar + viewers/editors) voor een stamboom
    // en render deze in het ledenEl element.
    // Zichtbaar voor alle rollen — owner ziet iedereen, viewer/editor ook.
    async function laadEnToonLeden(boomId, rolVanGebruiker, ledenEl) {
        var leden = [];    // Accumuleert { naam, rol }

        // Haal eigenaar op: de stamboom heeft één eigenaar (user_id in stambomen tabel)
        // We kennen de eigenaarsnaam via ShareModule.listSharedWith() (eigenaar_id)
        // Voor viewers/editors: haal gedeelde leden op via listSharedWith()
        // Voor owners: haal zelf ook op via listSharedWith() voor de editors/viewers

        var gedeeldResult = await window.ShareModule.listSharedWith(boomId);

        if (!gedeeldResult.error && gedeeldResult.data) {
            gedeeldResult.data.forEach(function (lid) {
                leden.push({
                    naam: lid.display_name || 'Onbekend',
                    rol:  lid.rol                              // 'viewer' of 'editor'
                });
            });
        }

        // Voeg de huidige gebruiker toe als owner bovenaan (altijd zichtbaar)
        if (rolVanGebruiker === 'owner' || rolVanGebruiker === 'admin') {
            var eigenNaam = (staat.profiel && staat.profiel.username)
                ? staat.profiel.username
                : (staat.gebruiker ? staat.gebruiker.email : 'Owner');
            leden.unshift({ naam: eigenNaam, rol: rolVanGebruiker });    // Bovenaan plaatsen
        }

        // Render de ledenlijst
        if (leden.length === 0) {
            ledenEl.innerHTML = '<span class="boom-leden-leeg">Alleen jij hebt toegang tot deze stamboom.</span>';
            return;
        }

        var html = '<span class="boom-leden-label">👥 Leden:</span>';
        leden.forEach(function (lid) {
            html +=
                '<span class="boom-lid-item">' +
                    '<span class="boom-lid-naam">' + ftSafe(lid.naam) + '</span>' +
                    '<span class="boom-lid-rol boom-lid-rol-' + ftSafe(lid.rol) + '">' +
                        rolLabel(lid.rol) +
                    '</span>' +
                '</span>';
        });

        ledenEl.innerHTML = html;
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

    function rolLabel(rol) {
        var labels = { owner: '👑 Owner', editor: '✏️ Editor', viewer: '👁 Viewer', admin: '⚙️ Admin' };
        return labels[rol] || rol;
    }

    function ftSafe(tekst) {
        if (window.ftSafe) return window.ftSafe(tekst);
        return String(tekst || '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

})();
