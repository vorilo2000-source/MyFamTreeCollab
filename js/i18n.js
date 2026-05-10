/**
 * @file i18n.js
 * @version 1.0.0
 * @description Core internationalisation module for MyFamTreeCollab.
 *              Uses i18next + i18next-http-backend + i18next-browser-languagedetector.
 *              Supports dynamic namespace loading and real-time language switching.
 * @author MyFamTreeCollab
 */

// ─────────────────────────────────────────────
// 1. CONFIGURATION
// ─────────────────────────────────────────────

/** Supported languages with display labels for the UI switcher */
const SUPPORTED_LANGUAGES = {
  nl: 'Nederlands',
  en: 'English',
  es: 'Español'
};

/** Default / fallback language when nothing else matches */
const FALLBACK_LANGUAGE = 'nl';

/**
 * Base path for locale JSON files.
 * Must match the folder structure:  /locales/{lng}/{ns}.json
 * On GitHub Pages this resolves from the repo root.
 */
const LOCALES_BASE_PATH = '/MyFamTreeCollab/locales/{{lng}}/{{ns}}.json';

// ─────────────────────────────────────────────
// 2. i18next INITIALISATION
// ─────────────────────────────────────────────

/**
 * initialiseI18n()
 * Bootstraps i18next with:
 *   - http-backend  → loads JSON files on demand
 *   - browser language detector → reads navigator / localStorage / cookie
 *
 * Always preloads the `common` namespace so buttons/errors are always available.
 * All other namespaces are loaded lazily via loadNamespace().
 *
 * @returns {Promise<void>}
 */
async function initialiseI18n() {
  await i18next
    // Attach the HTTP back-end plugin (loads JSON over XHR/fetch)
    .use(i18nextHttpBackend)
    // Attach the language-detector plugin (reads navigator, localStorage, cookie …)
    .use(i18nextBrowserLanguageDetector)
    .init({
      // --- Language settings ---
      fallbackLng: FALLBACK_LANGUAGE,            // fall back to Dutch if key missing
      supportedLngs: Object.keys(SUPPORTED_LANGUAGES), // whitelist

      // --- Namespace settings ---
      defaultNS: 'common',                       // used when no NS prefix is given
      ns: ['common'],                            // only preload common; rest loaded lazily
      preload: Object.keys(SUPPORTED_LANGUAGES), // preload all 3 common files up front

      // --- Detection order ---
      detection: {
        // Check in this order: localStorage → navigator → cookie → htmlTag
        order: ['localStorage', 'navigator', 'cookie', 'htmlTag'],
        // Key used to persist the user's choice in localStorage
        lookupLocalStorage: 'mftc_language',
        // Cache the detected language back to localStorage
        caches: ['localStorage']
      },

      // --- HTTP back-end ---
      backend: {
        loadPath: LOCALES_BASE_PATH // e.g. /MyFamTreeCollab/locales/nl/common.json
      },

      // --- Interpolation ---
      interpolation: {
        escapeValue: false // HTML is already escaped in templates; no double-escape
      },

      // --- Debug (disable in production) ---
      debug: false
    });

  // After init: translate everything already in the DOM
  updateContent();

  // Build the language-switcher UI
  buildLanguageSwitcher();
}

// ─────────────────────────────────────────────
// 3. TRANSLATION HELPERS
// ─────────────────────────────────────────────

/**
 * updateContent()
 * Scans the entire document for elements with [data-i18n] attribute and
 * sets their textContent (or specific attribute) to the translated string.
 *
 * Attribute syntax examples:
 *   data-i18n="home:hero.title"               → sets textContent (namespace:key)
 *   data-i18n="[placeholder]auth:login.email" → sets placeholder attribute
 *   data-i18n="[title]common:nav.home"        → sets title attribute
 *
 * CRITICAL: gebruik dubbele punt (:) als namespace separator, NIET punt (.)
 *   ✅ home:hero.title
 *   ❌ home.hero.title  → i18next leest dit als key in defaultNS (common)
 */
function updateContent() {
  // Select all elements that have a translation key
  const elements = document.querySelectorAll('[data-i18n]');

  elements.forEach(el => {
    const key = el.getAttribute('data-i18n'); // e.g. "home.hero.title" or "[placeholder]auth.email"

    // Check whether the key targets a specific HTML attribute (e.g. [placeholder])
    const attrMatch = key.match(/^\[(.+?)\](.+)$/); // matches "[attr]namespace.key"

    if (attrMatch) {
      // attrMatch[1] = attribute name  (e.g. "placeholder")
      // attrMatch[2] = i18n key        (e.g. "auth.login.email")
      const attr    = attrMatch[1];
      const i18nKey = attrMatch[2];
      el.setAttribute(attr, i18next.t(i18nKey)); // set the HTML attribute
    } else {
      // Normal case: set the visible text of the element
      el.textContent = i18next.t(key);
    }
  });

  // Also update the <html lang="…"> attribute for accessibility / SEO
  document.documentElement.lang = i18next.language;
}

