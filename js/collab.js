// =============================================================================
// js/collab.js — Collaboratie berichtenboard
// MyFamTreeCollab v2.4.0
// -----------------------------------------------------------------------------
// Wijzigingen v2.4.0 (sessie 26):
//   - Alle hardcoded strings vervangen door i18nModule.t('collab:...')
//   - STATUS_CONFIG labels worden nu live vertaald bij render
//   - rolLabel() leest uit i18n namespace
//   - Subtitel, laadindicator, lees-only meldingen, modals → i18n
//
// Wijzigingen v2.3.0 (sessie 19 — bugfix):
//   - activeBoomId === null fallback: als localStorage leeg is, wordt de eerste
//     eigen boom automatisch als actief beschouwd (owner zonder actieve boom)
//   - bepaalActiveBoom() centrale functie voor actief-markering
//   - Livesearch werkt altijd op StamboomStorage.get() ongeacht activeBoomId
//
// Wijzigingen v2.2.0:
//   - laadAlleToegankelijkeStambomen() — alle bomen per rol
//   - renderAlleStambomen() met sortering
//   - Rol per boom in staat.bomen
//
// Afhankelijkheden (verplichte laadvolgorde):
//   i18next → i18n.js → supabase-js → utils.js → schema.js → storage.js →
//   auth.js → cloudSync.js → shareModule.js → accessGuard.js → collab.js
// =============================================================================

