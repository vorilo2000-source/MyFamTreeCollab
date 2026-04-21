// ========================= js/cloudSync.js v2.1.2 =========================
// Cloud sync module for MyFamTreeCollab
// Manages multiple family trees per user in Supabase (table: stambomen)
// Requires: auth.js (window.AuthModule), storage.js (window.StamboomStorage)
//           versionControl.js (window.VersionControl) — optional, non-fatal if absent
// Exported as: window.CloudSync
//
// Fix v2.1.2:
// - loadFromCloud() verwijdert .eq('user_id', userId) filter zodat viewers en
//   editors gedeelde stambomen kunnen laden. RLS regelt de toegang.
// - saveToCloud() ondersteunt nu editor-opslag: als de actieve stamboom niet
//   van de ingelogde gebruiker is, wordt alleen .eq('id') gefilterd (geen
//   user_id check). RLS editor-schrijftoegang via stamboom_gedeeld regelt dit.
//
// Fix v2.1.1:
// - saveToCloud() roept nu ook setActiveTreeName(stamNaam) aan na succesvolle opslag
//
// Nieuw in v2.1.0 (F5-06):
// - saveToCloud() slaat na elke succesvolle opslag een versie-snapshot op
// - enforceLimit() wordt aangeroepen na elke saveToCloud() (max 20 versies)
//
// Nieuw in v2.0.0 (F5-07):
// - Meerdere stambomen per gebruiker
// - saveToCloud, loadFromCloud, listStambomen, deleteFromCloud, getCloudMeta
// ==========================================================================

