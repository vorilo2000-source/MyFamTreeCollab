/**
 * =============================================================================
 * analytics.js — MyFamTreeCollab Internal Analytics Module
 * =============================================================================
 * Version    : 1.0.0
 * Author     : MyFamTreeCollab Dev
 * Description: Privacy-first, local-only analytics module.
 *              Tracks sessions, page views and user events.
 *              No external calls, no cookies, no IP tracking.
 *              Designed for future Supabase cloud sync.
 * Storage    : localStorage key "ft_analytics"
 * Global     : window.Analytics
 * Load order : utils.js → schema.js → storage.js → analytics.js → [page].js
 * =============================================================================
 */

// ======================= IIFE WRAPPER =======================
// Wrap everything in an Immediately Invoked Function Expression
// to avoid polluting the global scope beyond window.Analytics
(function () {

  "use strict"; // Enable strict mode for safer JS execution

  // ======================= CONSTANTS =======================

  const STORAGE_KEY = "ft_analytics";       // localStorage key for all analytics data
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity = new session
  const MAX_EVENTS = 2000;                  // Max events stored before pruning oldest
  const MAX_SESSIONS = 200;                 // Max sessions stored before pruning oldest
  const MODULE_VERSION = "1.0.0";           // Module version for future migration checks

  // ======================= ID GENERATORS =======================

  /**
   * generateId(prefix)
   * Generates a short pseudo-unique ID string.
   * Format: "{prefix}_{timestamp}_{random}"
   * @param {string} prefix - e.g. "sess" or "evt"
   * @returns {string} unique ID
   */
  function generateId(prefix) {
    const timestamp = Date.now().toString(36);         // Base-36 timestamp (compact)
    const random = Math.random().toString(36).slice(2, 7); // 5 random base-36 chars
    return prefix + "_" + timestamp + "_" + random;   // Combine into readable ID
  }

  // ======================= DEVICE DETECTION =======================

  /**
   * detectDevice()
   * Detects device type based on screen width and user agent.
   * Returns one of: "mobile", "tablet", "desktop"
   * No external API — fully local check.
   * @returns {string} device type
   */
  function detectDevice() {
    const ua = navigator.userAgent.toLowerCase();      // Get user agent string
    const width = window.innerWidth;                   // Get current viewport width

    // Check for mobile keywords in user agent
    if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(ua)) {
      return "mobile"; // Definitely a phone
    }

    // Check for tablet keywords or intermediate screen width
    if (/ipad|tablet/.test(ua) || (width >= 600 && width < 1024)) {
      return "tablet"; // Tablet-sized device
    }

    return "desktop"; // Default: desktop/laptop
  }

  // ======================= STORAGE HELPERS =======================

  /**
   * loadStore()
   * Reads and parses the analytics data from localStorage.
   * Returns a default empty store if nothing is saved yet.
   * @returns {Object} analytics store { version, sessions, events }
   */
  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY); // Read raw JSON string
      if (!raw) return createEmptyStore();            // Nothing saved yet
      return JSON.parse(raw);                         // Parse and return
    } catch (e) {
      // JSON parse failed (corrupted data) — reset to empty store
      console.warn("[Analytics] Failed to parse store, resetting.", e);
      return createEmptyStore();                      // Safe fallback
    }
  }

  /**
   * saveStore(store)
   * Serializes and writes the analytics store to localStorage.
   * Silently fails if storage is full or unavailable.
   * @param {Object} store - the full analytics store to save
   */
  function saveStore(store) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); // Serialize and write
    } catch (e) {
      // Storage quota exceeded or unavailable — log and continue
      console.warn("[Analytics] Could not save store:", e);
    }
  }

  /**
   * createEmptyStore()
   * Returns a fresh, empty analytics data structure.
   * @returns {Object} empty store
   */
  function createEmptyStore() {
    return {
      version: MODULE_VERSION, // Track module version for future migrations
      sessions: [],            // Array of session objects
      events: []               // Array of event objects
    };
  }

  // ======================= PRUNING =======================

  /**
   * pruneStore(store)
   * Removes oldest sessions and events if limits are exceeded.
   * Keeps data manageable in localStorage.
   * @param {Object} store - the analytics store to prune in-place
   */
  function pruneStore(store) {
    // If sessions exceed max, remove the oldest ones (from the front)
    if (store.sessions.length > MAX_SESSIONS) {
      store.sessions = store.sessions.slice(-MAX_SESSIONS); // Keep newest
    }

    // If events exceed max, remove the oldest ones (from the front)
    if (store.events.length > MAX_EVENTS) {
      store.events = store.events.slice(-MAX_EVENTS); // Keep newest
    }
  }

  // ======================= SESSION MANAGEMENT =======================

  let _currentSession = null; // In-memory reference to the active session object

  /**
   * startSession()
   * Creates and stores a new session.
   * Called once on page load.
   */
  function startSession() {
    const store = loadStore();                   // Load existing data

    _currentSession = {
      id: generateId("sess"),                   // Unique session ID
      start: Date.now(),                        // Session start timestamp (ms)
      end: null,                                // Will be set on page unload
      pages: [],                                // List of page names visited
      device: detectDevice()                    // Device type at session start
    };

    store.sessions.push(_currentSession);       // Add to store
    pruneStore(store);                          // Remove excess old data
    saveStore(store);                           // Persist immediately
  }

  /**
   * endSession()
   * Marks the current session as ended.
   * Triggered by beforeunload / visibilitychange events.
   */
  function endSession() {
    if (!_currentSession) return;               // No active session — nothing to do

    const store = loadStore();                  // Load current store

    // Find the session in the store by ID and update its end time
    const sessionInStore = store.sessions.find(s => s.id === _currentSession.id);
    if (sessionInStore) {
      sessionInStore.end = Date.now();          // Mark end timestamp
      sessionInStore.pages = _currentSession.pages; // Sync visited pages list
    }

    saveStore(store);                           // Persist updated session
    _currentSession = null;                     // Clear in-memory reference
  }

  // ======================= PAGE TRACKING =======================

  /**
   * trackPage(pageName)
   * Records a page view within the current session.
   * Call manually at the top of each page's JS file.
   * Example: Analytics.trackPage("create");
   * @param {string} pageName - human-readable page identifier
   */
  function trackPage(pageName) {
    if (!pageName || typeof pageName !== "string") return; // Validate input

    if (_currentSession) {
      _currentSession.pages.push({              // Add page visit to session
        name: pageName,                         // Page identifier
        timestamp: Date.now()                   // When the page was visited
      });
    }

    // Also track as an event for granular reporting
    trackEvent("page_view", { page: pageName }); // Unified event stream
  }

  // ======================= EVENT TRACKING =======================

  /**
   * trackEvent(type, meta)
   * Records a named event with optional metadata.
   * The primary data collection method — call throughout the app.
   * Example: Analytics.trackEvent("add_person", { success: true });
   * @param {string} type - event name (snake_case recommended)
   * @param {Object} [meta={}] - optional key/value metadata
   */
  function trackEvent(type, meta) {
    if (!type || typeof type !== "string") return; // Validate event type

    const store = loadStore();                  // Load current store

    const event = {
      id: generateId("evt"),                   // Unique event ID
      sessionId: _currentSession               // Link to current session
        ? _currentSession.id
        : null,                                // null if called outside session
      type: type,                              // Event name/type
      timestamp: Date.now(),                   // When the event occurred (ms)
      meta: meta || {}                         // Metadata payload (default empty)
    };

    store.events.push(event);                  // Add to events array
    pruneStore(store);                         // Enforce size limits
    saveStore(store);                          // Persist to localStorage
  }

  // ======================= STATS HELPER =======================

  /**
   * getStats()
   * Returns a summary of all tracked analytics data.
   * Useful for a future analytics dashboard page.
   * @returns {Object} stats summary
   */
  function getStats() {
    const store = loadStore();                 // Load all stored data

    const totalSessions = store.sessions.length; // Count all sessions

    // Calculate average session duration (only for completed sessions)
    const completedSessions = store.sessions.filter(s => s.end !== null); // Has end time
    const avgDurationMs = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.end - s.start), 0) // Sum durations
        / completedSessions.length                                         // Divide by count
      : 0;                                     // No completed sessions yet

    // Count events per type using a frequency map
    const eventCounts = {};                    // { event_type: count }
    store.events.forEach(function (evt) {
      if (!eventCounts[evt.type]) {
        eventCounts[evt.type] = 0;            // Initialize counter
      }
      eventCounts[evt.type]++;               // Increment
    });

    // Count unique pages visited across all sessions
    const allPages = {};                       // { page_name: visit_count }
    store.sessions.forEach(function (sess) {
      (sess.pages || []).forEach(function (p) { // Safely iterate pages
        if (!allPages[p.name]) {
          allPages[p.name] = 0;              // Initialize
        }
        allPages[p.name]++;                  // Increment
      });
    });

    return {
      totalSessions: totalSessions,           // Total number of sessions
      totalEvents: store.events.length,       // Total number of tracked events
      completedSessions: completedSessions.length, // Sessions with an end time
      avgSessionDurationSeconds: Math.round(avgDurationMs / 1000), // In seconds
      eventCounts: eventCounts,               // Per-type event frequency map
      pagesVisited: allPages,                 // Per-page visit count
      deviceBreakdown: getDeviceBreakdown(store.sessions) // Device type distribution
    };
  }

  /**
   * getDeviceBreakdown(sessions)
   * Counts how many sessions came from each device type.
   * @param {Array} sessions - array of session objects
   * @returns {Object} { desktop: N, mobile: N, tablet: N }
   */
  function getDeviceBreakdown(sessions) {
    const breakdown = { desktop: 0, mobile: 0, tablet: 0 }; // Initialize counts

    sessions.forEach(function (sess) {
      const device = sess.device || "desktop"; // Default to desktop if missing
      if (breakdown.hasOwnProperty(device)) {
        breakdown[device]++;                   // Increment matching device type
      }
    });

    return breakdown;                          // Return frequency map
  }

  // ======================= EXPORT HELPER =======================

  /**
   * exportData()
   * Returns a full copy of the analytics store as a plain object.
   * For future use: export to JSON file or sync to Supabase.
   * @returns {Object} full analytics store
   */
  function exportData() {
    return loadStore();                        // Return parsed store copy
  }

  /**
   * clearData()
   * Wipes all analytics data from localStorage.
   * Use with care — irreversible.
   */
  function clearData() {
    localStorage.removeItem(STORAGE_KEY);     // Delete the analytics key
    _currentSession = null;                   // Clear in-memory session
    console.info("[Analytics] All analytics data cleared."); // Confirm in console
  }

  // ======================= LIFECYCLE EVENT LISTENERS =======================

  // Listen for page unload to close the current session cleanly
  window.addEventListener("beforeunload", function () {
    endSession();                              // Mark session end on tab close / navigation
  });

  // Also handle tab switching to background (mobile / PWA scenarios)
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      endSession();                            // Tab went to background — end session
    } else if (document.visibilityState === "visible" && !_currentSession) {
      startSession();                          // Tab came back to foreground — new session
    }
  });

  // ======================= MODULE INIT =======================

  // Start a session immediately when the script loads
  startSession();

  // ======================= PUBLIC API =======================

  /**
   * window.Analytics
   * Public interface — the only global this module exposes.
   * All other functions are private (inside IIFE scope).
   */
  window.Analytics = {
    trackEvent: trackEvent,   // Track a named event with optional metadata
    trackPage: trackPage,     // Track a page view (call manually per page)
    getStats: getStats,       // Get aggregated analytics summary
    exportData: exportData,   // Get raw store copy (for export / sync)
    clearData: clearData      // Wipe all analytics data from localStorage

    // ─── Future Supabase sync hooks (not yet implemented) ─────────────────
    // syncToCloud: syncToCloud,  // Push local data to Supabase
    // pullFromCloud: pullFromCloud // Merge cloud data into local store
  };

})(); // End IIFE — module is self-contained
