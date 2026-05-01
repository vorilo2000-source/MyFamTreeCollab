/**
 * =============================================================================
 * analytics-dashboard.js — MyFamTreeCollab Analytics Dashboard Controller
 * =============================================================================
 * Version    : 2.0.0
 * Wijziging  : Volledig herschreven — data komt nu uit Supabase (page_visits)
 *              in plaats van localStorage. Toont echte bezoekers, pagina stats,
 *              bezoekduur en tier-verdeling.
 * Vereist    : Supabase SDK + auth.js geladen vóór dit script
 * Pagina     : admin/analytics.html
 * =============================================================================
 */

// ======================= SUPABASE CONFIG =======================

const DASH_URL  = "https://oihzuwlcgyyeuhghjahp.supabase.co"; // Supabase project URL
const DASH_ANON = "sb_publishable_9lSmr_sW7iryYDlDXPZZtw_tlbwTyDS"; // anon key

// ======================= HELPER FUNCTIES =======================

/**
 * el(id)
 * Korte wrapper voor document.getElementById.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function el(id) {
    return document.getElementById(id);                    // element ophalen via ID
}

/**
 * escHtml(str)
 * Escaped string voor veilig gebruik in innerHTML — voorkomt XSS.
 * @param {string} str
 * @returns {string}
 */