(function () {
    'use strict';

    // ---------------------------------------------------------------------------
    // CONSTANTEN
    // ---------------------------------------------------------------------------
    var STORAGE_KEY_BOOM = 'stamboomActiefId';   // localStorage key voor actieve boom UUID
    var STORAGE_KEY_NAAM = 'stamboomActiefNaam'; // localStorage key voor boomnaam

    // Status sleutels — labels worden live vertaald via i18nModule.t()
    // Alleen de icoon en CSS-klasse staan hier vast; label wordt bij render opgezocht
    var STATUS_CONFIG = {
        nieuw:         { icoon: '🆕', klasse: 'status-nieuw',         labelKey: 'collab:status.nieuw' },
        open:          { icoon: '🔓', klasse: 'status-open',          labelKey: 'collab:status.open' },
        inbehandeling: { icoon: '🔄', klasse: 'status-inbehandeling', labelKey: 'collab:status.inbehandeling' },
        gesloten:      { icoon: '✅', klasse: 'status-gesloten',       labelKey: 'collab:status.gesloten' }
    };

    var STATUS_FALLBACK = 'nieuw'; // Fallback als status onbekend of leeg is

    // ---------------------------------------------------------------------------
    // STAAT
    // ---------------------------------------------------------------------------
    var staat = {
        activeBoomId: null,  // UUID actieve stamboom — kan null zijn
        boomNaam:     null,  // Naam actieve stamboom
        gebruiker:    null,  // Supabase auth user object
        profiel:      null,  // { username, tier, ... }
        rol:          null,  // Globale tier (owner/editor/viewer/admin)
        supabase:     null,  // Supabase client
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
            // AuthModule ontbreekt — fout tonen via i18n
            toonFout(i18nModule.t('collab:error.auth'));
            return;
        }
        staat.supabase = window.AuthModule.getClient();

        if (!window.ShareModule) {
            // ShareModule ontbreekt — fout tonen via i18n
            toonFout(i18nModule.t('collab:error.share'));
            return;
        }

        // Lees activeBoomId uit localStorage — kan null zijn
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

        // Sla timestamp op van dit bezoek aan collab.html
        localStorage.setItem('collabLaatstGezien', new Date().toISOString());

        // Reset notificatie-badge in de TopBar
        if (window.TopBarAuth && typeof window.TopBarAuth.refreshCollabBadge === 'function') {
            window.TopBarAuth.refreshCollabBadge(); // Badge wordt 0 → verborgen
        }
    }

    // ---------------------------------------------------------------------------
    // ACTIEVE BOOM BEPALEN
    // ---------------------------------------------------------------------------

    // Bepaalt welke boom als "actief" wordt gemarkeerd.
    // Volgorde: 1) localStorage-waarde in lijst → gebruik die
    //           2) activeBoomId null + eigen boom aanwezig → eerste eigen boom
    //           3) Alleen gedeelde bomen → geen actieve boom (alles lees-only)
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
            return eigeneBoom.id; // Markeer als actief maar schrijf NIET terug naar localStorage
        }

        // Stap 3: alleen gedeelde bomen → geen actieve boom
        return null;
    }

    // ---------------------------------------------------------------------------
    // ALLE TOEGANKELIJKE STAMBOMEN LADEN
    // ---------------------------------------------------------------------------

    async function laadAlleToegankelijkeStambomen() {
        var bomenLijst = []; // Accumuleert { id, naam, rol }

        // Stap 1: Eigen bomen voor owner/admin via CloudSync
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

        // Stap 2: Gedeelde bomen voor alle rollen via ShareModule
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
                // Samengestelde melding met vertaalde link
                container.innerHTML =
                    '<div class="laad-indicator">' +
                        i18nModule.t('collab:tree.noAccess') + ' ' +
                        '<a href="/MyFamTreeCollab/stamboom/storage.html">' +
                            i18nModule.t('collab:tree.noAccessLink') +
                        '</a>.' +
                    '</div>';
            }
            return;
        }

        // Stap 3: Actieve boom bepalen
        var actieveId = bepaalActiveBoom(bomenLijst);

        // Stap 4: Subtitel bijwerken met naam van actieve boom
        var actieveBoom = actieveId ? bomenLijst.find(function (b) { return b.id === actieveId; }) : null;
        var subtitel = document.getElementById('actieve-boom-label');
        if (subtitel) {
            // Vertaalde subtitel met of zonder actieve boomnaam
            subtitel.textContent = actieveBoom
                ? i18nModule.t('collab:subtitle.active', { naam: ftSafe(actieveBoom.naam) })
                : i18nModule.t('collab:subtitle.none');
        }

        // Stap 5: Per boom discussies laden en opslaan in staat.bomen
        for (var i = 0; i < bomenLijst.length; i++) {
            var boom = bomenLijst[i];
            var discussies = await laadDiscussiesVoorBoom(boom.id);
            staat.bomen[boom.id] = {
                naam:      boom.naam,
                rol:       boom.rol,
                isActief:  boom.id === actieveId, // Markering op basis van bepaalActiveBoom()
                discussies: discussies
            };
        }

        verbergLaadIndicator();

        // Stap 6: Alles renderen
        renderAlleStambomen();
    }

    // Laad berichten voor één boom, gegroepeerd per persoon_id
    async function laadDiscussiesVoorBoom(boomId) {
        var result = await staat.supabase
            .from('collab_messages')
            .select('*')
            .eq('boom_id', boomId)
            .order('persoon_id', { ascending: true })
            .order('created_at', { ascending: true }); // Kolomnaam in Supabase

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
            // Geen stambomen in staat — vertaalde melding
            container.innerHTML = '<div class="laad-indicator">' + i18nModule.t('collab:tree.noAccess') + '</div>';
            return;
        }

        // Actieve boom bovenaan, daarna alfabetisch op naam
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

    // Maak stamboom-sectie: header + ledenlijst + zoekbalk + discussieblokken
    function maakStamboomSectie(boomId, boom) {
        var sectie = document.createElement('div');
        sectie.className = 'stamboom-sectie' + (boom.isActief ? ' stamboom-actief' : ' stamboom-inactief');
        sectie.dataset.boomId = boomId;

        var aantalOnderwerpen = Object.keys(boom.discussies).length;

        // Teller label: enkelvoud / meervoud via aparte i18n keys
        var tellerTekst = aantalOnderwerpen === 1
            ? i18nModule.t('collab:tree.topics',      { count: aantalOnderwerpen })
            : i18nModule.t('collab:tree.topicsPlural', { count: aantalOnderwerpen });

        // Header — actief/inactief badge vertaald via i18n
        var header = document.createElement('div');
        header.className = 'stamboom-sectie-header';
        header.innerHTML =
            '<span class="stamboom-sectie-icoon">📚</span>' +
            '<span class="stamboom-sectie-naam">' + ftSafe(boom.naam) + '</span>' +
            '<span class="boom-rol-badge boom-rol-' + ftSafe(boom.rol) + '">' + rolLabel(boom.rol) + '</span>' +
            (boom.isActief
                ? '<span class="boom-actief-badge">' + i18nModule.t('collab:tree.active') + '</span>'
                : '<span class="boom-inactief-hint">' + i18nModule.t('collab:tree.readonly') + '</span>') +
            '<span class="stamboom-sectie-teller" data-boom-id="' + ftSafe(boomId) + '">' +
                tellerTekst +
            '</span>';
        sectie.appendChild(header);

        // Ledenlijst — asynchroon laden, initieel vertaalde laadindicator
        var ledenEl = document.createElement('div');
        ledenEl.className = 'boom-leden-lijst';
        ledenEl.innerHTML = '<span class="boom-leden-laden">' + i18nModule.t('collab:tree.membersLoading') + '</span>';
        sectie.appendChild(ledenEl);
        laadEnToonLeden(boomId, boom.rol, ledenEl); // Niet-blokkerend

        // Inactief-banner — vertaald via i18n
        if (!boom.isActief) {
            var banner = document.createElement('div');
            banner.className = 'inactief-banner';
            banner.innerHTML =
                i18nModule.t('collab:tree.inactiveBanner') + ' ' +
                '<a href="/MyFamTreeCollab/stamboom/storage.html">' +
                    i18nModule.t('collab:tree.inactiveBannerLink') +
                '</a> ' +
                i18nModule.t('collab:tree.inactiveBannerSuffix');
            sectie.appendChild(banner);
        }

        // Zoekbalk — alleen voor actieve boom (livesearch werkt op lokale data)
        if (boom.isActief) {
            var zoekSectie = document.createElement('div');
            zoekSectie.className = 'zoek-sectie';
            zoekSectie.id = 'zoek-sectie-' + boomId;
            zoekSectie.innerHTML =
                '<span class="zoek-label">' + i18nModule.t('collab:search.label') + '</span>' +
                '<input type="text" class="persoon-zoek-input" ' +
                    'data-boom-id="' + ftSafe(boomId) + '" ' +
                    'placeholder="' + i18nModule.t('collab:search.placeholder') + '" autocomplete="off">' +
                '<button class="knop-primair zoek-knop" data-boom-id="' + ftSafe(boomId) + '">' +
                    i18nModule.t('collab:search.button') +
                '</button>';
            sectie.appendChild(zoekSectie);

            // Koppel livesearch na DOM-insert
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
            // Geen discussies — vertaalde melding afhankelijk van actief/inactief
            innerContainer.innerHTML =
                '<div class="laad-indicator" style="padding:16px 0;">' +
                    (boom.isActief
                        ? i18nModule.t('collab:tree.noDiscussions.active')
                        : i18nModule.t('collab:tree.noDiscussions.inactive')) +
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
                statusConf.icoon + ' ' + i18nModule.t(statusConf.labelKey) + '</span>' + // Vertaald label
            '<span class="discussie-toggle-pijl">▼</span>';
        header.addEventListener('click', function () { blok.classList.toggle('ingeklapt'); });

        var body = document.createElement('div');
        body.className = 'discussie-body';
        var lijst = maakBerichtenLijst(berichten, boomId, persoonId);
        body.appendChild(lijst);

        if (isActief) {
            body.appendChild(maakNieuwBerichtForm(boomId, persoonId, huidigStatus, blok, lijst, rolVoorDezeBoom));
        } else {
            // Lees-only melding — vertaald
            var leesOnly = document.createElement('div');
            leesOnly.className = 'lees-only-melding';
            leesOnly.textContent = i18nModule.t('collab:message.readonly');
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
            // Lege staat — vertaald
            lijst.innerHTML = '<div class="bericht-leeg">' + i18nModule.t('collab:message.empty') + '</div>';
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

        var tijdstip = bericht.created_at
            ? new Date(bericht.created_at).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })
            : '';

        // Voornaam ophalen — fallback via i18n
        var voornaam = (bericht.username || i18nModule.t('collab:unknown')).split(' ')[0];
        var berichtStatusConf = STATUS_CONFIG[bericht.status] || STATUS_CONFIG[STATUS_FALLBACK];

        var magVerwijderen = isOwner || isEigen;
        var verwijderHtml  = magVerwijderen
            ? '<button class="bericht-verwijder" data-id="' + bericht.id + '" title="✕">✕</button>'
            : '';
        var diffHtml = bericht.diff_voorstel
            ? '<div class="diff-blok"><strong>📝 ' + i18nModule.t('collab:diff.label') + '</strong><br>' +
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
                    '<span class="bericht-status-icoon" title="' + i18nModule.t(berichtStatusConf.labelKey) + '">' +
                        berichtStatusConf.icoon + '</span>' +
                    verwijderHtml +
                '</span>' +
            '</div>' +
            '<div class="bericht-tekst">' + ftSafe(bericht.message) + '</div>' +
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
            // Vertaald label in de status-dropdown
            statusOptiesHtml += '<option value="' + sleutel + '"' +
                (sleutel === huidigStatus ? ' selected' : '') + '>' +
                conf.icoon + ' ' + i18nModule.t(conf.labelKey) + '</option>';
        });

        var statusSelectHtml = kanStatusWijzigen
            ? '<select class="status-select">' + statusOptiesHtml + '</select>'
            : '';
        var kanDiff = ['owner', 'editor', 'admin'].includes(rolVoorDezeBoom);
        // Diff-toggle en tekstgebied — vertaald via i18n
        var diffToggleHtml = kanDiff
            ? '<button class="knop-diff-toggle" type="button">' +
                  i18nModule.t('collab:diff.toggle') +
              '</button>' +
              '<div class="diff-invoer-wrapper">' +
                  '<label>' + i18nModule.t('collab:diff.label') + '</label>' +
                  '<textarea placeholder="' + i18nModule.t('collab:diff.placeholder') + '"></textarea>' +
              '</div>'
            : '';

        form.innerHTML =
            '<textarea placeholder="' + i18nModule.t('collab:message.placeholder') + '" maxlength="1000"></textarea>' +
            '<div class="form-acties">' + statusSelectHtml + diffToggleHtml +
            '<button class="knop-verzend" type="button">' + i18nModule.t('collab:message.send') + '</button></div>';

        var diffToggle  = form.querySelector('.knop-diff-toggle');
        var diffWrapper = form.querySelector('.diff-invoer-wrapper');
        if (diffToggle && diffWrapper) {
            diffToggle.addEventListener('click', function () {
                diffWrapper.classList.toggle('zichtbaar');
                // Label wisselt tussen "Wijziging voorstellen" en "Wijziging annuleren"
                diffToggle.textContent = diffWrapper.classList.contains('zichtbaar')
                    ? i18nModule.t('collab:diff.cancel')
                    : i18nModule.t('collab:diff.toggle');
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
            verzendKnop.textContent = i18nModule.t('collab:message.sending'); // Vertaald "Bezig…"

            var result = await verzendBericht(boomId, persoonId, tekst, nieuweStatus, diffVoorstel);

            verzendKnop.disabled    = false;
            verzendKnop.textContent = i18nModule.t('collab:message.send');    // Terug naar "Versturen"

            if (!result.success) {
                toonFout(i18nModule.t('collab:error.send', { error: result.error }));
                return;
            }

            var leegEl = lijstEl.querySelector('.bericht-leeg');
            if (leegEl) leegEl.remove();
            lijstEl.appendChild(maakBerichtItem(result.data));
            lijstEl.scrollTop = lijstEl.scrollHeight;

            textarea.value = '';
            if (diffTextarea) diffTextarea.value = '';
            if (diffWrapper) diffWrapper.classList.remove('zichtbaar');
            if (diffToggle)  diffToggle.textContent = i18nModule.t('collab:diff.toggle');

            // Status badge bijwerken — vertaald label
            var badge = blokEl.querySelector('.status-badge');
            if (badge) {
                var nieuweConf = STATUS_CONFIG[nieuweStatus] || STATUS_CONFIG[STATUS_FALLBACK];
                badge.textContent = nieuweConf.icoon + ' ' + i18nModule.t(nieuweConf.labelKey);
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
            : (staat.gebruiker ? staat.gebruiker.email : i18nModule.t('collab:unknown')); // Vertaald fallback

        var persoonNaam = (staat.bomen[boomId] && staat.bomen[boomId].discussies[persoonId])
            ? staat.bomen[boomId].discussies[persoonId].naam
            : persoonId;

        var rolVoorDezeBoom = staat.bomen[boomId] ? staat.bomen[boomId].rol : staat.rol;

        var record = {
            boom_id:       boomId,
            persoon_id:    persoonId,
            persoon_naam:  persoonNaam,
            user_id:       staat.gebruiker.id,
            username:      auteurNaam,     // Kolomnaam in Supabase tabel
            rol:           rolVoorDezeBoom,
            message:       tekst,          // Kolomnaam in Supabase tabel
            diff_voorstel: diffVoorstel || null,
            status:        status
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
        // Bevestigingsdialoog — vertaald via i18n
        if (!confirm(i18nModule.t('collab:message.deleteConfirm'))) return;
        var result = await staat.supabase
            .from('collab_messages')
            .delete()
            .eq('id', berichtId);
        if (result.error) {
            toonFout(i18nModule.t('collab:error.delete', { error: result.error.message }));
            return;
        }
        itemEl.remove();
    }

    // ---------------------------------------------------------------------------
    // LIVESEARCH — altijd op StamboomStorage.get()
    // ---------------------------------------------------------------------------

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
    function toonZoekResultaten(query, dropdown, zoekInput, boomId) {
        dropdown.innerHTML = '';

        var personen = window.StamboomStorage ? window.StamboomStorage.get() : [];

        if (!personen || personen.length === 0) {
            // Geen lokale data — vertaalde melding met link
            dropdown.innerHTML =
                '<div style="padding:10px;font-size:0.85rem;color:#888;">' +
                    i18nModule.t('collab:search.noData') + ' ' +
                    '<a href="/MyFamTreeCollab/stamboom/storage.html" style="color:#1E90FF;">' +
                        i18nModule.t('collab:search.noDataLink') +
                    '</a> ' +
                    i18nModule.t('collab:search.noDataSuffix') +
                '</div>';
            dropdown.style.display = 'block';
            return;
        }

        // Filter op naam (Roepnaam + Achternaam) of ID
        var resultaten = personen.filter(function (p) {
            var naam = ((p.Roepnaam || '') + ' ' + (p.Achternaam || '')).toLowerCase();
            var id   = (p.ID || '').toLowerCase();
            return naam.includes(query) || id.includes(query);
        }).slice(0, 10); // Max 10 resultaten

        if (resultaten.length === 0) {
            // Geen resultaten — vertaalde melding met query interpolatie
            dropdown.innerHTML =
                '<div style="padding:10px;font-size:0.85rem;color:#888;">' +
                    i18nModule.t('collab:search.noResults', { query: query }) +
                '</div>';
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
        modal.dataset.boomId = boomId; // Bewaar boomId op modal element

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
            // Validatiefout — vertaald
            alert(i18nModule.t('collab:modal.fillBoth'));
            return;
        }
        if (!boomId || !staat.bomen[boomId]) {
            // Boom niet gevonden — vertaald
            alert(i18nModule.t('collab:modal.notFound'));
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

        // Nieuwe discussie — toevoegen aan staat en DOM
        staat.bomen[boomId].discussies[persoonId] = { naam: persoonNaam, berichten: [] };

        // Teller bijwerken met vertaald label
        var aantalOnderwerpen = Object.keys(staat.bomen[boomId].discussies).length;
        var teller = document.querySelector('.stamboom-sectie-teller[data-boom-id="' + boomId + '"]');
        if (teller) {
            teller.textContent = aantalOnderwerpen === 1
                ? i18nModule.t('collab:tree.topics',      { count: aantalOnderwerpen })
                : i18nModule.t('collab:tree.topicsPlural', { count: aantalOnderwerpen });
        }

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

    async function laadEnToonLeden(boomId, rolVanGebruiker, ledenEl) {
        var leden = []; // Accumuleert { naam, rol }

        var gedeeldResult = await window.ShareModule.listSharedWith(boomId);

        if (!gedeeldResult.error && gedeeldResult.data) {
            gedeeldResult.data.forEach(function (lid) {
                leden.push({
                    naam: lid.display_name || i18nModule.t('collab:unknown'), // Vertaald fallback
                    rol:  lid.rol
                });
            });
        }

        // Voeg de huidige gebruiker toe als owner bovenaan
        if (rolVanGebruiker === 'owner' || rolVanGebruiker === 'admin') {
            var eigenNaam = (staat.profiel && staat.profiel.username)
                ? staat.profiel.username
                : (staat.gebruiker ? staat.gebruiker.email : i18nModule.t('collab:unknown'));
            leden.unshift({ naam: eigenNaam, rol: rolVanGebruiker }); // Bovenaan plaatsen
        }

        if (leden.length === 0) {
            // Alleen de gebruiker zelf — vertaald
            ledenEl.innerHTML = '<span class="boom-leden-leeg">' + i18nModule.t('collab:tree.membersOnly') + '</span>';
            return;
        }

        // Render ledenlijst — vertaald label
        var html = '<span class="boom-leden-label">' + i18nModule.t('collab:tree.members') + '</span>';
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

    // Vertaalt een rol-sleutel naar gelokaliseerd label via i18n
    function rolLabel(rol) {
        var key = 'collab:rol.' + rol;
        var vertaald = i18nModule.t(key);
        // Fallback: als key niet bestaat geeft i18next de key terug — dan originele rol tonen
        return (vertaald && vertaald !== key) ? vertaald : rol;
    }

    // XSS-beveiliging: gebruik window.ftSafe van utils.js indien beschikbaar
    function ftSafe(tekst) {
        if (window.ftSafe) return window.ftSafe(tekst);
        return String(tekst || '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

})();
