/**
 * =============================================================================
 * admin/analytics-dashboard.js — MyFamTreeCollab Analytics (unified)
 * =============================================================================
 * Version    : 3.0.0
 * Wijziging  : Samengevoegd uit siteAnalytics.js + analytics-dashboard.js v2.
 *              analytics.js (localStorage) volledig vervangen door Supabase.
 *              Één bestand, geen externe analytics-modules meer nodig.
 * Structuur  : 1. Supabase config (singleton)
 *              2. Tracker  — SiteAnalytics.trackPage() (was siteAnalytics.js)
 *              3. Dashboard — renderDashboard()        (was analytics-dashboard.js)
 *              4. Init     — admin-check + koppeling
 * Vereist    : Supabase SDK + auth.js geladen vóór dit script
 * Pagina     : admin/analytics.html
 * =============================================================================
 */

(function () {

    "use strict"; // strikte modus — vangt stille fouten op

    // =========================================================================
    // SECTIE 1 — SUPABASE CONFIG (singleton — één keer gedefinieerd)
    // =========================================================================

    const SUPA_URL  = "https://oihzuwlcgyyeuhghjahp.supabase.co"; // Supabase project URL
    const SUPA_ANON = "sb_publishable_9lSmr_sW7iryYDlDXPZZtw_tlbwTyDS"; // publieke anon key

    /** Gedeelde Supabase client — aangemaakt één keer, hergebruikt door tracker én dashboard */
    const db = supabase.createClient(SUPA_URL, SUPA_ANON);        // client aanmaken via Supabase SDK

    // =========================================================================
    // SECTIE 2 — TRACKER  (was: siteAnalytics.js)
    // =========================================================================

    // --- Sessie ID -----------------------------------------------------------

    /**
     * getSessionId()
     * Haalt anonieme sessie ID op uit sessionStorage.
     * Aangemaakt bij eerste bezoek — verdwijnt bij sluiten tab.
     * @returns {string} sessie ID
     */
    function getSessionId() {
        let sid = sessionStorage.getItem("ft_sid");                // bestaande sessie ID ophalen
        if (!sid) {                                                // nog geen sessie ID
            sid = "s_" + Date.now().toString(36) + "_" +          // timestamp in base-36 (compact)
                  Math.random().toString(36).slice(2, 8);          // 6 willekeurige tekens
            sessionStorage.setItem("ft_sid", sid);                 // opslaan voor duur van de tab
        }
        return sid;                                                // sessie ID teruggeven
    }

    // --- Tier + user ophalen -------------------------------------------------

    /**
     * getCurrentTier()
     * Haalt tier op van ingelogde gebruiker via AuthModule.
     * @returns {Promise<string>} 'guest' | 'viewer' | 'editor' | 'owner' | 'admin'
     */
    async function getCurrentTier() {
        if (typeof window.AuthModule === "undefined") return "guest"; // auth.js niet geladen
        try {
            return (await window.AuthModule.getTier()) || "guest"; // tier ophalen, fallback guest
        } catch (_) {
            return "guest";                                        // fout → gast
        }
    }

    /**
     * getCurrentUserId()
     * Haalt user UUID op van ingelogde gebruiker, of null voor gasten.
     * @returns {Promise<string|null>}
     */
    async function getCurrentUserId() {
        if (typeof window.AuthModule === "undefined") return null; // auth.js niet geladen
        try {
            const user = await window.AuthModule.getUser();        // user object ophalen
            return user ? user.id : null;                          // null voor gasten
        } catch (_) {
            return null;                                           // fout → geen user ID
        }
    }

    // --- Duur tracking -------------------------------------------------------

    let _visitId   = null; // UUID van actieve page_visits rij — nodig voor duration update
    let _pageStart = null; // starttijd bezoek in ms

    /**
     * updateDuration()
     * Berekent verblijfsduur en update de rij in Supabase via fetch (keepalive).
     * Aangeroepen bij beforeunload en visibilitychange → hidden.
     */
    function updateDuration() {
        if (!_visitId || !_pageStart) return;                      // geen actief bezoek — stoppen

        const duurSec = Math.round((Date.now() - _pageStart) / 1000); // duur in seconden

        // Directe fetch — betrouwbaarder dan Supabase client bij page unload
        fetch(SUPA_URL + "/rest/v1/page_visits?id=eq." + _visitId, {
            method:  "PATCH",                                      // update bestaande rij
            headers: {
                "Content-Type":  "application/json",               // JSON body
                "apikey":        SUPA_ANON,                        // Supabase anon key
                "Authorization": "Bearer " + SUPA_ANON            // auth header
            },
            body:      JSON.stringify({ duration_sec: duurSec }),  // duur invullen
            keepalive: true                                        // blijft actief na page unload
        }).catch(function () {});                                   // stille fout — bezoeker is al weg
    }

    // Duur updaten bij verlaten pagina
    window.addEventListener("beforeunload", updateDuration);

    // Duur updaten bij tab naar achtergrond (mobiel / PWA)
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") updateDuration(); // tab naar achtergrond
    });

    // --- Hoofd track functie -------------------------------------------------

    /**
     * trackPage(pageName)
     * Registreert een paginabezoek in Supabase page_visits.
     * Roep aan bovenaan elk pagina-script: SiteAnalytics.trackPage("home");
     * @param {string} pageName - naam van de pagina (bv. "home", "analytics-dashboard")
     */
    async function trackPage(pageName) {
        if (!pageName || typeof pageName !== "string") return;     // valideer invoer

        _pageStart = Date.now();                                   // starttijd vastleggen

        const sessionId = getSessionId();                          // sessie ID ophalen/aanmaken
        const tier      = await getCurrentTier();                  // tier ophalen
        const userId    = await getCurrentUserId();                // user ID ophalen (null voor gasten)
        const referrer  = document.referrer
            ? new URL(document.referrer).pathname                  // alleen het pad van referrer
            : null;                                               // geen referrer beschikbaar

        const { data, error } = await db
            .from("page_visits")                                   // doeltabel
            .insert({
                session_id:   sessionId,                           // anonieme sessie ID
                user_id:      userId,                              // null voor gasten
                tier:         tier,                                // tier op moment van bezoek
                page:         pageName,                            // paginanaam
                referrer:     referrer,                            // pad van vorige pagina
                duration_sec: null,                                // ingevuld bij verlaten
                visited_at:   new Date().toISOString()             // tijdstip van bezoek
            })
            .select("id")                                          // nieuw rij-ID terugvragen
            .single();                                             // verwacht precies één rij

        if (error) {
            console.warn("[Analytics] Bezoek registreren mislukt:", error.message); // log fout
            return;                                                // stop — geen ID voor duur-update
        }

        _visitId = data.id;                                        // ID opslaan voor duur-update
    }

    // Publieke tracker API
    window.SiteAnalytics = { trackPage: trackPage };              // enige publieke interface van tracker

    // =========================================================================
    // SECTIE 3 — DASHBOARD  (was: analytics-dashboard.js v2)
    // =========================================================================

    // --- Helper functies -----------------------------------------------------

    /**
     * el(id) — korte wrapper voor document.getElementById
     * @param {string} id
     * @returns {HTMLElement|null}
     */
    function el(id) {
        return document.getElementById(id);                        // element ophalen via ID
    }

    /**
     * escHtml(str) — escaped string voor veilig gebruik in innerHTML (XSS-preventie)
     * @param {string} str
     * @returns {string}
     */
    function escHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")                                // ampersand escapen
            .replace(/</g, "&lt;")                                 // kleiner-dan escapen
            .replace(/>/g, "&gt;")                                 // groter-dan escapen
            .replace(/"/g, "&quot;");                              // aanhalingstekens escapen
    }

    /**
     * formatDuur(sec) — zet seconden om naar leesbare string
     * @param {number} sec
     * @returns {string} bv. "2m 14s" of "45s"
     */
    function formatDuur(sec) {
        if (!sec || sec <= 0) return "—";                          // geen of negatieve waarde
        const m = Math.floor(sec / 60);                            // volle minuten
        const s = sec % 60;                                        // resterende seconden
        return m > 0 ? m + "m " + s + "s" : s + "s";              // opgemaakt resultaat
    }

    /**
     * showLaad(containerId, tekst) — toont laad-bericht in container
     */
    function showLaad(containerId, tekst) {
        const c = el(containerId);                                 // container ophalen
        if (c) c.innerHTML = '<p class="empty-msg">' + escHtml(tekst || "Laden…") + '</p>';
    }

    /**
     * animeerBalken(container) — zet event-bar breedtes na DOM render
     * @param {HTMLElement} container
     */
    function animeerBalken(container) {
        requestAnimationFrame(function () {
            container.querySelectorAll(".event-bar").forEach(function (bar) {
                bar.style.width = bar.dataset.pct + "%";           // breedte instellen — triggert animatie
            });
        });
    }

    // --- Data ophalen --------------------------------------------------------

    /**
     * haalData()
     * Haalt alle page_visits op uit Supabase voor de afgelopen 30 dagen.
     * Alleen admins hebben SELECT rechten via RLS.
     * @returns {Promise<Array>} array van bezoek-rijen
     */
    async function haalData() {
        const dertigDagenGeleden = new Date();                     // huidige datum
        dertigDagenGeleden.setDate(dertigDagenGeleden.getDate() - 30); // 30 dagen terug

        const { data, error } = await db
            .from("page_visits")                                   // page_visits tabel
            .select("*")                                           // alle kolommen
            .gte("visited_at", dertigDagenGeleden.toISOString())   // laatste 30 dagen
            .order("visited_at", { ascending: false });            // nieuwste eerst

        if (error) {
            console.error("[Dashboard] Data ophalen mislukt:", error.message); // log fout
            return [];                                             // lege array als fallback
        }

        return data || [];                                         // geef data terug
    }

    // --- Render functies -----------------------------------------------------

    /**
     * renderStatKaarten(bezoeken)
     * Rendert de vier bovenste statistiekenkaarten.
     */
    function renderStatKaarten(bezoeken) {
        const grid = el("stat-grid");                              // grid container ophalen
        if (!grid) return;                                         // veiligheidscheck

        const totaalBezoeken  = bezoeken.length;                   // totaal paginabezoeken
        const uniekeSessionen = new Set(
            bezoeken.map(function (r) { return r.session_id; })    // unieke sessie IDs verzamelen
        ).size;                                                    // aantal unieke sessies

        const bezoekensMetDuur = bezoeken.filter(function (r) { return r.duration_sec; }); // alleen rijen mét duur
        const gemDuur = bezoekensMetDuur.length > 0
            ? bezoekensMetDuur.reduce(function (som, r) { return som + r.duration_sec; }, 0)
              / bezoekensMetDuur.length                            // gemiddelde duur berekenen
            : 0;                                                   // geen data → 0

        const vandaag = new Date().toDateString();                  // datum vandaag als string
        const vandaagBezoeken = bezoeken.filter(function (r) {     // filter op vandaag
            return new Date(r.visited_at).toDateString() === vandaag;
        }).length;

        const kaarten = [
            { label: "Paginabezoeken",     value: totaalBezoeken,                      unit: "30 dagen" },
            { label: "Unieke bezoekers",   value: uniekeSessionen,                     unit: "sessies"  },
            { label: "Gem. verblijfsduur", value: formatDuur(Math.round(gemDuur)),     unit: ""         },
            { label: "Vandaag",            value: vandaagBezoeken,                     unit: "bezoeken" }
        ];

        grid.innerHTML = kaarten.map(function (k) {
            return (
                '<div class="stat-card">' +
                '  <div class="label">'  + escHtml(k.label)        + '</div>' +   // kaarttitel
                '  <div class="value">'  + escHtml(String(k.value)) +             // grote waarde
                '    <span class="unit">' + escHtml(k.unit)        + '</span>' +  // eenheid
                '  </div>' +
                '</div>'
            );
        }).join("");
    }

    /**
     * renderPaginaStats(bezoeken)
     * Balkgrafiek van meest bezochte pagina's inclusief gemiddelde duur.
     */
    function renderPaginaStats(bezoeken) {
        const container = el("events-chart");                      // container ophalen
        if (!container) return;

        // Groepeer bezoeken per pagina
        const perPagina = {};
        bezoeken.forEach(function (r) {
            if (!perPagina[r.page]) {
                perPagina[r.page] = { count: 0, totalDuur: 0, metDuur: 0 }; // initialiseer
            }
            perPagina[r.page].count++;                             // bezoekteller ophogen
            if (r.duration_sec) {
                perPagina[r.page].totalDuur += r.duration_sec;    // duur optellen
                perPagina[r.page].metDuur++;                       // teller voor gemiddelde
            }
        });

        const entries = Object.entries(perPagina)
            .sort(function (a, b) { return b[1].count - a[1].count; }); // meest bezocht eerst

        if (entries.length === 0) {
            container.innerHTML = '<p class="empty-msg">Nog geen paginabezoeken geregistreerd.</p>';
            return;
        }

        const max = entries[0][1].count;                           // hoogste count = 100% breedte

        container.innerHTML = entries.map(function (entry) {
            const pagina  = entry[0];
            const stats   = entry[1];
            const pct     = max > 0 ? (stats.count / max) * 100 : 0;
            const gemDuur = stats.metDuur > 0
                ? formatDuur(Math.round(stats.totalDuur / stats.metDuur)) // gem. duur per pagina
                : "—";

            return (
                '<div class="event-row">' +
                '  <span class="event-label">' + escHtml(pagina) + '</span>' +
                '  <div class="event-bar-wrap">' +
                '    <div class="event-bar" data-pct="' + pct + '"></div>' +
                '  </div>' +
                '  <span class="event-count">' + escHtml(String(stats.count)) + '</span>' +
                '  <span style="font-size:0.7rem;color:var(--text-muted);min-width:52px;text-align:right;">' +
                   escHtml(gemDuur) + '</span>' +
                '</div>'
            );
        }).join("");

        animeerBalken(container);                                  // balken animeren na DOM render
    }

    /**
     * renderTierVerdeling(bezoeken)
     * Balkgrafiek van bezoeken per account tier.
     */
    function renderTierVerdeling(bezoeken) {
        const container = el("pages-chart");                       // container ophalen
        if (!container) return;

        // Tel bezoeken per tier
        const perTier = {};
        bezoeken.forEach(function (r) {
            const tier = r.tier || "guest";                        // fallback naar guest
            perTier[tier] = (perTier[tier] || 0) + 1;             // teller ophogen
        });

        const tierKleuren = {                                      // kleur per tier
            guest:  { fg: "#aaaacc" },
            viewer: { fg: "#6ee09a" },
            editor: { fg: "#6ab4f0" },
            owner:  { fg: "#f0c040" },
            admin:  { fg: "#f08080" }
        };

        const entries = Object.entries(perTier)
            .sort(function (a, b) { return b[1] - a[1]; });       // meest voorkomend eerst

        if (entries.length === 0) {
            container.innerHTML = '<p class="empty-msg">Geen tier-data beschikbaar.</p>';
            return;
        }

        const max = entries[0][1];

        container.innerHTML = entries.map(function (entry) {
            const tier  = entry[0];
            const count = entry[1];
            const pct   = max > 0 ? (count / max) * 100 : 0;
            const kleur = (tierKleuren[tier] || { fg: "#ccc" }).fg; // kleur ophalen, fallback grijs

            return (
                '<div class="event-row">' +
                '  <span class="event-label" style="color:' + kleur + ';">' + escHtml(tier) + '</span>' +
                '  <div class="event-bar-wrap">' +
                '    <div class="event-bar" data-pct="' + pct + '" style="background:' + kleur + ';"></div>' +
                '  </div>' +
                '  <span class="event-count" style="color:' + kleur + ';">' + escHtml(String(count)) + '</span>' +
                '</div>'
            );
        }).join("");

        animeerBalken(container);
    }

    /**
     * renderDeviceGrid(bezoeken)
     * Toont totaal unieke sessies en totaal bezoeken als pills.
     * (Device user-agent niet opgeslagen — uitbreiding mogelijk via page_visits kolom)
     */
    function renderDeviceGrid(bezoeken) {
        const container = el("device-grid");                       // container ophalen
        if (!container) return;

        const uniekeSessionen = new Set(
            bezoeken.map(function (r) { return r.session_id; })    // sessie IDs verzamelen
        ).size;

        container.innerHTML = (
            '<div class="device-pill">👥 <span>Unieke sessies</span> <strong>'  + escHtml(String(uniekeSessionen))  + '</strong></div>' +
            '<div class="device-pill">📄 <span>Totaal bezoeken</span> <strong>' + escHtml(String(bezoeken.length)) + '</strong></div>'
        );
    }

    /**
     * renderRecenteTabel(bezoeken)
     * Toont de 15 meest recente paginabezoeken in een tabel.
     */
    function renderRecenteTabel(bezoeken) {
        const container = el("sessions-table");                    // container ophalen
        if (!container) return;

        const recente = bezoeken.slice(0, 15);                     // maximaal 15 rijen

        if (recente.length === 0) {
            container.innerHTML = '<p class="empty-msg">Nog geen bezoeken geregistreerd.</p>';
            return;
        }

        const tierKleuren = {
            guest:  "#aaaacc", viewer: "#6ee09a",
            editor: "#6ab4f0", owner:  "#f0c040", admin: "#f08080"
        };

        let html = (
            '<table><thead><tr>' +
            '<th>Pagina</th>'    +                                 // bezochte pagina
            '<th>Tier</th>'      +                                 // account tier
            '<th>Duur</th>'      +                                 // verblijfsduur
            '<th>Tijdstip</th>'  +                                 // wanneer bezocht
            '<th>Sessie ID</th>' +                                 // anonieme sessie
            '</tr></thead><tbody>'
        );

        recente.forEach(function (r) {
            const tierKleur = tierKleuren[r.tier] || "#ccc";       // kleur voor tier badge
            const tijdstip  = r.visited_at
                ? new Date(r.visited_at).toLocaleString("nl-BE")   // Belgisch formaat
                : "—";

            html += (
                '<tr>' +
                '<td>' + escHtml(r.page || "—") + '</td>' +
                '<td><span class="badge" style="color:' + tierKleur + ';background:' + tierKleur + '22;">' +
                    escHtml(r.tier || "guest") + '</span></td>' +  // tier badge
                '<td>' + escHtml(formatDuur(r.duration_sec)) + '</td>' +
                '<td style="font-size:0.76rem;">' + escHtml(tijdstip) + '</td>' +
                '<td style="color:var(--text-muted);font-size:0.68rem;">' +
                    escHtml((r.session_id || "").slice(0, 16) + "…") + '</td>' + // sessie ID ingekort
                '</tr>'
            );
        });

        html += '</tbody></table>';
        container.innerHTML = html;                                // injecteren in DOM
    }

    /**
     * renderFooter()
     * Toont tijdstip van laatste refresh onderaan het dashboard.
     */
    function renderFooter() {
        const footer = el("dash-footer");
        if (!footer) return;
        footer.textContent = "Laatste update: " + new Date().toLocaleString("nl-BE"); // huidige tijd
    }

    // --- Hoofd render --------------------------------------------------------

    /**
     * renderDashboard()
     * Haalt data op uit Supabase en rendert alle dashboard-secties.
     */
    async function renderDashboard() {
        showLaad("stat-grid",      "Laden…");                      // laad-berichten tonen
        showLaad("events-chart",   "Laden…");
        showLaad("pages-chart",    "Laden…");
        showLaad("sessions-table", "Laden…");

        const bezoeken = await haalData();                         // data ophalen uit Supabase

        renderStatKaarten(bezoeken);                               // bovenste kaarten
        renderPaginaStats(bezoeken);                               // pagina balkgrafiek
        renderTierVerdeling(bezoeken);                             // tier verdeling
        renderDeviceGrid(bezoeken);                                // sessie pills
        renderRecenteTabel(bezoeken);                              // recente bezoeken tabel
        renderFooter();                                            // timestamp
    }

    // --- Event listeners -----------------------------------------------------

    // Vernieuwen-knop: herlaad data uit Supabase
    document.getElementById("btn-refresh").addEventListener("click", renderDashboard);

    // Wis-knop: server-side data kan alleen via Supabase Dashboard gewist worden
    document.getElementById("btn-clear").addEventListener("click", function () {
        alert("Server-side data wis je via het Supabase Dashboard → Table Editor → page_visits.");
    });

    // =========================================================================
    // SECTIE 4 — INIT  (admin-check + opstarten)
    // =========================================================================

    /**
     * Controleer of gebruiker admin is voordat dashboard getoond wordt.
     * Gebruikt AuthModule.getProfile() uit auth.js.
     */
    window.addEventListener("load", function () {

        // Stap 1: AuthModule beschikbaar?
        if (typeof window.AuthModule === "undefined") {
            console.error("[Dashboard] AuthModule niet gevonden.");      // log fout
            window.location.href = "/MyFamTreeCollab/index.html";        // doorsturen
            return;
        }

        // Stap 2: profiel ophalen uit Supabase
        AuthModule.getProfile().then(function (result) {
            const profile = result.profile;                        // profiel object ophalen

            // Stap 3: niet ingelogd → doorsturen
            if (!profile) {
                window.location.href = "/MyFamTreeCollab/index.html";
                return;
            }

            // Stap 4: geen admin → doorsturen
            if (!profile.is_admin) {
                window.location.href = "/MyFamTreeCollab/index.html";
                return;
            }

            // Stap 5: admin bevestigd — bezoek registreren + dashboard laden
            trackPage("analytics-dashboard");                      // paginabezoek registreren
            renderDashboard();                                     // dashboard renderen
        });
    });

})(); // einde IIFE — geen globals behalve window.SiteAnalytics