function escHtml(str) {
    return String(str)                                     // zeker een string maken
        .replace(/&/g, "&amp;")                            // ampersand escapen
        .replace(/</g, "&lt;")                             // kleiner-dan escapen
        .replace(/>/g, "&gt;")                             // groter-dan escapen
        .replace(/"/g, "&quot;");                          // aanhalingstekens escapen
}

/**
 * formatDuur(sec)
 * Zet seconden om naar leesbare string.
 * @param {number} sec
 * @returns {string} bv. "2m 14s" of "45s"
 */
function formatDuur(sec) {
    if (!sec || sec <= 0) return "—";                      // geen of negatieve waarde
    const m = Math.floor(sec / 60);                        // volle minuten
    const s = sec % 60;                                    // resterende seconden
    return m > 0 ? m + "m " + s + "s" : s + "s";          // opgemaakt resultaat
}

/**
 * showLaad(containerId, tekst)
 * Toont een laad-bericht in een container.
 */
function showLaad(containerId, tekst) {
    const c = el(containerId);                             // container ophalen
    if (c) c.innerHTML = '<p class="empty-msg">' + escHtml(tekst || "Laden…") + '</p>'; // bericht tonen
}

// ======================= DATA OPHALEN UIT SUPABASE =======================

/**
 * haalData()
 * Haalt alle page_visits op uit Supabase voor de afgelopen 30 dagen.
 * Alleen admins hebben SELECT rechten (via RLS).
 * @returns {Promise<Array>} array van bezoek-rijen
 */
async function haalData() {
    const client = supabase.createClient(DASH_URL, DASH_ANON); // Supabase client aanmaken

    const dertigDagenGeleden = new Date();                 // huidige datum
    dertigDagenGeleden.setDate(dertigDagenGeleden.getDate() - 30); // 30 dagen terug

    const { data, error } = await client
        .from("page_visits")                               // page_visits tabel
        .select("*")                                       // alle kolommen ophalen
        .gte("visited_at", dertigDagenGeleden.toISOString()) // alleen laatste 30 dagen
        .order("visited_at", { ascending: false });        // nieuwste eerst

    if (error) {
        console.error("[Dashboard] Data ophalen mislukt:", error.message); // log fout
        return [];                                         // lege array als fallback
    }

    return data || [];                                     // geef data terug (of lege array)
}

// ======================= STAT KAARTEN =======================

/**
 * renderStatKaarten(bezoeken)
 * Rendert de vier bovenste statistiekenkaarten.
 * @param {Array} bezoeken - alle page_visits rijen
 */
function renderStatKaarten(bezoeken) {
    const grid = el("stat-grid");                          // grid container ophalen
    if (!grid) return;                                     // veiligheidscheck

    const totaalBezoeken  = bezoeken.length;               // totaal aantal paginabezoeken
    const uniekeSessionen = new Set(bezoeken.map(function(r) { return r.session_id; })).size; // unieke sessies
    const gemDuur = bezoeken.filter(function(r) { return r.duration_sec; }) // alleen rijen met duur
        .reduce(function(som, r, _, arr) {
            return som + r.duration_sec / arr.length;      // gemiddelde berekenen
        }, 0);

    const vandaag = new Date().toDateString();             // datum van vandaag als string
    const vandaagBezoeken = bezoeken.filter(function(r) { // filter op vandaag
        return new Date(r.visited_at).toDateString() === vandaag;
    }).length;                                             // aantal bezoeken vandaag

    // Definieer kaarten
    const kaarten = [
        { label: "Paginabezoeken",    value: totaalBezoeken,           unit: "30 dagen" },
        { label: "Unieke bezoekers",  value: uniekeSessionen,          unit: "sessies"  },
        { label: "Gem. verblijfsduur",value: formatDuur(Math.round(gemDuur)), unit: ""  },
        { label: "Vandaag",           value: vandaagBezoeken,          unit: "bezoeken" }
    ];

    // Bouw HTML voor alle kaarten
    grid.innerHTML = kaarten.map(function(k) {
        return (
            '<div class="stat-card">' +
            '  <div class="label">' + escHtml(k.label) + '</div>' +   // kaarttitel
            '  <div class="value">' + escHtml(String(k.value)) +       // grote waarde
            '    <span class="unit">' + escHtml(k.unit) + '</span>' +  // kleine eenheid
            '  </div>' +
            '</div>'
        );
    }).join("");                                           // samenvoegen tot één HTML string
}

// ======================= PAGINA STATISTIEKEN =======================

/**
 * renderPaginaStats(bezoeken)
 * Toont balkgrafiek van meest bezochte pagina's inclusief gemiddelde duur.
 * @param {Array} bezoeken
 */
function renderPaginaStats(bezoeken) {
    const container = el("events-chart");                  // container ophalen
    if (!container) return;                                // veiligheidscheck

    // Groepeer bezoeken per pagina
    const perPagina = {};                                  // { paginanaam: { count, totalDuur } }
    bezoeken.forEach(function(r) {
        if (!perPagina[r.page]) {
            perPagina[r.page] = { count: 0, totalDuur: 0, metDuur: 0 }; // initialiseer
        }
        perPagina[r.page].count++;                         // bezoekteller ophogen
        if (r.duration_sec) {
            perPagina[r.page].totalDuur += r.duration_sec; // duur optellen
            perPagina[r.page].metDuur++;                   // teller voor gemiddelde
        }
    });

    const entries = Object.entries(perPagina)
        .sort(function(a, b) { return b[1].count - a[1].count; }); // sorteren: meest bezocht eerst

    if (entries.length === 0) {
        container.innerHTML = '<p class="empty-msg">Nog geen paginabezoeken geregistreerd.</p>';
        return;
    }

    const max = entries[0][1].count;                       // hoogste bezoekcount = 100% breedte

    container.innerHTML = entries.map(function(entry) {
        const pagina  = entry[0];                          // paginanaam
        const stats   = entry[1];                          // { count, totalDuur, metDuur }
        const pct     = max > 0 ? (stats.count / max) * 100 : 0; // percentage t.o.v. max
        const gemDuur = stats.metDuur > 0
            ? formatDuur(Math.round(stats.totalDuur / stats.metDuur)) // gem. duur per pagina
            : "—";                                         // geen duurdata beschikbaar

        return (
            '<div class="event-row">' +
            '  <span class="event-label">' + escHtml(pagina) + '</span>' +        // paginanaam
            '  <div class="event-bar-wrap">' +
            '    <div class="event-bar" data-pct="' + pct + '"></div>' +          // balk
            '  </div>' +
            '  <span class="event-count">' + escHtml(String(stats.count)) + '</span>' + // aantal
            '  <span style="font-size:0.7rem;color:var(--text-muted);min-width:52px;text-align:right;">' +
               escHtml(gemDuur) + '</span>' +                                     // gem. duur
            '</div>'
        );
    }).join("");

    // Animeer balken na DOM render
    requestAnimationFrame(function() {
        container.querySelectorAll(".event-bar").forEach(function(bar) {
            bar.style.width = bar.dataset.pct + "%";       // breedte instellen — triggert CSS animatie
        });
    });
}

// ======================= TIER VERDELING =======================

/**
 * renderTierVerdeling(bezoeken)
 * Toont verdeling van bezoeken per account tier (guest/viewer/editor/owner/admin).
 * @param {Array} bezoeken
 */
function renderTierVerdeling(bezoeken) {
    const container = el("pages-chart");                   // container ophalen
    if (!container) return;                                // veiligheidscheck

    // Tel bezoeken per tier
    const perTier = {};                                    // { tier: count }
    bezoeken.forEach(function(r) {
        const tier = r.tier || "guest";                    // fallback naar guest
        perTier[tier] = (perTier[tier] || 0) + 1;         // teller ophogen
    });

    const tierKleuren = {                                  // kleur per tier (zelfde als accountbeheer)
        guest:  { bg: "#3a3a4a", fg: "#aaaacc" },          // grijsblauw — gast
        viewer: { bg: "#1a3a2a", fg: "#6ee09a" },          // groen — viewer
        editor: { bg: "#1a2a3a", fg: "#6ab4f0" },          // blauw — editor
        owner:  { bg: "#3a2e0a", fg: "#f0c040" },          // goud — owner
        admin:  { bg: "#3a1a1a", fg: "#f08080" }           // rood — admin
    };

    const entries = Object.entries(perTier)
        .sort(function(a, b) { return b[1] - a[1]; });     // sorteren op count

    if (entries.length === 0) {
        container.innerHTML = '<p class="empty-msg">Geen tier-data beschikbaar.</p>';
        return;
    }

    const max = entries[0][1];                             // hoogste count = 100%

    container.innerHTML = entries.map(function(entry) {
        const tier  = entry[0];                            // tier naam
        const count = entry[1];                            // bezoekcount
        const pct   = max > 0 ? (count / max) * 100 : 0; // percentage
        const kleur = tierKleuren[tier] || { bg: "#444", fg: "#ccc" }; // fallback kleur

        return (
            '<div class="event-row">' +
            '  <span class="event-label" style="color:' + kleur.fg + ';">' + escHtml(tier) + '</span>' + // tier naam in tierkleur
            '  <div class="event-bar-wrap">' +
            '    <div class="event-bar" data-pct="' + pct + '" style="background:' + kleur.fg + ';"></div>' + // gekleurde balk
            '  </div>' +
            '  <span class="event-count" style="color:' + kleur.fg + ';">' + escHtml(String(count)) + '</span>' + // count in tierkleur
            '</div>'
        );
    }).join("");

    // Animeer balken
    requestAnimationFrame(function() {
        container.querySelectorAll(".event-bar").forEach(function(bar) {
            bar.style.width = bar.dataset.pct + "%";       // breedte instellen
        });
    });
}

// ======================= DEVICE BREAKDOWN =======================

/**
 * renderDeviceGrid(bezoeken)
 * Toont verdeling van sessies per device type.
 * Detectie gebaseerd op session_id — niet op user agent (niet opgeslagen).
 * Valt terug op een vaste verdeling uit de data.
 * @param {Array} bezoeken
 */
function renderDeviceGrid(bezoeken) {
    const container = el("device-grid");                   // container ophalen
    if (!container) return;                                // veiligheidscheck

    // Unieke sessies tellen (sessie = één device-bezoek)
    const uniekeSessionen = new Set(bezoeken.map(function(r) { return r.session_id; })).size;

    // Device info niet opgeslagen — toon totaal unieke sessies als alternatief
    container.innerHTML = (
        '<div class="device-pill">👥 <span>Unieke sessies</span> <strong>' + escHtml(String(uniekeSessionen)) + '</strong></div>' +
        '<div class="device-pill">📄 <span>Totaal bezoeken</span> <strong>' + escHtml(String(bezoeken.length)) + '</strong></div>'
    );
}

// ======================= RECENTE BEZOEKEN TABEL =======================

/**
 * renderRecenteTabel(bezoeken)
 * Toont de 15 meest recente paginabezoeken in een tabel.
 * @param {Array} bezoeken
 */
function renderRecenteTabel(bezoeken) {
    const container = el("sessions-table");                // container ophalen
    if (!container) return;                                // veiligheidscheck

    const recente = bezoeken.slice(0, 15);                 // maximaal 15 rijen tonen

    if (recente.length === 0) {
        container.innerHTML = '<p class="empty-msg">Nog geen bezoeken geregistreerd.</p>';
        return;
    }

    const tierKleuren = {                                  // kleur per tier
        guest:  "#aaaacc", viewer: "#6ee09a",
        editor: "#6ab4f0", owner:  "#f0c040", admin: "#f08080"
    };

    let html = (
        '<table><thead><tr>' +
        '<th>Pagina</th>' +                                // bezochte pagina
        '<th>Tier</th>' +                                  // account tier
        '<th>Duur</th>' +                                  // verblijfsduur
        '<th>Tijdstip</th>' +                              // wanneer bezocht
        '<th>Sessie ID</th>' +                             // anonieme sessie
        '</tr></thead><tbody>'
    );

    recente.forEach(function(r) {
        const tierKleur = tierKleuren[r.tier] || "#ccc";   // kleur voor tier badge
        const tijdstip  = r.visited_at
            ? new Date(r.visited_at).toLocaleString("nl-BE") // datum + tijd in Belgisch formaat
            : "—";                                         // geen tijdstip

        html += (
            '<tr>' +
            '<td>' + escHtml(r.page || "—") + '</td>' +                           // paginanaam
            '<td><span class="badge" style="color:' + tierKleur + ';background:' + tierKleur + '22;">' +
                escHtml(r.tier || "guest") + '</span></td>' +                     // tier badge
            '<td>' + escHtml(formatDuur(r.duration_sec)) + '</td>' +              // duur
            '<td style="font-size:0.76rem;">' + escHtml(tijdstip) + '</td>' +     // tijdstip
            '<td style="color:var(--text-muted);font-size:0.68rem;">' +
                escHtml((r.session_id || "").slice(0, 16) + "…") + '</td>' +      // sessie ID (ingekort)
            '</tr>'
        );
    });

    html += '</tbody></table>';                            // tabel afsluiten
    container.innerHTML = html;                            // injecteren in DOM
}

// ======================= TIMESTAMP FOOTER =======================

/**
 * renderFooter()
 * Toont tijdstip van laatste refresh onderaan het dashboard.
 */
function renderFooter() {
    const footer = el("dash-footer");                      // footer element ophalen
    if (!footer) return;                                   // veiligheidscheck
    footer.textContent = "Laatste update: " + new Date().toLocaleString("nl-BE"); // huidige tijd
}

// ======================= HOOFD RENDER FUNCTIE =======================

/**
 * renderDashboard()
 * Haalt data op uit Supabase en rendert alle dashboard-secties.
 * Wordt aangeroepen na admin-check én bij klik op Vernieuwen.
 */
async function renderDashboard() {
    // Toon laad-berichten in alle secties
    showLaad("stat-grid",      "Laden…");
    showLaad("events-chart",   "Laden…");
    showLaad("pages-chart",    "Laden…");
    showLaad("sessions-table", "Laden…");

    const bezoeken = await haalData();                     // data ophalen uit Supabase

    renderStatKaarten(bezoeken);                           // bovenste kaarten renderen
    renderPaginaStats(bezoeken);                           // pagina balkgrafiek renderen
    renderTierVerdeling(bezoeken);                         // tier verdeling renderen
    renderDeviceGrid(bezoeken);                            // sessie pills renderen
    renderRecenteTabel(bezoeken);                          // recente bezoeken tabel renderen
    renderFooter();                                        // timestamp onderaan renderen
}

// ======================= EVENT LISTENERS =======================

// Vernieuwen-knop: herlaad data uit Supabase
document.getElementById("btn-refresh").addEventListener("click", function() {
    renderDashboard();                                     // volledige herlaad
});

// Wis-knop: verwijdert GEEN Supabase data — lokale analytics.js data wissen
document.getElementById("btn-clear").addEventListener("click", function() {
    alert("Server-side analytics data kan alleen via Supabase Dashboard gewist worden."); // info
});

// ======================= BEVEILIGINGSCHECK + INITIALISATIE =======================

/**
 * Controleer of gebruiker admin is voordat dashboard getoond wordt.
 * Gebruikt AuthModule.getProfile() uit auth.js.
 */
window.addEventListener("load", function() {

    // Stap 1: controleer of AuthModule beschikbaar is
    if (typeof window.AuthModule === "undefined") {
        console.error("[Dashboard] AuthModule niet gevonden.");                    // log fout
        window.location.href = "/MyFamTreeCollab/index.html";                     // doorsturen
        return;                                                                   // stoppen
    }

    // Stap 2: haal profiel op uit Supabase
    AuthModule.getProfile().then(function(result) {
        const profile = result.profile;                    // profiel object ophalen

        // Stap 3: niet ingelogd → doorsturen
        if (!profile) {
            window.location.href = "/MyFamTreeCollab/index.html"; // niet ingelogd
            return;
        }

        // Stap 4: geen admin → doorsturen
        if (!profile.is_admin) {
            window.location.href = "/MyFamTreeCollab/index.html"; // geen admin
            return;
        }

        // Stap 5: admin bevestigd — dashboard laden
        renderDashboard();
    });
});
