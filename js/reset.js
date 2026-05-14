// =============================================================================
// reset.js — Wachtwoord Reset Logica
// MyFamTreeCollab v1.1.0
// -----------------------------------------------------------------------------
// Wijziging v1.1.0 (sessie 26):
// - Alle hardcoded strings via i18nModule.t('auth:reset.*')
// - Knoplabels (opslaan, bezig) via i18n
// - Fout- en succesmeldingen via i18n
// - Wachtwoord-mismatch melding via i18n
//
// v1.0.0: Verwerkt het wachtwoord-resetformulier op home/reset.html.
//
// Flow:
// 1. Supabase detecteert de token in de URL en logt de gebruiker in
// 2. onAuthChange vangt het 'PASSWORD_RECOVERY' event op
// 3. Formulier is zichtbaar — gebruiker vult nieuw wachtwoord in
// 4. AuthModule.updatePassword() slaat het nieuwe wachtwoord op
// 5. Redirect naar home na succesvolle reset
//
// Dependencies: Supabase SDK, auth.js, i18n.js
// Load order:   utils.js → auth.js → topbar.js → reset.js
// =============================================================================

(function () {
    "use strict";

    // ---------------------------------------------------------------------------
    // _t(key, fallback)
    // Veilige i18n wrapper — werkt ook als namespace nog niet volledig geladen is.
    // ---------------------------------------------------------------------------
    function _t(key, fallback) {
        try {
            if (window.i18nModule && typeof window.i18nModule.t === 'function') {
                var result = window.i18nModule.t(key);
                if (result && result !== key) return result; // Vertaling gevonden
            }
        } catch (e) { /* i18n niet klaar */ }
        return fallback || key;                              // Fallback op hardcoded NL
    }

    // ---------------------------------------------------------------------------
    // Wacht op DOMContentLoaded zodat alle elementen beschikbaar zijn
    // ---------------------------------------------------------------------------
    document.addEventListener("DOMContentLoaded", function () {

        // DOM-elementen ophalen
        var formulier = document.getElementById("reset-formulier"); // Formulier sectie
        var ongeldig  = document.getElementById("reset-ongeldig");  // Ongeldige link sectie
        var btn       = document.getElementById("btn-reset");       // Opslaan knop
        var msgEl     = document.getElementById("reset-msg");       // Feedback bericht
        var pwdInput  = document.getElementById("reset-pwd");       // Nieuw wachtwoord veld
        var pwd2Input = document.getElementById("reset-pwd2");      // Herhaal wachtwoord veld

        // -------------------------------------------------------------------------
        // _showMsg(text, type)
        // Toont feedback bericht. type = 'error' | 'success'
        // -------------------------------------------------------------------------
        function _showMsg(text, type) {
            msgEl.textContent = text;
            msgEl.className   = "reset-msg " + type;
        }

        // -------------------------------------------------------------------------
        // Auth-wijzigingen opvangen van Supabase
        // PASSWORD_RECOVERY event = resetlink is geldig
        // -------------------------------------------------------------------------
        AuthModule.onAuthChange(async function (event, session) {
            if (event === "PASSWORD_RECOVERY") {
                // Resetlink geldig — formulier was al zichtbaar als standaard
                if (pwdInput) pwdInput.focus();                       // Focus op eerste veld
            }
            if (event === "SIGNED_IN" && !session) {
                // Geen geldige sessie — toon ongeldige link melding
                formulier.style.display = "none";
                ongeldig.style.display  = "block";
            }
        });

        // -------------------------------------------------------------------------
        // Controleer bij laden of er een actieve sessie is via de URL-token
        // -------------------------------------------------------------------------
        (async function checkToken() {
            // Kort wachten zodat Supabase de URL-token kan verwerken
            await new Promise(function (resolve) { setTimeout(resolve, 500); });

            var session  = await AuthModule.getSession();
            var url      = window.location.href;
            var heeftToken = url.includes("access_token") ||
                             url.includes("token_hash")   ||
                             url.includes("code=");

            // Geen sessie én geen token → ongeldige link
            if (!session && !heeftToken) {
                formulier.style.display = "none";
                ongeldig.style.display  = "block";
            }
        })();

        // -------------------------------------------------------------------------
        // Knop click handler: valideer en sla nieuw wachtwoord op
        // -------------------------------------------------------------------------
        btn.addEventListener("click", async function () {
            var pwd  = pwdInput.value;
            var pwd2 = pwd2Input.value;

            // Wachtwoorden moeten overeenkomen — vertaald via i18n
            if (pwd !== pwd2) {
                _showMsg(_t('auth:reset.mismatch', 'Wachtwoorden komen niet overeen.'), "error");
                return;
            }

            // Knop uitschakelen tijdens opslaan — vertaald label
            btn.disabled    = true;
            btn.textContent = _t('auth:reset.busy', 'Bezig…');

            var result = await AuthModule.updatePassword(pwd);

            // Knop altijd terugzetten
            btn.disabled    = false;
            btn.textContent = _t('auth:reset.btn', 'Wachtwoord opslaan');

            if (result.error) {
                _showMsg(result.error, "error");                      // Fout uit auth.js (al vertaald)
                return;
            }

            // Succes — vertaald bericht + redirect
            _showMsg(_t('auth:reset.success', 'Wachtwoord opgeslagen! Je wordt doorgestuurd…'), "success");
            setTimeout(function () {
                window.location.href = "/MyFamTreeCollab/";
            }, 2000);
        });

    }); // einde DOMContentLoaded

})();
