// =============================================================================
// auth.js — Supabase Authentication Module
// MyFamTreeCollab v2.5.1
// -----------------------------------------------------------------------------
// Handles registration, login, logout, session management, profiles
// and password reset flow.
//
// Nieuw in v2.5.1:
// - SUPABASE_ANON key bijgewerkt naar nieuw sb_publishable_ formaat
//   (oude JWT key was ongeldig: iat lag in de toekomst)
//
// Nieuw in v2.5.0:
// - getTier() fallback aangepast van 'viewer' naar 'guest'
//   viewer en editor zijn stamboom-rechten, geen account types
//   account types zijn: guest | owner | admin
//
// Nieuw in v2.4.2:
// - Supabase anon key gewijzigd naar JWT formaat
//
// Nieuw in v2.4.1 (F6-03):
// - getTier() fallback aangepast van 'free' naar 'viewer' (nieuw rolmodel)
// - JSDoc comment bijgewerkt: oude tiers verwijderd
//
// Nieuw in v2.3.0:
// - getProfile() haalt nu ook tier, is_admin, is_premium op
// - getTier()    — handige shortcut die alleen de tier teruggeeft
//
// Nieuw in v2.2.0:
// - resetPassword(email)   — stuurt resetmail via Supabase
// - updatePassword(pwd)    — slaat nieuw wachtwoord op na reset
//
// Dependencies: Supabase JS SDK (loaded via CDN before this script)
// Load order:   utils.js → auth.js → topbar.js → [pagina].js
// =============================================================================

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // CONFIGURATION
  // ---------------------------------------------------------------------------
  const SUPABASE_URL  = "https://oihzuwlcgyyeuhghjahp.supabase.co";          // Supabase project URL
  const SUPABASE_ANON = "sb_publishable_9lSmr_sW7iryYDlDXPZZtw_tlbwTyDS";    // Publishable key (nieuw formaat)

  // ---------------------------------------------------------------------------
  // Supabase client — eenmalig aangemaakt, overal hergebruikt
  // ---------------------------------------------------------------------------
  const _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);         // client aanmaken

  // ---------------------------------------------------------------------------
  // _errMsg(error)
  // Vertaalt Supabase foutmeldingen naar leesbaar Nederlands
  // ---------------------------------------------------------------------------
  function _errMsg(error) {
    if (!error) return null;                                                   // geen fout
    const msg = error.message || "Onbekende fout";                             // foutbericht ophalen
    if (msg.includes("Invalid login credentials"))  return "E-mailadres of wachtwoord onjuist.";
    if (msg.includes("Email not confirmed"))        return "Bevestig eerst je e-mailadres via de ontvangen mail.";
    if (msg.includes("User already registered"))    return "Dit e-mailadres is al in gebruik.";
    if (msg.includes("Password should be"))         return "Wachtwoord moet minimaal 6 tekens bevatten.";
    if (msg.includes("Email rate limit exceeded"))  return "Te veel pogingen. Probeer het later opnieuw.";
    return msg;                                                                // onbekende fout teruggeven
  }

  // ---------------------------------------------------------------------------
  // register(email, password, username)
  // ---------------------------------------------------------------------------
  async function register(email, password, username) {
    if (!email || !password || !username) {
      return { user: null, error: "Vul alle velden in." };                     // validatie
    }
    if (username.trim().length < 2) {
      return { user: null, error: "Gebruikersnaam moet minimaal 2 tekens bevatten." }; // validatie gebruikersnaam
    }

    const { data, error } = await _client.auth.signUp({
      email,
      password,
      options: { data: { username: username.trim() } }                         // username meesturen
    });

    if (error) return { user: null, error: _errMsg(error) };                   // fout teruggeven
    return { user: data.user, error: null };                                   // success
  }

  // ---------------------------------------------------------------------------
  // login(email, password)
  // ---------------------------------------------------------------------------
  async function login(email, password) {
    if (!email || !password) return { user: null, error: "Vul e-mailadres en wachtwoord in." }; // validatie

    const { data, error } = await _client.auth.signInWithPassword({ email, password }); // inloggen

    if (error) return { user: null, error: _errMsg(error) };                   // fout teruggeven
    return { user: data.user, error: null };                                   // success
  }

  // ---------------------------------------------------------------------------
  // logout()
  // ---------------------------------------------------------------------------
  async function logout() {
    const { error } = await _client.auth.signOut();                            // uitloggen
    return { error: _errMsg(error) };                                          // fout teruggeven
  }

  // ---------------------------------------------------------------------------
  // resetPassword(email)
  // ---------------------------------------------------------------------------
  async function resetPassword(email) {
    if (!email) return { error: "Vul je e-mailadres in." };                    // validatie

    const { error } = await _client.auth.resetPasswordForEmail(email, {
      redirectTo: "https://vorilo2000-source.github.io/MyFamTreeCollab/home/reset.html" // redirect na reset
    });

    if (error) return { error: _errMsg(error) };                               // fout teruggeven
    return { error: null };                                                    // success
  }

  // ---------------------------------------------------------------------------
  // updatePassword(newPassword)
  // ---------------------------------------------------------------------------
  async function updatePassword(newPassword) {
    if (!newPassword || newPassword.length < 6) {
      return { error: "Wachtwoord moet minimaal 6 tekens bevatten." };         // validatie
    }

    const { error } = await _client.auth.updateUser({ password: newPassword }); // wachtwoord bijwerken

    if (error) return { error: _errMsg(error) };                               // fout teruggeven
    return { error: null };                                                    // success
  }

  // ---------------------------------------------------------------------------
  // getSession()
  // ---------------------------------------------------------------------------
  async function getSession() {
    const { data } = await _client.auth.getSession();                          // sessie ophalen
    return data.session || null;                                               // sessie of null
  }

  // ---------------------------------------------------------------------------
  // getUser()
  // ---------------------------------------------------------------------------
  async function getUser() {
    const session = await getSession();                                        // sessie ophalen
    return session ? session.user : null;                                      // user of null
  }

  // ---------------------------------------------------------------------------
  // getProfile()
  // Haalt het volledige profiel op inclusief tier, is_admin en is_premium.
  // Returns { profile, error }
  // profile bevat: username, avatar_id, tier, is_admin, is_premium, tier_until
  // ---------------------------------------------------------------------------
  async function getProfile() {
    const user = await getUser();                                              // user ophalen
    if (!user) return { profile: null, error: "Niet ingelogd." };              // niet ingelogd

    const { data, error } = await _client
      .from("profiles")
      .select("username, avatar_id, tier, is_admin, is_premium, tier_until")  // profiel kolommen
      .eq("id", user.id)                                                       // filter op user ID
      .single();                                                               // verwacht één rij

    if (error) return { profile: null, error: _errMsg(error) };                // fout teruggeven
    return { profile: data, error: null };                                     // profiel teruggeven
  }

  // ---------------------------------------------------------------------------
  // getTier()
  // Handige shortcut — geeft alleen de tier string terug van de ingelogde gebruiker.
  // Account types: 'guest' | 'owner' | 'admin'
  // viewer en editor zijn stamboom-rechten, geen account types — vallen terug op 'guest'
  // Geeft 'guest' terug als niet ingelogd of bij fout.
  // Gebruikt door cloudSync.js en storage.js voor toegangscontrole.
  // ---------------------------------------------------------------------------
  async function getTier() {
    const { profile, error } = await getProfile();                             // profiel ophalen
    if (error || !profile) return "guest";                                     // niet ingelogd of fout → guest
    const tier = profile.tier || "guest";                                      // tier ophalen, fallback guest
    // viewer en editor zijn stamboom-rechten, geen account types
    if (tier === "viewer" || tier === "editor") return "guest";                // rechten → behandel als guest
    return tier;                                                               // guest | owner | admin
  }

  // ---------------------------------------------------------------------------
  // updateUsername(username)
  // ---------------------------------------------------------------------------
  async function updateUsername(username) {
    const user = await getUser();                                              // user ophalen
    if (!user) return { error: "Niet ingelogd." };                             // niet ingelogd
    if (!username || username.trim().length < 2) {
      return { error: "Gebruikersnaam moet minimaal 2 tekens bevatten." };     // validatie
    }

    const { error } = await _client
      .from("profiles")
      .update({ username: username.trim() })                                   // gebruikersnaam bijwerken
      .eq("id", user.id);                                                      // filter op user ID

    return { error: _errMsg(error) };                                          // fout teruggeven
  }

  // ---------------------------------------------------------------------------
  // onAuthChange(callback)
  // ---------------------------------------------------------------------------
  function onAuthChange(callback) {
    _client.auth.onAuthStateChange((event, session) => {
      callback(event, session);                                                // callback aanroepen
    });
  }

  // ---------------------------------------------------------------------------
  // getClient()
  // ---------------------------------------------------------------------------
  function getClient() {
    return _client;                                                            // gedeelde client teruggeven
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
    getClient,       // ()                           → supabase client
  };

})();