(function () {
    'use strict';

    // Tiers die cloud backup mogen gebruiken
    var CLOUD_TIERS = ['supporter', 'personal', 'family', 'researcher', 'admin'];

    // Maximum aantal personen per stamboom voor niet-admin gebruikers
    var MAX_PERSONS = 500;

    // Naam van de Supabase tabel
    var TABLE = 'stambomen';

    // -----------------------------------------------------------------------
    // _getClient
    // -----------------------------------------------------------------------
    function _getClient() {
        if (!window.AuthModule || typeof window.AuthModule.getClient !== 'function') {
            console.error('[cloudSync] AuthModule niet beschikbaar');
            return null;
        }
        return window.AuthModule.getClient();
    }

    // -----------------------------------------------------------------------
    // _getCurrentUserId
    // -----------------------------------------------------------------------
    async function _getCurrentUserId() {
        var client = _getClient();
        if (!client) return null;

        var sessionResult = await client.auth.getSession();
        var session = sessionResult.data && sessionResult.data.session;
        if (!session || !session.user) return null;

        return session.user.id;
    }

    // -----------------------------------------------------------------------
    // _checkCloudAccess
    // -----------------------------------------------------------------------
    async function _checkCloudAccess() {
        if (!window.AuthModule || typeof window.AuthModule.getTier !== 'function') {
            return { allowed: false, error: 'not_logged_in' };
        }

        var tier = await window.AuthModule.getTier();

        if (tier === 'free') {
            return { allowed: false, error: 'no_cloud_access', tier: tier };
        }

        if (!CLOUD_TIERS.includes(tier)) {
            return { allowed: false, error: 'no_cloud_access', tier: tier };
        }

        return { allowed: true, isAdmin: tier === 'admin', tier: tier };
    }

    // -----------------------------------------------------------------------
    // listStambomen
    // -----------------------------------------------------------------------
    async function listStambomen() {
        var userId = await _getCurrentUserId();
        if (!userId) return { success: false, error: 'not_logged_in' };

        var access = await _checkCloudAccess();
        if (!access.allowed) return { success: false, error: access.error, tier: access.tier };

        var client = _getClient();

        var result = await client
            .from(TABLE)
            .select('id, naam, updated_at, data')
            .eq('user_id', userId)                                         // Eigen stambomen — user_id filter correct hier
            .order('updated_at', { ascending: false });

        if (result.error) {
            console.error('[cloudSync] listStambomen fout:', result.error);
            return { success: false, error: result.error.message };
        }

        var stambomen = (result.data || []).map(function(rij) {
            return {
                id:             rij.id,
                naam:           rij.naam || 'Naamloos',
                updatedAt:      rij.updated_at,
                aantalPersonen: Array.isArray(rij.data) ? rij.data.length : 0
            };
        });

        return { success: true, stambomen: stambomen, isAdmin: access.isAdmin, tier: access.tier };
    }

    // -----------------------------------------------------------------------
    // saveToCloud(naam, stamboumId)
    // Slaat de huidige lokale stamboom op in de cloud.
    //
    // Voor editors van een gedeelde stamboom: de update filtert alleen op
    // stamboom-id, niet op user_id. De RLS editor-schrijftoegang via
    // stamboom_gedeeld regelt de beveiliging server-side.
    // -----------------------------------------------------------------------
    async function saveToCloud(naam, stamboumId) {
        var userId = await _getCurrentUserId();
        if (!userId) return { success: false, error: 'not_logged_in' };

        var access = await _checkCloudAccess();
        if (!access.allowed) return { success: false, error: access.error, tier: access.tier };

        if (!window.StamboomStorage) return { success: false, error: 'storage_unavailable' };
        var allPersons = window.StamboomStorage.get();

        if (!access.isAdmin && allPersons.length > MAX_PERSONS) {
            return { success: false, error: 'limit_exceeded', count: allPersons.length, max: MAX_PERSONS };
        }

        var client   = _getClient();
        var stamNaam = (naam || '').trim() || 'Mijn stamboom';
        var nu       = new Date().toISOString();
        var result;

        if (stamboumId) {
            // ---- Bestaande stamboom overschrijven ----
            // Geen .eq('user_id') filter zodat editors ook kunnen opslaan.
            // RLS policy "editor schrijftoegang" via stamboom_gedeeld regelt beveiliging.
            result = await client
                .from(TABLE)
                .update({
                    naam:       stamNaam,                                  // Werk naam bij
                    data:       allPersons,                                // Vervang personen data
                    updated_at: nu                                         // Bijwerk tijdstip
                })
                .eq('id', stamboumId);                                     // Alleen filter op UUID — RLS doet de rest

        } else {
            // ---- Nieuwe stamboom aanmaken — altijd op naam van de eigenaar ----
            result = await client
                .from(TABLE)
                .insert({
                    user_id:    userId,                                    // Nieuwe stamboom is altijd van de aanmaker
                    naam:       stamNaam,
                    data:       allPersons,
                    updated_at: nu
                })
                .select('id')
                .single();
        }

        if (result.error) {
            console.error('[cloudSync] saveToCloud fout:', result.error);
            return { success: false, error: result.error.message };
        }

        var nieuwId = stamboumId || (result.data && result.data.id);

        if (nieuwId) {
            window.StamboomStorage.setActiveTreeId(nieuwId);
            window.StamboomStorage.setActiveTreeName(stamNaam);           // v2.1.1: naam synchroon houden
        }

        // F5-06: versie-snapshot (niet-fataal)
        if (window.VersionControl) {
            try {
                await window.VersionControl.saveVersion(nieuwId, allPersons, null);
                await window.VersionControl.enforceLimit(nieuwId);
                console.log('[cloudSync] Versie-snapshot aangemaakt:', nieuwId);
            } catch (versionErr) {
                console.warn('[cloudSync] Versie-snapshot mislukt (niet-fataal):', versionErr.message);
            }
        }

        return { success: true, id: nieuwId, naam: stamNaam, count: allPersons.length };
    }

    // -----------------------------------------------------------------------
    // loadFromCloud(stamboumId)
    // Laadt een specifieke cloud stamboom naar localStorage.
    //
    // Fix v2.1.2: geen .eq('user_id') filter meer zodat viewers en editors
    // gedeelde stambomen kunnen laden. RLS select-policy regelt de toegang.
    // -----------------------------------------------------------------------
    async function loadFromCloud(stamboumId) {
        if (!stamboumId) return { success: false, error: 'geen_id' };

        var userId = await _getCurrentUserId();
        if (!userId) return { success: false, error: 'not_logged_in' };

        var access = await _checkCloudAccess();
        if (!access.allowed) return { success: false, error: access.error, tier: access.tier };

        var client = _getClient();

        // Geen .eq('user_id') filter — RLS regelt toegang voor owners én viewers/editors
        // Met user_id filter konden viewers/editors de stamboom niet laden (0 rijen → .single() fout)
        var result = await client
            .from(TABLE)
            .select('id, naam, data, updated_at')
            .eq('id', stamboumId)                                          // Filter alleen op UUID
            .single();                                                     // RLS garandeert max 1 toegankelijke rij

        if (result.error) {
            console.error('[cloudSync] loadFromCloud fout:', result.error);
            return { success: false, error: result.error.message };
        }

        var cloudData = result.data.data;
        var stamNaam  = result.data.naam;
        var updatedAt = result.data.updated_at;

        if (!Array.isArray(cloudData)) {
            return { success: false, error: 'invalid_data' };
        }

        if (!window.StamboomStorage) return { success: false, error: 'storage_unavailable' };

        window.StamboomStorage.replaceAll(cloudData);                     // Overschrijf localStorage
        window.StamboomStorage.setActiveTreeId(stamboumId);               // Sla UUID op als actief
        window.StamboomStorage.setActiveTreeName(stamNaam);               // Sla naam op als actief

        return { success: true, naam: stamNaam, count: cloudData.length, updatedAt: updatedAt };
    }

    // -----------------------------------------------------------------------
    // deleteFromCloud(stamboumId)
    // -----------------------------------------------------------------------
    async function deleteFromCloud(stamboumId) {
        if (!stamboumId) return { success: false, error: 'geen_id' };

        var userId = await _getCurrentUserId();
        if (!userId) return { success: false, error: 'not_logged_in' };

        var access = await _checkCloudAccess();
        if (!access.allowed) return { success: false, error: access.error, tier: access.tier };

        var client = _getClient();

        var result = await client
            .from(TABLE)
            .delete()
            .eq('id', stamboumId)
            .eq('user_id', userId);                                        // Verwijderen alleen door eigenaar

        if (result.error) {
            console.error('[cloudSync] deleteFromCloud fout:', result.error);
            return { success: false, error: result.error.message };
        }

        var actieveId = window.StamboomStorage.getActiveTreeId();
        if (actieveId === stamboumId) {
            window.StamboomStorage.setActiveTreeId(null);
            window.StamboomStorage.setActiveTreeName(null);
        }

        return { success: true };
    }

    // -----------------------------------------------------------------------
    // getCloudMeta
    // -----------------------------------------------------------------------
    async function getCloudMeta() {
        var userId = await _getCurrentUserId();
        if (!userId) return { hasAccess: false, error: 'not_logged_in' };

        var access = await _checkCloudAccess();
        if (!access.allowed) {
            return { hasAccess: false, tier: access.tier, error: access.error };
        }

        var lijst = await listStambomen();

        if (!lijst.success) {
            return { hasAccess: true, tier: access.tier, stambomen: [], error: lijst.error };
        }

        return {
            hasAccess:  true,
            tier:       access.tier,
            isAdmin:    access.isAdmin,
            stambomen:  lijst.stambomen
        };
    }

    // -----------------------------------------------------------------------
    // Publieke API
    // -----------------------------------------------------------------------
    window.CloudSync = {
        saveToCloud:     saveToCloud,
        loadFromCloud:   loadFromCloud,
        deleteFromCloud: deleteFromCloud,
        listStambomen:   listStambomen,
        getCloudMeta:    getCloudMeta,
        MAX_PERSONS:     MAX_PERSONS
    };

})();
