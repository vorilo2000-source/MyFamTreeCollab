/**
 * @file js/voordelen.js
 * @version 1.0.0
 * @description Page script for abonnementen/voordelen.html.
 *              Loaded AFTER i18nModule.init() resolves to prevent the race condition
 *              where updateContent() runs before the 'voordelen' namespace is available,
 *              causing keys to render as their key name (e.g. 'grid.title').
 *
 *              Responsibilities:
 *              - Load namespace 'voordelen'
 *              - Call updateContent() so data-i18n elements get their translations
 *              - Fetch and inject TopBar (then inject topbar.js), Navbar, Footer
 *              - Track page visit via SiteAnalytics
 *
 *              Note: voordelen.html has no HTML-containing elements (no <strong>, <a>
 *              inside translated strings), so no _translateHTML() helper is needed.
 */

// ─────────────────────────────────────────────
// 1. NAMESPACE LOAD + DOM TRANSLATION
// ─────────────────────────────────────────────

// Load the 'voordelen' namespace for the active language (and fallback language).
// i18nModule.init() already resolved, so i18next is ready.
// loadNamespace() fetches the JSON if not yet cached, then calls updateContent()
// to re-translate all [data-i18n] elements with 'voordelen' now available.
i18nModule.loadNamespace('voordelen').then(function() {

    // ─────────────────────────────────────────────
    // 2. LAYOUT COMPONENT FETCHES
    // ─────────────────────────────────────────────

    // TopBar: fetch HTML, inject via onComponentLoaded (translates + rebuilds switcher),
    // then inject topbar.js to guarantee #top-auth is in DOM before topbar.js runs
    fetch('/MyFamTreeCollab/Layout/TopBar.html')
        .then(function(resp) { return resp.text(); })                                         // Fetch HTML as text
        .then(function(data) {
            i18nModule.onComponentLoaded(data, document.getElementById('topbar-placeholder')); // Inject + translate TopBar
            var s = document.createElement('script');                                          // Create script element
            s.src = '../js/topbar.js';                                                         // Path to topbar.js
            document.body.appendChild(s);                                                      // Append — browser executes immediately
        });

    // Navbar: no auth dependency, may load in parallel
    fetch('/MyFamTreeCollab/Layout/Navbar.html')
        .then(function(resp) { return resp.text(); })                                         // Fetch HTML
        .then(function(data) {
            i18nModule.onComponentLoaded(data, document.getElementById('navbar-placeholder')); // Inject + translate Navbar
        });

    // Footer: no dependencies, may load in parallel
    fetch('/MyFamTreeCollab/Layout/Footer.html')
        .then(function(resp) { return resp.text(); })                                         // Fetch HTML
        .then(function(data) {
            var ph = document.getElementById('footer-placeholder');                            // Fetch placeholder element
            if (ph) ph.innerHTML = data;                                                       // Inject Footer into DOM
        });

    // ─────────────────────────────────────────────
    // 3. PAGE VISIT TRACKING
    // ─────────────────────────────────────────────

    // Track visit after fetch calls so an error here does not block layout loading
    SiteAnalytics.trackPage('voordelen'); // Register visit in Supabase page_visits table
});
