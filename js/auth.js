// =============================================================================
// auth.js — Supabase Authentication Module
// MyFamTreeCollab v2.5.2
// -----------------------------------------------------------------------------
// Wijziging v2.5.2 (sessie 26):
// - _errMsg() foutmeldingen via i18nModule.t('auth:error.*')
//   Fallback op originele Supabase message als i18n nog niet geladen is
//
// Nieuw in v2.5.1:
// - SUPABASE_ANON key bijgewerkt naar nieuw sb_publishable_ formaat
//
// Nieuw in v2.5.0:
// - getTier() fallback aangepast van 'viewer' naar 'guest'
//
// Dependencies: Supabase JS SDK (loaded via CDN before this script)
// Load order:   utils.js → auth.js → topbar.js → [pagina].js
// =============================================================================

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // CONFIGURATION
  // ---------------------------------------------------------------------------
  var SUPABASE_URL  = "https://oihzuwlcgyyeuhghjahp.supabase.co";         // Supabase project URL
  var SUPABASE_ANON = "sb_publishable_9lSmr_sW7iryYDlDXPZZtw_tlbwTyDS";   // Publishable key

  // ---------------------------------------------------------------------------
  // Supabase client — eenmalig aangemaakt, overal hergebruikt
  // ---------------------------------------------------------------------------
  var _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);       // Client aanmaken

  // ---------------------------------------------------------------------------
  // _t(key, fallback)
  // Veilige wrapper voor i18nModule.t() — werkt ook als i18n nog niet geladen is.
  // ---------------------------------------------------------------------------
  function _t(key, fallback) {
    try {
      if (window.i18nModule && typeof window.i18nModule.t === 'function') {
        var result = window.i18nModule.t(key);                            // Vertaling ophalen
        if (result && result !== key) return result;                       // Geef vertaling terug als gevonden
      }
    } catch (e) { /* i18n nog niet klaar — gebruik fallback */ }
    return fallback;                                                       // Fallback als i18n niet beschikbaar
  }

  // ---------------------------------------------------------------------------
  // _errMsg(error)
  // Vertaalt Supabase foutmeldingen naar gelokaliseerde tekst via i18n.
  // Fallback op hardcoded NL als i18n nog niet geladen is.
  // ---------------------------------------------------------------------------
  function _errMsg(error) {
    if (!error) return null;                                               // Geen fout
    var msg = error.message || "Onbekende fout";                          // Foutbericht ophalen

    if (msg.includes("Invalid login credentials")) {
      return _t('auth:error.invalidCredentials', "E-mailadres of wachtwoord onjuist.");
    }
    if (msg.includes("Email not confirmed")) {
      return _t('auth:error.emailNotConfirmed', "Bevestig eerst je e-mailadres via de ontvangen mail.");
    }
    if (msg.includes("User already registered")) {
      return _t('auth:error.alreadyRegistered', "Dit e-mailadres is al in gebruik.");
    }
    if (msg.includes("Password should be")) {
      return _t('auth:error.passwordTooShort', "Wachtwoord moet minimaal 6 tekens bevatten.");
    }
    if (msg.includes("Email rate limit exceeded")) {
      return _t('auth:error.rateLimited', "Te veel pogingen. Probeer het later opnieuw.");
    }
    return msg;                                                            // Onbekende fout: origineel bericht
  }

  // ---------------------------------------------------------------------------
  // register(email, password, username)
  // ---------------------------------------------------------------------------
  async function register(email, password, username) {
    if (!email || !password || !username) {
      return { user: null, error: _t('auth:error.fillAll', "Vul alle velden in.") }; // Validatie
    }
    if (username.trim().length < 2) {
      return { user: null, error: _t('auth:error.usernameTooShort', "Gebruikersnaam moet minimaal 2 tekens bevatten.") };
    }

    var result = await _client.auth.signUp({
      email: email,
      password: password,
      options: { data: { username: username.trim() } }                    // Username meesturen
    });

    if (result.error) return { user: null, error: _errMsg(result.error) };
    return { user: result.data.user, error: null };
  }

  // ---------------------------------------------------------------------------
  // login(email, password)
  // ---------------------------------------------------------------------------
  async function login(email, password) {
    if (!email || !password) {
      return { user: null, error: _t('auth:error.fillEmailPassword', "Vul e-mailadres en wachtwoord in.") };
    }

    var result = await _client.auth.signInWithPassword({ email: email, password: password });

    if (result.error) return { user: null, error: _errMsg(result.error) };
    return { user: result.data.user, error: null };
  }

  // ---------------------------------------------------------------------------
  // logout()
  // ---------------------------------------------------------------------------
  async function logout() {
    var result = await _client.auth.signOut();
    return { error: _errMsg(result.error) };
  }

  // ---------------------------------------------------------------------------
  // resetPassword(email)
  // ---------------------------------------------------------------------------
  async function resetPassword(email) {
    if (!email) {
      return { error: _t('auth:error.fillEmail', "Vul je e-mailadres in.") }; // Validatie
    }

    var result = await _client.auth.resetPasswordForEmail(email, {
      redirectTo: "https://vorilo2000-source.github.io/MyFamTreeCollab/home/reset.html"
    });

    if (result.error) return { error: _errMsg(result.error) };
    return { error: null };
  }

  // ---------------------------------------------------------------------------
  // updatePassword(newPassword)
  // ---------------------------------------------------------------------------
  async function updatePassword(newPassword) {
    if (!newPassword || newPassword.length < 6) {
      return { error: _t('auth:error.passwordTooShort', "Wachtwoord moet minimaal 6 tekens bevatten.") };
    }

    var result = await _client.auth.updateUser({ password: newPassword });

    if (result.error) return { error: _errMsg(result.error) };
    return { error: null };
  }

  // ---------------------------------------------------------------------------
  // getSession()
  // ---------------------------------------------------------------------------
  async function getSession() {
    var result = await _client.auth.getSession();
    return (result.data && result.data.session) ? result.data.session : null;
  }

  // ---------------------------------------------------------------------------
  // getUser()
  // ---------------------------------------------------------------------------
  async function getUser() {
    var session = await getSession();
    return session ? session.user : null;
  }

  // ---------------------------------------------------------------------------
  // getProfile()
  // ---------------------------------------------------------------------------
  async function getProfile() {
    var user = await getUser();
    if (!user) {
      return { profile: null, error: _t('auth:error.notLoggedIn', "Niet ingelogd.") };
    }

    var result = await _client
      .from("profiles")
      .select("username, avatar_id, tier, is_admin, is_premium, tier_until")
      .eq("id", user.id)
      .single();

    if (result.error) return { profile: null, error: _errMsg(result.error) };
    return { profile: result.data, error: null };
  }

  // ---------------------------------------------------------------------------
  // getTier()
  // Account types: 'guest' | 'owner' | 'admin'
  // viewer en editor zijn stamboom-rechten, geen account types → 'guest'
  // ---------------------------------------------------------------------------
  async function getTier() {
    var profileResult = await getProfile();
    if (profileResult.error || !profileResult.profile) return "guest";    // Niet ingelogd of fout
    var tier = profileResult.profile.tier || "guest";
    if (tier === "viewer" || tier === "editor") return "guest";           // Stamboom-rechten → guest
    return tier;
  }

  // ---------------------------------------------------------------------------
  // updateUsername(username)
  // ---------------------------------------------------------------------------
  async function updateUsername(username) {
    var user = await getUser();
    if (!user) {
      return { error: _t('auth:error.notLoggedIn', "Niet ingelogd.") };
    }
    if (!username || username.trim().length < 2) {
      return { error: _t('auth:error.usernameTooShort', "Gebruikersnaam moet minimaal 2 tekens bevatten.") };
    }

    var result = await _client
      .from("profiles")
      .update({ username: username.trim() })
      .eq("id", user.id);

    return { error: _errMsg(result.error) };
  }

  // ---------------------------------------------------------------------------
  // onAuthChange(callback)
  // ---------------------------------------------------------------------------
  function onAuthChange(callback) {
    _client.auth.onAuthStateChange(function (event, session) {
      callback(event, session);
    });
  }

  // ---------------------------------------------------------------------------
  // getClient()
  // ---------------------------------------------------------------------------
  function getClient() {
    return _client;
  }

  // ---------------------------------------------------------------------------
  // Publieke API
  // ---------------------------------------------------------------------------
  window.AuthModule = {
    register,        // (email, password, username) → { user, error }
    login,           // (email, password)            → { user, error }
    logout,          // ()                           → { error }
    resetPassword,   // (email)                      → { error }
    updatePassword,  // (newPassword)                → { error }
    getSession,      // ()                           → session | null
    getUser,         // ()                           → user | null
    getProfile,      // ()                           → { profile, error }
    getTier,         // ()                           → 'guest' | 'owner' | 'admin'
    updateUsername,  // (username)                   → { error }
    onAuthChange,    // (callback)                   → void
    getClient        // ()                           → supabase client
  };

})();