/**
 * t(key, options)
 * Thin wrapper around i18next.t() so other modules can import a single symbol.
 *
 * @param {string} key     - Translation key, e.g. 'common.buttons.save'
 * @param {object} options - Optional i18next interpolation options
 * @returns {string}       - Translated string
 */
function t(key, options = {}) {
  return i18next.t(key, options);
}

// ─────────────────────────────────────────────
// 4. NAMESPACE LOADER
// ─────────────────────────────────────────────

/**
 * loadNamespace(ns)
 * Dynamically loads a translation namespace for the active language
 * (and the fallback language) then re-translates the DOM.
 *
 * Call this at the top of every page-specific script:
 *   loadNamespace('home');
 *   loadNamespace('auth');
 *
 * @param {string} ns - Namespace name, e.g. 'home', 'auth', 'manage'
 * @returns {Promise<void>}
 */
async function loadNamespace(ns) {
  // loadNamespaces() fetches the JSON for the current language (+ fallback)
  // if it was not already loaded; it is a no-op when already cached.
  await i18next.loadNamespaces(ns);

  // Re-run DOM translation so newly injected elements get their text
  updateContent();
}

// ─────────────────────────────────────────────
// 5. LANGUAGE SWITCHER
// ─────────────────────────────────────────────

/**
 * buildLanguageSwitcher()
 * Populates the <select id="languageSwitcher"> element (if present in the DOM)
 * with one <option> per supported language and attaches the change handler.
 */
function buildLanguageSwitcher() {
  const switcher = document.getElementById('languageSwitcher'); // the <select> element
  if (!switcher) return; // guard: element may not exist on every page

  // Remove any options added by a previous call (e.g. after TopBar re-inject)
  switcher.innerHTML = '';

  // Add one <option> for each supported language
  Object.entries(SUPPORTED_LANGUAGES).forEach(([code, label]) => {
    const option = document.createElement('option'); // create <option>
    option.value = code;                             // value = language code (nl / en / es)
    option.textContent = label;                      // visible label
    // Pre-select the currently active language
    if (code === i18next.language || i18next.language.startsWith(code)) {
      option.selected = true;
    }
    switcher.appendChild(option); // add to <select>
  });

  // Listen for user selection changes
  switcher.addEventListener('change', handleLanguageChange);
}

/**
 * handleLanguageChange(event)
 * Called when the user picks a different language in the switcher.
 * Switches i18next to the new language, saves the preference, updates the DOM.
 *
 * @param {Event} event - The DOM change event from the <select> element
 */
async function handleLanguageChange(event) {
  const newLang = event.target.value; // selected language code, e.g. 'en'

  // Tell i18next to switch language (this also triggers re-loading of namespaces)
  await i18next.changeLanguage(newLang);

  // Persist the user's explicit choice so the detector picks it up on reload
  localStorage.setItem('mftc_language', newLang);

  // Re-translate the entire visible DOM
  updateContent();
}

// ─────────────────────────────────────────────
// 6. DYNAMIC COMPONENT HOOK
// ─────────────────────────────────────────────

/**
 * onComponentLoaded(html, targetElement)
 * Call this after fetching and injecting any dynamic HTML component
 * (TopBar, Navbar, Footer).  It injects the HTML, then re-translates so
 * [data-i18n] attributes in the new markup are resolved immediately.
 *
 * Usage example:
 *   const html = await fetch('/Layout/topbar.html').then(r => r.text());
 *   onComponentLoaded(html, document.getElementById('topbar-container'));
 *
 * @param {string}      html          - Raw HTML string to inject
 * @param {HTMLElement} targetElement - Container element to inject into
 */
function onComponentLoaded(html, targetElement) {
  if (!targetElement) return; // guard: container must exist
  targetElement.innerHTML = html; // inject fetched HTML

  // Re-build the language switcher if this component contains one
  buildLanguageSwitcher();

  // Translate all [data-i18n] elements inside the newly injected HTML
  updateContent();
}

// ─────────────────────────────────────────────
// 7. EXPORTS (module pattern for vanilla JS)
// ─────────────────────────────────────────────

/**
 * Expose public API on window.i18nModule so every page can access it
 * without ES module bundling infrastructure.
 */
window.i18nModule = {
  init: initialiseI18n,    // call once in <script> at bottom of <body>
  t,                       // translate a single key
  updateContent,           // re-translate entire DOM
  loadNamespace,           // load a namespace then re-translate
  onComponentLoaded,       // inject a component and translate it
  buildLanguageSwitcher    // (re)build the <select> switcher
};
