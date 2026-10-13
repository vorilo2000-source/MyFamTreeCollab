# overzicht.js

```javascript
/**
 * @file js/overzicht.js
 * @version 1.1.0
 * @description Page script for abonnementen/overzicht.html.
 *              Loaded AFTER i18nModule.init() resolves to prevent the race condition
 *              where updateContent() runs before the 'overzicht' namespace is available,
 *              causing keys to render as their key name.
 *
 *              Responsibilities:
 *              - Load namespace 'overzicht'
 *              - Call updateContent() so data-i18n elements get their translations
 *              - Fill HTML-containing elements via innerHTML (_translateHTMLBlocks):
 *                  rechten-intro  — contains <strong>, <code>, <em>
 *                  donatie-noot   — contains <strong>
 *              - Register languageChanged listener to retranslate on language switch
 *              - Load shared TopBar, Navbar and Footer through LayoutLoader
 *              - Track page visit via SiteAnalytics
 */

// ─────────────────────────────────────────────
// 1. HTML TRANSLATION HELPER
// ─────────────────────────────────────────────

/**
 * _translateHTML(elementId, key)
 * Sets innerHTML of an element to a translated string.
 * Used for elements that contain HTML tags (<strong>, <code>, <em>)
 * which would be stripped by textContent (used by data-i18n / updateContent).
 *
 * @param {string} elementId - ID of the target DOM element
 * @param {string} key       - Full i18n key including namespace
 */
function _translateHTML(elementId, key) {
    var el = document.getElementById(elementId); // Fetch target element by ID
    if (el) el.innerHTML = i18next.t(key);       // Set translated value as innerHTML (preserves HTML markup)
}

/**
 * _translateHTMLBlocks()
 * Translates all elements on this page whose content contains HTML tags.
 * Extracted as a named function so it can be reused by the languageChanged listener.
 */
function _translateHTMLBlocks() {
    _translateHTML('rechten-intro', 'overzicht:rechten.intro'); // Rights intro: contains <strong>, <code>, <em>
    _translateHTML('donatie-noot',  'overzicht:donatie.noot');  // Donation note: contains <strong>
}

// ─────────────────────────────────────────────
// 2. NAMESPACE LOAD + DOM TRANSLATION
// ─────────────────────────────────────────────

// Load the 'overzicht' namespace for the active language (and fallback language).
// i18nModule.init() already resolved, so i18next is ready.
// loadNamespace() fetches the JSON if not yet cached, then calls updateContent()
// to re-translate all [data-i18n] elements with 'overzicht' now available.
i18nModule.loadNamespace('overzicht').then(function() {

    // Fill elements whose content includes HTML markup (cannot use data-i18n for these)
    _translateHTMLBlocks();

    // Register listener: retranslate HTML-containing elements on every language switch
    // updateContent() handles data-i18n elements automatically via handleLanguageChange()
    i18next.on('languageChanged', _translateHTMLBlocks);

    // ─────────────────────────────────────────────
    // 3. CENTRALE LAYOUT LOADER
    // ─────────────────────────────────────────────

    // TopBar, Navbar en Footer worden niet meer door deze pagina afzonderlijk opgehaald.
    // LayoutLoader is de enige uitvoerende loader voor gedeelde layoutcomponenten.
    return LayoutLoader.load().then(function() {

    // ─────────────────────────────────────────────
    // 4. PAGE VISIT TRACKING
    // ─────────────────────────────────────────────

    // Track visit nadat de centrale layout-loader gereed is.
    SiteAnalytics.trackPage('overzicht'); // Register visit in Supabase page_visits table.
    });
}).catch(function(error) {
    console.error('Overzicht initialisatie mislukt:', error); // Toon initialisatiefout zonder een tweede fallback-loader te starten.
});
```
