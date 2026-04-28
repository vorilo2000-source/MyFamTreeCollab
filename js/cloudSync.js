// ========================= js/cloudSync.js v2.2.1 =========================
// Cloud sync module for MyFamTreeCollab
//
// Fix v2.2.1:
// - loadFromCloud() en listSharedWithMe() doen geen _checkCloudAccess() meer
//   Viewers en editors mogen gedeelde stambomen laden — alleen opslaan is beperkt
//
// Fix v2.2.0 (F6-04):
// - CLOUD_TIERS aangepast aan nieuw rolmodel: alleen 'owner' en 'admin'
// - _checkCloudAccess(): 'free' check vervangen door check op ['viewer', 'editor']
//
// Fix v2.1.2:
// - loadFromCloud() blokkeerde viewers/editors door user_id filter — opgelost
// - saveToCloud() ondersteunt editor-opslag via stamboom_gedeeld RLS
// ==========================================================================

(function () {
    'use strict';

    // Tiers die cloud backup mogen opslaan (nieuw rolmodel: alleen owner en admin)
    var CLOUD_TIERS = ['owner', 'admin'];

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
    // Controleert of de gebruiker cloud-opslag mag gebruiken (owner/admin).
    // Viewers en editors mogen NIET opslaan maar WEL laden — gebruik deze
    // check alleen in saveToCloud() en deleteFromCloud(), NIET in loadFromCloud().
    // -----------------------------------------------------------------------
    async function _checkCloudAccess() {
        if (!window.AuthModule || typeof window.AuthModule.getTier !== 'function') {
            return { allowed: false, error: 'not_logged_in' };
        }

        var tier = await window.AuthModule.getTier();

        if (['viewer', 'editor'].includes(tier)) {
            return { allowed: false, error: 'no_cloud_access', tier: tier };
        }

        if (!CLOUD_TIERS.includes(tier)) {
            return { allowed: false, error: 'no_cloud_access', tier: tier };
        }

        return { allowed: true, isAdmin: tier === 'admin', tier: tier };
    }

    // -----------------------------------------------------------------------
    // listStambomen — eigen bomen (alleen owner/admin)
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
            .eq('user_id', userId)
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
    // Alleen voor owner en admin — viewers/editors mogen niet opslaan.
    // -----------------------------------------------------------------------
    async function saveToCloud(naam, stamboumId) {
        var userId = await _getCurrentUserId();
        if (!userId) return { success: false, error: 'not_logged_in' };

        var access = await _checkCloudAccess();    // Blokkeer viewer/editor bij opslaan
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
            result = await client
                .from(TABLE)
                .update({ naam: stamNaam, data: allPersons, updated_at: nu })
                .eq('id', stamboumId);
        } else {
            result = await client
                .from(TABLE)
                .insert({ user_id: userId, naam: stamNaam, data: allPersons, updated_at: nu })
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
            window.StamboomStorage.setActiveTreeName(stamNaam);
        }

        if (window.VersionControl) {
            try {
                await window.VersionControl.saveVersion(nieuwId, allPersons, null);
                await window.VersionControl.enforceLimit(nieuwId);
            } catch (versionErr) {
                console.warn('[cloudSync] Versie-snapshot mislukt (niet-fataal):', versionErr.message);
            }
        }

        return { success: true, id: nieuwId, naam: stamNaam, count: allPersons.length };
    }

    // -----------------------------------------------------------------------
    // loadFromCloud(stamboumId)
    // Toegankelijk voor ALLE ingelogde gebruikers (ook viewer/editor).
    // _checkCloudAccess() wordt hier NIET aangeroepen — alleen login vereist.
    // RLS in Supabase regelt welke rijen de gebruiker mag zien.
    // -----------------------------------------------------------------------
    async function loadFromCloud(stamboumId) {
        if (!stamboumId) return { success: false, error: 'geen_id' };

        // Alleen login vereist — geen tier-check voor laden
        var userId = await _getCurrentUserId();
        if (!userId) return { success: false, error: 'not_logged_in' };

        var client = _getClient();

        // Geen user_id filter — RLS regelt toegang voor owners én viewers/editors
        var result = await client
            .from(TABLE)
            .select('id, naam, data, updated_at')
            .eq('id', stamboumId)
            .single();

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

        window.StamboomStorage.replaceAll(cloudData);
        window.StamboomStorage.setActiveTreeId(stamboumId);
        window.StamboomStorage.setActiveTreeName(stamNaam);

        return { success: true, naam: stamNaam, count: cloudData.length, updatedAt: updatedAt };
    }

    // -----------------------------------------------------------------------
    // deleteFromCloud(stamboumId) — alleen owner
    // -----------------------------------------------------------------------
    async function deleteFromCloud(stamboumId) {
        if (!stamboumId) return { success: false, error: 'geen_id' };

        var userId = await _getCurrentUserId();
        if (!userId) return { success: false, error: 'not_logged_in' };

        var access = await _checkCloudAccess();    // Blokkeer viewer/editor bij verwijderen
        if (!access.allowed) return { success: false, error: access.error, tier: access.tier };

        var client = _getClient();

        var result = await client
            .from(TABLE)
            .delete()
            .eq('id', stamboumId)
            .eq('user_id', userId);

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
    // getCloudMeta — alleen voor owner/admin
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
        loadFromCloud:   loadFromCloud,     // Toegankelijk voor alle ingelogde gebruikers
        deleteFromCloud: deleteFromCloud,
        listStambomen:   listStambomen,     // Alleen voor owner/admin
        getCloudMeta:    getCloudMeta,
        MAX_PERSONS:     MAX_PERSONS
    };

})();
