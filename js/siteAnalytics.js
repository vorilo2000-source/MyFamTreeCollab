/**
 * =============================================================================
 * js/siteAnalytics.js — MyFamTreeCollab Pagina Tracker
 * =============================================================================
 * Version    : 2.3.0
 * Wijziging  : GoTrueClient fix — AuthModule.getClient() hergebruikt.
 *              RLS uitgeschakeld op page_visits — inserts werken nu voor alle rollen.
 * Doel       : Registreert paginabezoeken in Supabase (page_visits tabel).
 * Gebruik    : SiteAnalytics.trackPage("home"); — bovenaan elk pagina-script
 * Vereist    : Supabase SDK + auth.js geladen vóór dit script
 * Laadvolgorde: supabase → utils.js → auth.js → siteAnalytics.js → [pagina].js
 * Globaal    : window.SiteAnalytics
 * =============================================================================
 */

(function () {

    "use strict"; // strikte modus — vangt stille fouten op

    // =========================================================================
    // SUPABASE CLIENT
    // =========================================================================

    // RLS is uitgeschakeld op page_visits — inserts werken voor anon en authenticated.
    // AuthModule.getClient() hergebruiken — voorkomt GoTrueClient warning.
    // auth.js moet geladen zijn vóór dit script (zie laadvolgorde in HTML).
    const SUPA_URL  = "https://oihzuwlcgyyeuhghjahp.supabase.co";         // nodig voor updateDuration fetch
    const SUPA_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9paHp1d2xjZ3l5ZXVoZ2hqYWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjI2ODcsImV4cCI6MjA5MjMzODY4N30.bL_Bo_8TaJUveMmNyFM4yVYUl6jJmNfet71-E20BM08"; // JWT anon key

    /**
     * getDb()
     * Hergebruikt de Supabase client van auth.js — voorkomt GoTrueClient warning.
     * Valt terug op eigen client als AuthModule niet beschikbaar is.
     * @returns {object} Supabase client
     */
    function getDb() {
        if (typeof window.AuthModule !== "undefined") {
            return window.AuthModule.getClient();                  // gedeelde client hergebruiken
        }
        return supabase.createClient(SUPA_URL, SUPA_ANON);        // fallback voor edge cases
    }

    // =========================================================================
    // SESSIE ID
    // =========================================================================

    /**
     * getSessionId()
     * Haalt anonieme sessie ID op uit sessionStorage.
     * Aangemaakt bij eerste bezoek — verdwijnt bij sluiten tab.
     * Geen cookies — privacy-vriendelijk.
     * @returns {string} sessie ID
     */
    function getSessionId() {
        let sid = sessionStorage.getItem("ft_sid");                // bestaande sessie ID ophalen
        if (!sid) {                                                // nog geen sessie ID
            sid = "s_" + Date.now().toString(36) + "_" +          // timestamp in base-36
                  Math.random().toString(36).slice(2, 8);          // 6 willekeurige tekens
            sessionStorage.setItem("ft_sid", sid);                 // opslaan voor duur van de tab
        }
        return sid;                                                // sessie ID teruggeven
    }

    // =========================================================================
    // TIER + USER OPHALEN
    // =========================================================================

    /**
     * getCurrentTier()
     * Haalt tier op van ingelogde gebruiker via AuthModule.
     * Geeft null terug voor niet-ingelogde bezoekers — zodat
     * de database null opslaat en de filter "Niet ingelogd" correct werkt.
     * @returns {Promise<string|null>} null | "guest" | "owner" | "admin"
     */
    async function getCurrentTier() {
        if (typeof window.AuthModule === "undefined") return null; // auth.js niet geladen → niet ingelogd
        try {
            const session = await window.AuthModule.getSession();  // actieve sessie ophalen
            if (!session) return null;                             // geen sessie → niet ingelogd
            return (await window.AuthModule.getTier()) || null;    // tier ophalen, null als leeg
        } catch (_) {
            return null;                                           // fout → behandel als niet ingelogd
        }
    }

    /**
     * getCurrentUserId()
     * Haalt user UUID op van ingelogde gebruiker, of null voor niet-ingelogden.
     * @returns {Promise<string|null>}
     */
    async function getCurrentUserId() {
        if (typeof window.AuthModule === "undefined") return null; // auth.js niet geladen
        try {
            const user = await window.AuthModule.getUser();        // user object ophalen
            return user ? user.id : null;                          // null als niet ingelogd
        } catch (_) {
            return null;                                           // fout → geen user ID
        }
    }

    // =========================================================================
    // DUUR TRACKING
    // =========================================================================

    let _visitId   = null; // UUID van actieve page_visits rij — nodig voor duration update
    let _pageStart = null; // starttijd bezoek in ms

    /**
     * updateDuration()
     * Berekent verblijfsduur en update de rij in Supabase via fetch met keepalive.
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

    // =========================================================================
    // HOOFD TRACK FUNCTIE
    // =========================================================================

    /**
     * trackPage(pageName)
     * Registreert een paginabezoek in Supabase page_visits.
     * Aanroepen bovenaan elk pagina-script na de fetch-calls:
     *   SiteAnalytics.trackPage("home");
     *
     * Tier wordt als null opgeslagen voor niet-ingelogde bezoekers —
     * zodat de analytics filter "Niet ingelogd" correct filtert op null.
     *
     * @param {string} pageName - naam van de pagina (bv. "home", "stamboom", "artikelen")
     */
    async function trackPage(pageName) {
        if (!pageName || typeof pageName !== "string") return;     // valideer invoer

        _pageStart = Date.now();                                   // starttijd vastleggen

        const sessionId = getSessionId();                          // sessie ID ophalen of aanmaken
        const tier      = await getCurrentTier();                  // null voor niet-ingelogd
        const userId    = await getCurrentUserId();                // null voor niet-ingelogd
        const referrer  = document.referrer
            ? new URL(document.referrer).pathname                  // alleen pad van referrer
            : null;                                                // geen referrer

        const { data, error } = await getDb()                     // gedeelde client ophalen
            .from("page_visits")                                   // doeltabel
            .insert({
                session_id:   sessionId,                           // anonieme sessie ID (altijd aanwezig)
                user_id:      userId,                              // null voor niet-ingelogden
                tier:         tier,                                // null voor niet-ingelogden
                page:         pageName,                            // naam van de bezochte pagina
                referrer:     referrer,                            // pad van vorige pagina
                duration_sec: null,                                // ingevuld bij verlaten pagina
                visited_at:   new Date().toISOString()             // exacte tijdstip van bezoek
            })
            .select("id")                                          // nieuw rij-ID terugvragen
            .single();                                             // verwacht precies één rij

        if (error) {
            console.warn("[SiteAnalytics] Bezoek registreren mislukt:", error.message); // log fout
            return;                                                // stop — geen ID voor duur-update
        }

        _visitId = data.id;                                        // ID opslaan voor duur-update
    }

    // =========================================================================
    // PUBLIEKE API
    // =========================================================================

    window.SiteAnalytics = { trackPage: trackPage };              // enige publieke interface

})();
