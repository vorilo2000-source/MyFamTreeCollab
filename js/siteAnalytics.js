/**
 * =============================================================================
 * siteAnalytics.js — MyFamTreeCollab Server-Side Analytics Tracker
 * =============================================================================
 * Version    : 1.0.0
 * Description: Registreert paginabezoeken in Supabase (page_visits tabel).
 *              Werkt voor gasten (anoniem) én ingelogde gebruikers.
 *              Trackt: sessie, tier, pagina, duur, referrer.
 * Vereist    : Supabase SDK + auth.js geladen vóór dit script
 * Gebruik    : SiteAnalytics.trackPage("home");  ← bovenaan elke pagina
 * Globaal    : window.SiteAnalytics
 * Laadvolgorde: utils.js → auth.js → siteAnalytics.js → [pagina].js
 * =============================================================================
 */

(function () {

    "use strict"; // strikte modus voor veiligere code

    // ======================= SUPABASE CONFIG =======================

    const SUPABASE_URL  = "https://oihzuwlcgyyeuhghjahp.supabase.co"; // Supabase project URL
    const SUPABASE_ANON = "sb_publishable_9lSmr_sW7iryYDlDXPZZtw_tlbwTyDS"; // publieke anon key

    // ======================= SESSIE ID =======================

    /**
     * getSessionId()
     * Haalt een anonieme sessie ID op uit sessionStorage.
     * Wordt aangemaakt bij eerste bezoek — bewaard voor de duur van de browsertab.
     * Geen cookies — enkel sessionStorage (verdwijnt bij sluiten tab).
     * @returns {string} sessie ID
     */
    function getSessionId() {
        let sid = sessionStorage.getItem("ft_sid");          // probeer bestaande sessie ID op te halen
        if (!sid) {                                          // nog geen sessie ID aangemaakt
            sid = "s_" + Date.now().toString(36) + "_" +    // timestamp in base-36 (compact)
                  Math.random().toString(36).slice(2, 8);    // 6 willekeurige tekens
            sessionStorage.setItem("ft_sid", sid);           // opslaan voor rest van de tab-sessie
        }
        return sid;                                          // geef sessie ID terug
    }

    // ======================= TIER + USER OPHALEN =======================

    /**
     * getCurrentTier()
     * Haalt de tier op van de ingelogde gebruiker via AuthModule.
     * Geeft 'guest' terug als niet ingelogd of bij fout.
     * @returns {Promise<string>} 'guest' | 'viewer' | 'editor' | 'owner' | 'admin'
     */
    async function getCurrentTier() {
        if (typeof window.AuthModule === "undefined") return "guest"; // auth.js niet geladen
        try {
            const tier = await window.AuthModule.getTier();  // tier ophalen via auth.js
            return tier || "guest";                          // fallback naar guest als leeg
        } catch (e) {
            return "guest";                                  // fout → behandel als gast
        }
    }

    /**
     * getCurrentUserId()
     * Haalt de user ID op van de ingelogde gebruiker.
     * Geeft null terug als niet ingelogd (gast).
     * @returns {Promise<string|null>} user UUID of null
     */
    async function getCurrentUserId() {
        if (typeof window.AuthModule === "undefined") return null; // auth.js niet geladen
        try {
            const user = await window.AuthModule.getUser();  // user object ophalen
            return user ? user.id : null;                    // null als geen user (gast)
        } catch (e) {
            return null;                                     // fout → geen user ID
        }
    }

    // ======================= DUUR TRACKING =======================

    let _visitId   = null; // UUID van de huidige page_visits rij — nodig voor duration update
    let _pageStart = null; // tijdstip waarop de pagina geladen werd (ms)

    /**
     * updateDuration()
     * Berekent de verblijfsduur en update de bestaande rij in Supabase.
     * Aangeroepen bij verlaten van de pagina (beforeunload / visibilitychange).
     * Gebruikt fetch() direct — sendBeacon ondersteunt geen auth headers.
     */
    function updateDuration() {
        if (!_visitId || !_pageStart) return;                // geen actief bezoek — niets te updaten

        const duurSec = Math.round((Date.now() - _pageStart) / 1000); // verblijfsduur in seconden

        // Update via Supabase REST API — direct fetch voor betrouwbaarheid bij page unload
        fetch(SUPABASE_URL + "/rest/v1/page_visits?id=eq." + _visitId, {
            method:  "PATCH",                                // update bestaande rij
            headers: {
                "Content-Type":  "application/json",         // JSON body
                "apikey":        SUPABASE_ANON,              // Supabase anon key
                "Authorization": "Bearer " + SUPABASE_ANON  // auth header
            },
            body: JSON.stringify({ duration_sec: duurSec }), // duur invullen
            keepalive: true                                  // keepalive: blijft actief na page unload
        }).catch(function() {});                             // stille fout — bezoeker is al weg
    }

    // ======================= HOOFD TRACK FUNCTIE =======================

    /**
     * trackPage(pageName)
     * Registreert een paginabezoek in Supabase page_visits tabel.
     * Roep aan bovenaan elk pagina-script: SiteAnalytics.trackPage("home");
     * @param {string} pageName - naam van de pagina (bv. "home", "create", "detail")
     */
    async function trackPage(pageName) {
        if (!pageName || typeof pageName !== "string") return; // valideer invoer — moet string zijn

        _pageStart = Date.now();                             // starttijd van bezoek vastleggen

        const sessionId = getSessionId();                    // anonieme sessie ID ophalen of aanmaken
        const tier      = await getCurrentTier();            // tier ophalen (async — wacht op auth)
        const userId    = await getCurrentUserId();          // user ID ophalen (null voor gasten)
        const referrer  = document.referrer                  // vorige pagina URL (browser geeft dit)
            ? new URL(document.referrer).pathname            // alleen het pad — geen volledig domein
            : null;                                          // geen referrer beschikbaar

        // Supabase client aanmaken voor deze request
        const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

        // Nieuw bezoek inserten in page_visits tabel
        const { data, error } = await client
            .from("page_visits")                             // doeltabel
            .insert({
                session_id:   sessionId,                     // anonieme sessie ID (altijd aanwezig)
                user_id:      userId,                        // null voor gasten, UUID voor ingelogden
                tier:         tier,                          // tier op moment van bezoek
                page:         pageName,                      // naam van de bezochte pagina
                referrer:     referrer,                      // pad van vorige pagina
                duration_sec: null,                          // nog onbekend — ingevuld bij paginaverlaten
                visited_at:   new Date().toISOString()       // exacte tijdstip van bezoek
            })
            .select("id")                                    // vraag het nieuwe rij-ID terug
            .single();                                       // verwacht precies één rij terug

        if (error) {
            console.warn("[SiteAnalytics] Bezoek registreren mislukt:", error.message); // log fout
            return;                                          // stop — geen ID beschikbaar voor duur-update
        }

        _visitId = data.id;                                  // sla bezoek-ID op voor latere duur-update
    }

    // ======================= LIFECYCLE LISTENERS =======================

    // Duur updaten bij verlaten pagina (tab sluiten, navigeren naar andere pagina)
    window.addEventListener("beforeunload", function() {
        updateDuration();                                    // bereken en sla duur op
    });

    // Duur updaten bij tab naar achtergrond (mobiel / Progressive Web App)
    document.addEventListener("visibilitychange", function() {
        if (document.visibilityState === "hidden") {
            updateDuration();                                // tab naar achtergrond — duur tussentijds opslaan
        }
    });

    // ======================= PUBLIEKE API =======================

    /**
     * window.SiteAnalytics
     * Enige publieke interface van deze module.
     */
    window.SiteAnalytics = {
        trackPage: trackPage   // SiteAnalytics.trackPage("home") — aanroepen op elke pagina
    };

})();
