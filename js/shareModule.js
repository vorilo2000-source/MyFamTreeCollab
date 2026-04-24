// =============================================================================
// shareModule.js — Stamboom Delen Module
// MyFamTreeCollab v1.1.1
// -----------------------------------------------------------------------------
// Nieuw in v1.1.1:
// - 'profiles' → 'profile' (correcte tabelnaam) in _getDisplayName() en shareTree()
//
// Nieuw in v1.1.0 (F6-05):
// - shareTree(): tier-check uitnodigende gebruiker — alleen owner en admin mogen uitnodigen
// - shareTree(): tier-check uitgenodigde gebruiker verwijderd — elke ingelogde gebruiker
//   kan worden uitgenodigd voor een gedeelde stamboom
//
// Bugfix v1.0.1:
// - listSharedWith() en listSharedWithMe() gebruiken nu _getDisplayName()
//   met fallback: eerst user_profiles.display_name, dan profile.username
//
// Rules:
// - Only owners and admins can invite viewers and editors
// - Any logged-in user (viewer, editor, owner) can be invited to a shared tree
// - Viewers and editors can remove themselves (leave collaboration)
// - Editors can update tree data; viewers are read-only
//
// Dependencies:
//   auth.js (window.AuthModule) — session, client, tier
//
// Load order:
//   utils.js → schema.js → storage.js → auth.js → cloudSync.js → shareModule.js → [pagina].js
// =============================================================================

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // _getClient()
  // ---------------------------------------------------------------------------
  function _getClient() {
    return window.AuthModule.getClient(); // Reuse existing Supabase client
  }

  // ---------------------------------------------------------------------------
  // _getDisplayName(userId)
  // Haalt weergavenaam op voor een gebruiker.
  // Probeert eerst user_profiles.display_name, daarna profile.username als fallback.
  // ---------------------------------------------------------------------------
  async function _getDisplayName(userId) {
    const client = _getClient();

    // Stap 1: probeer user_profiles.display_name
    const { data: upData } = await client
      .from('user_profiles')
      .select('display_name')
      .eq('user_id', userId)
      .single();

    if (upData && upData.display_name && upData.display_name.trim() !== '') {
      return upData.display_name;    // display_name beschikbaar — gebruik dit
    }

    // Stap 2: fallback naar profile.username (correcte tabelnaam zonder s)
    const { data: pData } = await client
      .from('profile')               // Correcte tabelnaam (zonder s)
      .select('username')
      .eq('id', userId)
      .single();

    if (pData && pData.username && pData.username.trim() !== '') {
      return pData.username;         // username als fallback
    }

    return 'Onbekend';               // Geen naam gevonden in beide tabellen
  }

  // ---------------------------------------------------------------------------
  // shareTree(stamboomId, email, rol)
  // ---------------------------------------------------------------------------
  async function shareTree(stamboomId, email, rol) {
    const client = _getClient();

    // Validate role value before doing anything
    if (!['viewer', 'editor'].includes(rol)) {
      return { success: false, error: "Ongeldige rol. Kies 'viewer' of 'editor'." };
    }

    // Get the currently logged-in user (must be owner or admin)
    const user = await window.AuthModule.getUser();
    if (!user) return { success: false, error: "Niet ingelogd." };

    // Check that the current user has the right tier to invite others
    const myTier = await window.AuthModule.getTier();               // Haal tier op van uitnodigende gebruiker
    if (!['owner', 'admin'].includes(myTier)) {                     // Alleen owner en admin mogen uitnodigen
      return { success: false, error: "Alleen owners kunnen andere gebruikers uitnodigen." };
    }

    // Verify ownership: check that the tree belongs to the current user
    const { data: boom, error: boomErr } = await client
      .from("stambomen")
      .select("id, user_id")
      .eq("id", stamboomId)
      .eq("user_id", user.id)        // Only the owner passes this check
      .single();

    if (boomErr || !boom) {
      return { success: false, error: "Je bent niet de eigenaar van deze stamboom." };
    }

    // Look up the viewer's user_id via their email address using the RPC function
    const { data: viewerId, error: rpcErr } = await client
      .rpc("get_user_id_by_email", { email: email.trim().toLowerCase() });

    if (rpcErr || !viewerId) {
      return { success: false, error: "Geen account gevonden met dit e-mailadres." };
    }

    // Prevent owner from inviting themselves
    if (viewerId === user.id) {
      return { success: false, error: "Je kunt jezelf niet uitnodigen." };
    }

    // Profiel van uitgenodigde gebruiker ophalen uit profile (correcte tabelnaam zonder s)
    const { data: profiel, error: profielErr } = await client
      .from("profile")               // Correcte tabelnaam (zonder s)
      .select("tier")
      .eq("id", viewerId)
      .single();

    if (profielErr || !profiel) {
      return { success: false, error: "Profiel van uitgenodigde gebruiker niet gevonden." };
    }

    // Insert the sharing record into stamboom_gedeeld
    const { error: insertErr } = await client
      .from("stamboom_gedeeld")
      .insert({
        stamboom_id: stamboomId,     // UUID of the tree being shared
        eigenaar_id: user.id,        // UUID of the owner (current user)
        viewer_id:   viewerId,       // UUID of the invited user
        rol:         rol             // 'viewer' or 'editor'
      });

    // Handle duplicate: user already has access
    if (insertErr) {
      if (insertErr.code === "23505") { // Postgres unique constraint violation
        return { success: false, error: "Deze gebruiker heeft al toegang tot deze stamboom." };
      }
      return { success: false, error: insertErr.message };
    }

    return { success: true, error: null };
  }

  // ---------------------------------------------------------------------------
  // listSharedWith(stamboomId)
  // ---------------------------------------------------------------------------
  async function listSharedWith(stamboomId) {
    const client = _getClient();

    const { data, error } = await client
      .from("stamboom_gedeeld")
      .select("viewer_id, rol, gedeeld_op")
      .eq("stamboom_id", stamboomId)
      .order("gedeeld_op", { ascending: true });

    if (error) return { data: [], error: error.message };
    if (!data || data.length === 0) return { data: [], error: null };

    // Verrijk met weergavenaam via _getDisplayName (fallback: username uit profile)
    const enriched = await Promise.all(data.map(async (record) => {
      const displayName = await _getDisplayName(record.viewer_id);
      return {
        viewer_id:    record.viewer_id,
        display_name: displayName,
        rol:          record.rol,
        gedeeld_op:   record.gedeeld_op
      };
    }));

    return { data: enriched, error: null };
  }

  // ---------------------------------------------------------------------------
  // listSharedWithMe()
  // ---------------------------------------------------------------------------
  async function listSharedWithMe() {
    const client = _getClient();

    const user = await window.AuthModule.getUser();
    if (!user) return { data: [], error: "Niet ingelogd." };

    const { data, error } = await client
      .from("stamboom_gedeeld")
      .select("stamboom_id, eigenaar_id, rol, gedeeld_op")
      .eq("viewer_id", user.id)
      .order("gedeeld_op", { ascending: false });

    if (error) return { data: [], error: error.message };
    if (!data || data.length === 0) return { data: [], error: null };

    const enriched = await Promise.all(data.map(async (record) => {
      const { data: boom } = await client
        .from("stambomen")
        .select("naam")
        .eq("id", record.stamboom_id)
        .single();

      const eigenaarNaam = await _getDisplayName(record.eigenaar_id);

      return {
        stamboom_id:            record.stamboom_id,
        naam:                   boom?.naam || "Onbekende stamboom",
        eigenaar_display_name:  eigenaarNaam,
        rol:                    record.rol,
        gedeeld_op:             record.gedeeld_op
      };
    }));

    return { data: enriched, error: null };
  }

  // ---------------------------------------------------------------------------
  // revokeAccess(stamboomId, viewerId)
  // ---------------------------------------------------------------------------
  async function revokeAccess(stamboomId, viewerId) {
    const client = _getClient();

    const user = await window.AuthModule.getUser();
    if (!user) return { success: false, error: "Niet ingelogd." };

    const { error } = await client
      .from("stamboom_gedeeld")
      .delete()
      .eq("stamboom_id", stamboomId)
      .eq("eigenaar_id", user.id)
      .eq("viewer_id", viewerId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  }

  // ---------------------------------------------------------------------------
  // leaveCollaboration(stamboomId)
  // ---------------------------------------------------------------------------
  async function leaveCollaboration(stamboomId) {
    const client = _getClient();

    const user = await window.AuthModule.getUser();
    if (!user) return { success: false, error: "Niet ingelogd." };

    const { error } = await client
      .from("stamboom_gedeeld")
      .delete()
      .eq("stamboom_id", stamboomId)
      .eq("viewer_id", user.id);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  }

  // ---------------------------------------------------------------------------
  // getMyRoleForTree(stamboomId)
  // ---------------------------------------------------------------------------
  async function getMyRoleForTree(stamboomId) {
    const client = _getClient();

    const user = await window.AuthModule.getUser();
    if (!user) return { rol: null, error: "Niet ingelogd." };

    const { data: boom } = await client
      .from("stambomen")
      .select("user_id")
      .eq("id", stamboomId)
      .single();

    if (boom && boom.user_id === user.id) {
      return { rol: "owner", error: null };  // Current user is the owner
    }

    const { data: gedeeld, error } = await client
      .from("stamboom_gedeeld")
      .select("rol")
      .eq("stamboom_id", stamboomId)
      .eq("viewer_id", user.id)
      .single();

    if (error || !gedeeld) return { rol: null, error: null }; // No access found

    return { rol: gedeeld.rol, error: null }; // 'viewer' or 'editor'
  }

  // ---------------------------------------------------------------------------
  // Publieke API
  // ---------------------------------------------------------------------------
  window.ShareModule = {
    shareTree,           // (stamboomId, email, rol)  → { success, error }
    listSharedWith,      // (stamboomId)               → { data, error }
    listSharedWithMe,    // ()                         → { data, error }
    revokeAccess,        // (stamboomId, viewerId)     → { success, error }
    leaveCollaboration,  // (stamboomId)               → { success, error }
    getMyRoleForTree,    // (stamboomId)               → { rol, error }
  };

})();
