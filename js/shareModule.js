// =============================================================================
// shareModule.js — Stamboom Delen Module
// MyFamTreeCollab v1.2.0
// -----------------------------------------------------------------------------
// Handles sharing family trees with other users (viewer or editor role).
// v1.2.0: uitnodiging atomair registreren via Edge Function en e-mail versturen.
// Manages invitations, access lists, and revocation.
//
// Nieuw in v1.1.0 (F6-05):
// - shareTree(): tier-check uitnodigende gebruiker — alleen owner en admin mogen uitnodigen
// - shareTree(): tier-check uitgenodigde gebruiker verwijderd — elke ingelogde gebruiker
//   (viewer, editor, owner) kan worden uitgenodigd voor een gedeelde stamboom
//
// Bugfix v1.0.1:
// - listSharedWith() en listSharedWithMe() gebruiken nu _getDisplayName()
//   met fallback: eerst user_profiles.display_name, dan profiles.username
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
  // Returns the shared Supabase client from AuthModule
  // ---------------------------------------------------------------------------
  function _getClient() {
    return window.AuthModule.getClient(); // Reuse existing Supabase client
  }

  // ---------------------------------------------------------------------------
  // _getDisplayName(userId)
  // Haalt weergavenaam op voor een gebruiker.
  // Probeert eerst user_profiles.display_name, daarna profiles.username als fallback.
  // @param {string} userId — UUID van de gebruiker
  // @returns {string} — weergavenaam of 'Onbekend'
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

    // Stap 2: fallback naar profiles.username
    const { data: pData } = await client
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    if (pData && pData.username && pData.username.trim() !== '') {
      return pData.username;    // username als fallback
    }

    return 'Onbekend';    // Geen naam gevonden in beide tabellen
  }

  // ---------------------------------------------------------------------------
  // shareTree(stamboomId, email, rol)
  // Invites a user to a family tree by email address with a given role.
  //
  // Steps:
  //   1. Verify current user is the owner of the tree
  //   2. Look up viewer_id via email using RPC function
  //   3. Check that the invited user is not on a free tier
  //   4. Insert record into stamboom_gedeeld
  //
  // @param {string} stamboomId — UUID of the tree to share
  // @param {string} email      — Email address of the user to invite
  // @param {string} rol        — 'viewer' or 'editor'
  // @returns {{ success: boolean, error: string|null }}
  // ---------------------------------------------------------------------------
  async function shareTree(stamboomId, email, rol) {
    if (!stamboomId || !['viewer', 'editor'].includes(rol) ||
        !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return { success: false, error: 'Controleer stamboom, e-mailadres en rol.' };
    }

    const user = await window.AuthModule.getUser();
    if (!user) return { success: false, error: 'Niet ingelogd.' };

    // Eén serveractie voor toegangsregistratie en e-mail. Geen e-mailgeheimen in de browser.
    try {
      const { data, error } = await _getClient().functions.invoke('send-share-invitation', {
        body: { stamboom_id: stamboomId, email: email.trim().toLowerCase(), rol: rol }
      });
      if (error) return { success: false, error: error.message || 'Uitnodiging mislukt.' };
      if (!data || !data.success) return {
        success: false,
        error: (data && data.error) || 'Uitnodiging mislukt.'
      };
      return {
        success: true,
        error: null,
        email_sent: data.email_sent === true,
        email_error: data.email_error || null
      };
    } catch (error) {
      return { success: false, error: error.message || 'Netwerkfout bij uitnodigen.' };
    }
  }

  // ---------------------------------------------------------------------------
  // listSharedWith(stamboomId)
  // Returns a list of users the owner has shared a specific tree with.
  // Joins with user_profiles for display_name and profiles for tier info.
  //
  // @param {string} stamboomId — UUID of the tree
  // @returns {{ data: Array, error: string|null }}
  //   data item: { viewer_id, display_name, rol, gedeeld_op }
  // ---------------------------------------------------------------------------
  async function listSharedWith(stamboomId) {
    const client = _getClient();

    // Fetch all sharing records for this tree where current user is the owner
    const { data, error } = await client
      .from("stamboom_gedeeld")
      .select("viewer_id, rol, gedeeld_op")
      .eq("stamboom_id", stamboomId)
      .order("gedeeld_op", { ascending: true }); // Oldest invite first

    if (error) return { data: [], error: error.message };
    if (!data || data.length === 0) return { data: [], error: null };

    // Verrijk met weergavenaam via _getDisplayName (fallback: username uit profiles)
    const enriched = await Promise.all(data.map(async (record) => {
      const displayName = await _getDisplayName(record.viewer_id);    // Fallback ingebouwd
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
  // Returns all family trees that have been shared with the current logged-in user.
  // Joins stambomen for tree name and user_profiles for owner's display name.
  //
  // @returns {{ data: Array, error: string|null }}
  //   data item: { stamboom_id, naam, eigenaar_display_name, rol, gedeeld_op }
  // ---------------------------------------------------------------------------
  async function listSharedWithMe() {
    const client = _getClient();

    // Get current user
    const user = await window.AuthModule.getUser();
    if (!user) return { data: [], error: "Niet ingelogd." };

    // Fetch all trees shared with the current user
    const { data, error } = await client
      .from("stamboom_gedeeld")
      .select("stamboom_id, eigenaar_id, rol, gedeeld_op")
      .eq("viewer_id", user.id) // Only records where current user is the viewer/editor
      .order("gedeeld_op", { ascending: false }); // Most recent first

    if (error) return { data: [], error: error.message };
    if (!data || data.length === 0) return { data: [], error: null };

    // Enrich each record with tree name and owner display name
    const enriched = await Promise.all(data.map(async (record) => {

      // Fetch the tree name from stambomen
      const { data: boom } = await client
        .from("stambomen")
        .select("naam")
        .eq("id", record.stamboom_id)
        .single();

      // Haal eigenaar naam op via _getDisplayName (fallback: username uit profiles)
      const eigenaarNaam = await _getDisplayName(record.eigenaar_id);

      return {
        stamboom_id:            record.stamboom_id,
        naam:                   boom?.naam || "Onbekende stamboom",
        eigenaar_display_name:  eigenaarNaam,    // Via _getDisplayName met fallback
        rol:                    record.rol,
        gedeeld_op:             record.gedeeld_op
      };
    }));

    return { data: enriched, error: null };
  }

  // ---------------------------------------------------------------------------
  // revokeAccess(stamboomId, viewerId)
  // Allows the owner to revoke a specific user's access to a tree.
  // Only the owner can call this for other users.
  //
  // @param {string} stamboomId — UUID of the tree
  // @param {string} viewerId   — UUID of the user whose access to revoke
  // @returns {{ success: boolean, error: string|null }}
  // ---------------------------------------------------------------------------
  async function revokeAccess(stamboomId, viewerId) {
    const client = _getClient();

    // Get the current user (must be the owner)
    const user = await window.AuthModule.getUser();
    if (!user) return { success: false, error: "Niet ingelogd." };

    // Delete the sharing record where current user is the owner
    const { error } = await client
      .from("stamboom_gedeeld")
      .delete()
      .eq("stamboom_id", stamboomId)  // Match on tree
      .eq("eigenaar_id", user.id)     // Only owner can delete others' access
      .eq("viewer_id", viewerId);     // Target specific viewer

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  }

  // ---------------------------------------------------------------------------
  // leaveCollaboration(stamboomId)
  // Allows a viewer or editor to remove themselves from a shared tree.
  // This is the "verlaat samenwerking" action — self-removal only.
  //
  // @param {string} stamboomId — UUID of the tree to leave
  // @returns {{ success: boolean, error: string|null }}
  // ---------------------------------------------------------------------------
  async function leaveCollaboration(stamboomId) {
    const client = _getClient();

    // Get the current user (the one leaving)
    const user = await window.AuthModule.getUser();
    if (!user) return { success: false, error: "Niet ingelogd." };

    // Delete the sharing record where the current user is the viewer/editor
    const { error } = await client
      .from("stamboom_gedeeld")
      .delete()
      .eq("stamboom_id", stamboomId) // Match on tree
      .eq("viewer_id", user.id);     // Only delete own access record (RLS enforces this too)

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  }

  // ---------------------------------------------------------------------------
  // getMyRoleForTree(stamboomId)
  // Returns the current user's role for a given tree.
  // Returns 'owner' if the tree belongs to the current user.
  // Returns 'viewer' or 'editor' if shared.
  // Returns null if no access.
  //
  // @param {string} stamboomId — UUID of the tree
  // @returns {{ rol: string|null, error: string|null }}
  // ---------------------------------------------------------------------------
  async function getMyRoleForTree(stamboomId) {
    const client = _getClient();

    // Get the current user
    const user = await window.AuthModule.getUser();
    if (!user) return { rol: null, error: "Niet ingelogd." };

    // Check if the current user is the owner
    const { data: boom } = await client
      .from("stambomen")
      .select("user_id")
      .eq("id", stamboomId)
      .single();

    if (boom && boom.user_id === user.id) {
      return { rol: "owner", error: null }; // Current user is the owner
    }

    // Check if the tree is shared with the current user
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
