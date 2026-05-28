// =============================================================================
// js/adminGuard.js — Admin & Developer toegangsbeveiliging
// MyFamTreeCollab v1.0.0
// -----------------------------------------------------------------------------
// Gebruik:
//   AdminGuard.protect('admin')     — vereist tier === 'admin'
//   AdminGuard.protect('developer') — vereist tier === 'admin' (uitbreidbaar)
//
// Werking:
//   1. Roept AuthModule.getTier() aan om de tier van de ingelogde gebruiker op te halen
//   2. Tier voldoet niet → toont #accessDenied blok, verbergt #page-content
//   3. Tier voldoet wel  → toont #page-content, verbergt #accessDenied
//   4. AuthModule.onAuthChange() listener → bij uitloggen redirect naar home
//
// Vereisten in de HTML:
//   - <div id="accessDenied">  — foutscherm, standaard display:none
//   - <div id="page-content">  — hoofdinhoud, standaard display:none
//   - AuthModule geladen via auth.js vóór dit script
//
// Laadvolgorde: supabase → utils.js → auth.js → adminGuard.js → topbar.js
// =============================================================================

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // HOME_URL — redirect bestemming bij uitloggen of onbevoegde toegang
    // -------------------------------------------------------------------------
    var HOME_URL = '/MyFamTreeCollab/index.html';                          // Standaard home pagina

    // -------------------------------------------------------------------------
    // _showDenied()
    // Toont het toegang-geweigerd scherm en verbergt de pagina-inhoud.
    // -------------------------------------------------------------------------
    function _showDenied() {
        var denied  = document.getElementById('accessDenied');             // Foutscherm element
        var content = document.getElementById('page-content');             // Pagina-inhoud element
        if (denied)  denied.style.display  = 'block';                     // Foutscherm zichtbaar
        if (content) content.style.display = 'none';                      // Inhoud verbergen
    }

    // -------------------------------------------------------------------------
    // _showContent()
    // Toont de pagina-inhoud en verbergt het toegang-geweigerd scherm.
    // -------------------------------------------------------------------------
    function _showContent() {
        var denied  = document.getElementById('accessDenied');             // Foutscherm element
        var content = document.getElementById('page-content');             // Pagina-inhoud element
        if (denied)  denied.style.display  = 'none';                      // Foutscherm verbergen
        if (content) content.style.display = 'block';                     // Inhoud zichtbaar
    }

    // -------------------------------------------------------------------------
    // _registerLogoutListener()
    // Luistert op auth-wijzigingen via AuthModule.onAuthChange().
    // Als de gebruiker uitlogt (event === 'SIGNED_OUT') → redirect naar home.
    // -------------------------------------------------------------------------
    function _registerLogoutListener() {
        AuthModule.onAuthChange(function (event) {                         // Luister op auth-events
            if (event === 'SIGNED_OUT') {                                  // Gebruiker heeft uitgelogd
                window.location.href = HOME_URL;                           // Redirect naar home
            }
        });
    }

    // -------------------------------------------------------------------------
    // protect(role)
    // Hoofdfunctie — checkt of de huidige gebruiker de vereiste rol heeft.
    // @param  {string} role - 'admin' of 'developer' (beide vereisen tier admin)
    // @returns {Promise<boolean>} — true als toegang verleend, false als geweigerd
    // -------------------------------------------------------------------------
    async function protect(role) {
        var tier = await AuthModule.getTier();                             // Haal tier op uit profiles tabel

        // Bepaal of toegang verleend wordt op basis van gevraagde rol
        var granted = (role === 'developer')
            ? (tier === 'admin')                                           // Developer: alleen admin toegestaan
            : (tier === 'admin');                                          // Admin: alleen admin toegestaan

        if (!granted) {
            _showDenied();                                                 // Toon foutscherm
            return false;                                                  // Toegang geweigerd
        }

        _showContent();                                                    // Toon pagina-inhoud
        _registerLogoutListener();                                         // Start uitlog-listener
        return true;                                                       // Toegang verleend
    }

    // -------------------------------------------------------------------------
    // Publieke API
    // -------------------------------------------------------------------------
    window.AdminGuard = {
        protect: protect                                                   // AdminGuard.protect('admin')
    };

})();
