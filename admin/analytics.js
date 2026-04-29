/**
 * =============================================================================
 * analytics-dashboard.js — MyFamTreeCollab Analytics Dashboard Controller
 * =============================================================================
 * Version    : 1.0.0
 * Author     : MyFamTreeCollab Dev
 * Description: Leest data via window.Analytics.getStats() en rendert
 *              alle dashboard UI-elementen dynamisch in analytics.html.
 *              Geen externe dependencies. Volledig vanilla JS.
 * Vereist    : analytics.js geladen vóór dit script
 * Pagina     : admin/analytics.html
 * =============================================================================
 */

// ======================= GUARD: ANALYTICS BESCHIKBAAR? =======================

// Controleer of de Analytics module correct geladen is
if (typeof window.Analytics === "undefined") {
    // Analytics niet beschikbaar — log waarschuwing en stop
    console.error("[Dashboard] window.Analytics niet gevonden. Is analytics.js geladen?");
}

// ======================= HELPER FUNCTIES =======================

/**
 * formatDuration(seconds)
 * Zet seconden om naar leesbare string: "Xm Ys"
 * @param {number} seconds - duur in seconden
 * @returns {string} opgemaakte duur
 */
function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return "0s";             // Niets of negatief
    const m = Math.floor(seconds / 60);                    // Volle minuten
    const s = seconds % 60;                                // Resterende seconden
    return m > 0 ? m + "m " + s + "s" : s + "s";          // Formaat: "2m 14s" of "45s"
}

/**
 * formatTimestamp(ms)
 * Zet een Unix milliseconde timestamp om naar leesbare datum+tijd string.
 * @param {number} ms - timestamp in milliseconden
 * @returns {string} bv. "29/04/2026 14:32"
 */
function formatTimestamp(ms) {
    if (!ms) return "—";                                   // Geen waarde → streepje
    const d = new Date(ms);                                // Maak Date object
    const date = d.toLocaleDateString("nl-BE");            // Datum in Belgisch formaat
    const time = d.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" }); // HH:MM
    return date + " " + time;                              // Combineer datum + tijd
}

/**
 * el(id)
 * Korte wrapper voor document.getElementById — bespaart herhaling.
 * @param {string} id - element ID
 * @returns {HTMLElement|null}
 */
function el(id) {
    return document.getElementById(id);                    // Geef element terug
}

/**
 * escHtml(str)
 * Escaped een string voor veilig gebruik in innerHTML.
 * Voorkomt XSS als event-namen of meta-data vreemde tekens bevatten.
 * @param {string} str
 * @returns {string} escaped string
 */
function escHtml(str) {
    return String(str)                                     // Zeker een string
        .replace(/&/g, "&amp;")                            // Ampersand escapen
        .replace(/</g, "&lt;")                             // Kleiner-dan escapen
        .replace(/>/g, "&gt;")                             // Groter-dan escapen
        .replace(/"/g, "&quot;");                          // Aanhalingstekens escapen
}

// ======================= STAT KAARTEN RENDEREN =======================

/**
 * renderStatCards(stats)
 * Bouwt de vier bovenste statistiekenkaarten op basis van Analytics.getStats().
 * @param {Object} stats - resultaat van Analytics.getStats()
 */
function renderStatCards(stats) {
    const grid = el("stat-grid");                          // Grid container ophalen
    if (!grid) return;                                     // Veiligheidscheck

    // Definieer de vier kaarten: label, waarde, eenheid
    const cards = [
        {
            label: "Sessies",                              // Kaarttitel
            value: stats.totalSessions,                   // Statistische waarde
            unit:  ""                                      // Geen eenheid
        },
        {
            label: "Events",
            value: stats.totalEvents,
            unit:  ""
        },
        {
            label: "Gem. sessieduur",
            value: formatDuration(stats.avgSessionDurationSeconds), // Opgemaakte duur
            unit:  ""
        },
        {
            label: "Voltooide sessies",
            value: stats.completedSessions,
            unit:  ""
        }
    ];

    // Bouw HTML voor alle kaarten tegelijk
    grid.innerHTML = cards.map(function(card) {
        return (
            '<div class="stat-card">' +                    // Kaart container
            '  <div class="label">' + escHtml(card.label) + '</div>' + // Label bovenaan
            '  <div class="value">' + escHtml(String(card.value)) +    // Grote waarde
            '    <span class="unit">' + escHtml(card.unit) + '</span>' + // Eenheid
            '  </div>' +
            '</div>'
        );
    }).join("");                                           // Array samenvoegen tot één HTML-string
}

// ======================= EVENTS BALKGRAFIEK RENDEREN =======================

/**
 * renderEventsChart(eventCounts)
 * Rendert een horizontale balkgrafiek van events per type.
 * Sorteert van meest naar minst voorkomend.
 * @param {Object} eventCounts - { event_type: count }
 */
function renderEventsChart(eventCounts) {
    const container = el("events-chart");                  // Container ophalen
    if (!container) return;                                // Veiligheidscheck

    const entries = Object.entries(eventCounts);           // Zet object om naar [[type, count], ...]

    if (entries.length === 0) {
        container.innerHTML = '<p class="empty-msg">Nog geen events geregistreerd.</p>';
        return;                                            // Vroegtijdig stoppen bij lege data
    }

    // Sorteer aflopend op count (meest voorkomend bovenaan)
    entries.sort(function(a, b) { return b[1] - a[1]; }); // b[1] = count van b

    const max = entries[0][1];                             // Hoogste count = 100% breedte referentie

    // Bouw HTML voor alle rijen
    container.innerHTML = entries.map(function(entry) {
        const type  = entry[0];                            // Event naam
        const count = entry[1];                            // Event teller
        const pct   = max > 0 ? (count / max) * 100 : 0; // Percentage t.o.v. maximum

        return (
            '<div class="event-row">' +
            '  <span class="event-label">' + escHtml(type) + '</span>' + // Event naam
            '  <div class="event-bar-wrap">' +
            '    <div class="event-bar" data-pct="' + pct + '"></div>' + // Balk — breedte via JS
            '  </div>' +
            '  <span class="event-count">' + escHtml(String(count)) + '</span>' + // Getal rechts
            '</div>'
        );
    }).join("");

    // Zet balken op correcte breedte NADAT DOM gerenderd is (voor animatie)
    requestAnimationFrame(function() {
        container.querySelectorAll(".event-bar").forEach(function(bar) {
            bar.style.width = bar.dataset.pct + "%";       // Pas breedte toe — triggert CSS transitie
        });
    });
}

// ======================= PAGINA BEZOEKEN RENDEREN =======================

/**
 * renderPagesChart(pagesVisited)
 * Rendert balkgrafiek van pagina bezoeken — zelfde opzet als events.
 * @param {Object} pagesVisited - { page_name: visit_count }
 */
function renderPagesChart(pagesVisited) {
    const container = el("pages-chart");                   // Container ophalen
    if (!container) return;                                // Veiligheidscheck

    // Verwijder page_view events die al in events chart staan — toon alleen echte pagina namen
    const entries = Object.entries(pagesVisited)
        .filter(function(e) { return e[0] !== "page_view"; }) // Verberg interne page_view entries
        .sort(function(a, b) { return b[1] - a[1]; });        // Sorteren aflopend

    if (entries.length === 0) {
        container.innerHTML = '<p class="empty-msg">Nog geen pagina bezoeken.</p>';
        return;
    }

    const max = entries[0][1];                             // Hoogste bezoekcount

    container.innerHTML = entries.map(function(entry) {
        const page  = entry[0];                            // Paginanaam
        const count = entry[1];                            // Bezoekteller
        const pct   = max > 0 ? (count / max) * 100 : 0; // Percentage

        return (
            '<div class="event-row">' +
            '  <span class="event-label">' + escHtml(page) + '</span>' +
            '  <div class="event-bar-wrap">' +
            '    <div class="event-bar" data-pct="' + pct + '"></div>' +
            '  </div>' +
            '  <span class="event-count">' + escHtml(String(count)) + '</span>' +
            '</div>'
        );
    }).join("");

    // Animeer balken na DOM render
    requestAnimationFrame(function() {
        container.querySelectorAll(".event-bar").forEach(function(bar) {
            bar.style.width = bar.dataset.pct + "%";       // Breedte instellen
        });
    });
}

// ======================= DEVICE BREAKDOWN RENDEREN =======================

/**
 * renderDeviceGrid(deviceBreakdown)
 * Rendert pills voor desktop / mobile / tablet sessieaantallen.
 * @param {Object} deviceBreakdown - { desktop: N, mobile: N, tablet: N }
 */
function renderDeviceGrid(deviceBreakdown) {
    const container = el("device-grid");                   // Container ophalen
    if (!container) return;                                // Veiligheidscheck

    // Iconen per device type
    const icons = {
        desktop: "🖥️",                                    // Desktop icoon
        mobile:  "📱",                                    // Mobiel icoon
        tablet:  "📋"                                     // Tablet icoon
    };

    // Bouw een pill per device type
    container.innerHTML = Object.entries(deviceBreakdown).map(function(entry) {
        const device = entry[0];                           // Device naam
        const count  = entry[1];                           // Sessieaantal
        const icon   = icons[device] || "💻";             // Fallback icoon

        return (
            '<div class="device-pill">' +
            '  ' + icon +                                  // Icoon
            '  <span>' + escHtml(device) + '</span>' +    // Device naam
            '  <strong>' + escHtml(String(count)) + '</strong>' + // Aantal
            '</div>'
        );
    }).join("");
}

// ======================= RECENTE SESSIES TABEL RENDEREN =======================

/**
 * renderSessionsTable(stats)
 * Toont de 10 meest recente sessies in een HTML-tabel.
 * Haalt ruwe sessie data op via Analytics.exportData().
 * @param {Object} stats - (niet direct gebruikt, maar meegestuurd voor consistentie)
 */
function renderSessionsTable() {
    const container = el("sessions-table");                // Container ophalen
    if (!container) return;                                // Veiligheidscheck

    const store = window.Analytics.exportData();           // Ruwe localStorage data ophalen
    const sessions = (store.sessions || [])
        .slice()                                           // Kopie maken — origineel niet aanpassen
        .reverse()                                         // Meest recente eerst
        .slice(0, 10);                                     // Maximaal 10 rijen tonen

    if (sessions.length === 0) {
        container.innerHTML = '<p class="empty-msg">Nog geen sessies geregistreerd.</p>';
        return;
    }

    // Tabel header
    let html = (
        '<table>' +
        '<thead><tr>' +
        '  <th>ID</th>' +                                  // Sessie-ID
        '  <th>Start</th>' +                               // Starttijd
        '  <th>Einde</th>' +                               // Eindtijd
        '  <th>Duur</th>' +                                // Berekende duur
        '  <th>Pagina\'s</th>' +                           // Aantal bezochte pagina's
        '  <th>Device</th>' +                              // Device type
        '</tr></thead><tbody>'
    );

    // Tabel rijen
    sessions.forEach(function(sess) {
        const duur = sess.end && sess.start              // Duur berekenen als beide aanwezig
            ? formatDuration(Math.round((sess.end - sess.start) / 1000)) // In seconden
            : "Actief";                                    // Sessie nog niet afgesloten

        const aantalPaginas = Array.isArray(sess.pages)   // Controleer of pages array is
            ? sess.pages.length                            // Gebruik lengte
            : 0;                                           // Fallback: 0

        html += (
            '<tr>' +
            '  <td style="color:var(--text-muted);font-size:0.68rem;">' + escHtml(sess.id) + '</td>' + // Sessie ID gedimed
            '  <td>' + formatTimestamp(sess.start) + '</td>' +             // Starttijd opgemaakt
            '  <td>' + (sess.end ? formatTimestamp(sess.end) : '<em style="color:var(--accent)">actief</em>') + '</td>' + // Einde of "actief"
            '  <td>' + escHtml(duur) + '</td>' +                           // Duur
            '  <td>' + escHtml(String(aantalPaginas)) + '</td>' +          // Aantal pagina's
            '  <td><span class="badge">' + escHtml(sess.device || "?") + '</span></td>' + // Device badge
            '</tr>'
        );
    });

    html += '</tbody></table>';                            // Tabel afsluiten
    container.innerHTML = html;                            // Injecteren in DOM
}

// ======================= TIMESTAMP FOOTER =======================

/**
 * renderFooter()
 * Toont het tijdstip van de laatste data refresh onderaan het dashboard.
 */
function renderFooter() {
    const footer = el("dash-footer");                      // Footer element ophalen
    if (!footer) return;                                   // Veiligheidscheck
    footer.textContent = "Laatste update: " + formatTimestamp(Date.now()); // Huidige tijd tonen
}

// ======================= HOOFD RENDER FUNCTIE =======================

/**
 * renderDashboard()
 * Laadt alle statistieken en rendert alle dashboard-secties opnieuw.
 * Wordt opgeroepen bij paginalaad én bij klik op "Vernieuwen".
 */
function renderDashboard() {
    if (typeof window.Analytics === "undefined") return;   // Analytics niet geladen — stop

    const stats = window.Analytics.getStats();             // Alle statistieken ophalen

    renderStatCards(stats);                                // Bovenste kaarten renderen
    renderEventsChart(stats.eventCounts);                  // Events balkgrafiek renderen
    renderPagesChart(stats.pagesVisited);                  // Pagina bezoeken renderen
    renderDeviceGrid(stats.deviceBreakdown);               // Device pills renderen
    renderSessionsTable();                                 // Sessies tabel renderen
    renderFooter();                                        // Timestamp onderaan renderen
}

// ======================= EVENT LISTENERS =======================

// Vernieuwen-knop: herlaad statistieken zonder pagina refresh
document.getElementById("btn-refresh").addEventListener("click", function() {
    renderDashboard();                                     // Herrender alle secties
});

// Wis-knop: verwijder alle analytics data na bevestiging
document.getElementById("btn-clear").addEventListener("click", function() {
    // Bevestigingsdialoog — gebruiker moet expliciet akkoord gaan
    if (!confirm("Alle analytics data definitief wissen? Dit kan niet ongedaan gemaakt worden.")) {
        return;                                            // Geannuleerd — niets doen
    }
    window.Analytics.clearData();                          // Wis data via Analytics API
    renderDashboard();                                     // Herrender (toont lege staat)
});

// ======================= BEVEILIGINGSCHECK + INITIALISATIE =======================

/**
 * Controleer of de gebruiker ingelogd én admin is voordat het dashboard getoond wordt.
 * Gebruikt AuthModule.getProfile() uit auth.js — haalt profiel op uit Supabase profiles tabel.
 * Als de gebruiker niet ingelogd is of geen admin — doorsturen naar home.
 * Als de gebruiker wel admin is — dashboard renderen.
 */
window.addEventListener("load", function() {

    // Stap 1: controleer of AuthModule beschikbaar is (auth.js geladen?)
    if (typeof window.AuthModule === "undefined") {
        console.error("[Dashboard] AuthModule niet gevonden. Is auth.js geladen?"); // Foutmelding
        window.location.href = "/MyFamTreeCollab/index.html";                       // Veilig doorsturen
        return;                                                                      // Stoppen
    }

    // Stap 2: haal profiel op uit Supabase via auth.js
    AuthModule.getProfile().then(function(result) {
        const profile = result.profile;                    // profiel object { tier, is_admin, ... }

        // Stap 3: geen profiel = niet ingelogd → terug naar home
        if (!profile) {
            window.location.href = "/MyFamTreeCollab/index.html"; // niet ingelogd — weg
            return;                                                // stoppen
        }

        // Stap 4: profiel aanwezig maar is_admin is false → geen toegang
        if (!profile.is_admin) {
            window.location.href = "/MyFamTreeCollab/index.html"; // geen admin — weg
            return;                                                // stoppen
        }

        // Stap 5: gebruiker is admin — pagina tracking registreren
        window.Analytics.trackPage("analytics-dashboard");        // bezoek registreren

        // Stap 6: dashboard renderen — alle secties opbouwen
        renderDashboard();
    });
});
