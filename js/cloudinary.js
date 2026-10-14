// =============================================================================
// cloudinary.js — centrale Cloudinary-configuratie en uploadfunctie
// MyFamTreeCollab v0.1.0
// -----------------------------------------------------------------------------
// Verantwoordelijkheden:
// - Owner/admin Cloudinary-configuratie lezen, opslaan en verwijderen
// - Alleen cloud_name + unsigned upload preset bewaren in Auth user_metadata
// - Geen API key, API secret, wachtwoord of token opslaan
// - Event-upload alleen toestaan voor de owner van de actieve stamboom
// - Per stamboom een asset_folder meesturen op basis van de stabiele stamboom-ID
//
// Dependencies:
// - auth.js altijd
// - shareModule.js alleen wanneer uploadImage() vanuit een stamboom wordt gebruikt
// =============================================================================

(function () {
    'use strict';

    function _validateSetting(value, label) {
        var normalized = String(value || '').trim();

        if (!normalized) {
            throw new Error(label + ' is verplicht.');
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(normalized)) {
            throw new Error(label + ' bevat ongeldige tekens.');
        }

        return normalized;
    }

    function _settingsFromSession(session) {
        if (!session || !session.user) return null;

        var metadata = session.user.user_metadata || {};
        var cfg = metadata.cloudinary || {};

        if (!cfg.cloud_name || !cfg.upload_preset) return null;

        return {
            cloud_name: String(cfg.cloud_name),
            upload_preset: String(cfg.upload_preset)
        };
    }

    async function getSettings() {
        if (!window.AuthModule) {
            throw new Error('AuthModule is niet beschikbaar.');
        }

        var session = await window.AuthModule.getSession();
        return _settingsFromSession(session);
    }

    async function saveSettings(cloudName, uploadPreset) {
        if (!window.AuthModule) {
            throw new Error('AuthModule is niet beschikbaar.');
        }

        var normalizedCloudName = _validateSetting(cloudName, 'Cloud name');
        var normalizedUploadPreset = _validateSetting(uploadPreset, 'Upload preset');

        var client = window.AuthModule.getClient();
        var result = await client.auth.updateUser({
            data: {
                cloudinary: {
                    cloud_name: normalizedCloudName,
                    upload_preset: normalizedUploadPreset
                }
            }
        });

        if (result.error) throw result.error;

        return {
            cloud_name: normalizedCloudName,
            upload_preset: normalizedUploadPreset
        };
    }

    async function removeSettings() {
        if (!window.AuthModule) {
            throw new Error('AuthModule is niet beschikbaar.');
        }

        var client = window.AuthModule.getClient();
        var result = await client.auth.updateUser({
            data: {
                cloudinary: null
            }
        });

        if (result.error) throw result.error;
    }

    function getActiveTreeId() {
        return String(localStorage.getItem('stamboomActiefId') || '').trim();
    }

    function getAssetFolder(treeId) {
        var normalizedTreeId = String(treeId || '').trim();

        if (!normalizedTreeId) {
            throw new Error('Geen stabiele stamboom-ID beschikbaar.');
        }

        return 'stamboom_' + normalizedTreeId.replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    async function canUploadForTree(treeId) {
        var normalizedTreeId = String(treeId || '').trim();
        if (!normalizedTreeId) return false;

        if (!window.ShareModule || typeof window.ShareModule.getMyRoleForTree !== 'function') {
            return false;
        }

        try {
            var role = await window.ShareModule.getMyRoleForTree(normalizedTreeId);
            return role === 'owner';
        } catch (error) {
            console.warn('[cloudinary] Stamboomrol kon niet worden bepaald:', error);
            return false;
        }
    }

    async function uploadImage(file, options) {
        if (!file) {
            throw new Error('Geen bestand geselecteerd.');
        }

        var treeId = options && options.treeId
            ? String(options.treeId).trim()
            : getActiveTreeId();

        if (!treeId) {
            throw new Error('Geen actieve stamboom geselecteerd.');
        }

        var allowed = await canUploadForTree(treeId);
        if (!allowed) {
            throw new Error('Alleen de owner van deze stamboom kan naar Cloudinary uploaden.');
        }

        var settings = await getSettings();
        if (!settings) {
            throw new Error('Cloudinary is nog niet gekoppeld in het accountmenu.');
        }

        var form = new FormData();
        form.append('file', file);
        form.append('upload_preset', settings.upload_preset);
        form.append('asset_folder', getAssetFolder(treeId));

        var response = await fetch(
            'https://api.cloudinary.com/v1_1/' +
            encodeURIComponent(settings.cloud_name) +
            '/image/upload',
            {
                method: 'POST',
                body: form
            }
        );

        var result = await response.json();

        if (!response.ok || !result || !result.secure_url) {
            var message = result && result.error && result.error.message
                ? result.error.message
                : 'Cloudinary upload mislukt.';
            throw new Error(message);
        }

        return result;
    }

    // -------------------------------------------------------------------------
    // Cloudinary instellingenpagina
    // -------------------------------------------------------------------------
    function _setMessage(text, type) {
        var el = document.getElementById('cloudinary-message');
        if (!el) return;

        el.textContent = text || '';
        el.className = 'cloudinary-message' + (type ? ' ' + type : '');
    }

    function _setConnectedState(isConnected) {
        var status = document.getElementById('cloudinary-status');
        var text = document.getElementById('cloudinary-status-text');
        var removeBtn = document.getElementById('cloudinary-remove');

        if (status) status.classList.toggle('connected', !!isConnected);
        if (text) text.textContent = isConnected ? 'Cloudinary gekoppeld' : 'Nog niet gekoppeld';
        if (removeBtn) removeBtn.disabled = !isConnected;
    }

    function _showAccessDenied(text) {
        var main = document.getElementById('cloudinary-main');
        var denied = document.getElementById('cloudinary-access-denied');
        var deniedText = document.getElementById('cloudinary-access-denied-text');

        if (main) main.style.display = 'none';
        if (text && deniedText) deniedText.textContent = text;
        if (denied) denied.style.display = 'block';
    }

    function _showPage() {
        var denied = document.getElementById('cloudinary-access-denied');
        var main = document.getElementById('cloudinary-main');

        if (denied) denied.style.display = 'none';
        if (main) main.style.display = '';
    }

    async function _loadSettingsPage() {
        var session = await window.AuthModule.getSession();

        if (!session) {
            _showAccessDenied('Log eerst in om Cloudinary te beheren.');
            return;
        }

        var tier = await window.AuthModule.getTier();

        if (tier !== 'owner' && tier !== 'admin') {
            _showAccessDenied('Alleen een owner of admin kan een Cloudinary-koppeling beheren.');
            return;
        }

        _showPage();

        var settings = _settingsFromSession(session);
        var cloudNameInput = document.getElementById('cloudinary-cloud-name');
        var presetInput = document.getElementById('cloudinary-upload-preset');

        if (cloudNameInput) cloudNameInput.value = settings ? settings.cloud_name : '';
        if (presetInput) presetInput.value = settings ? settings.upload_preset : '';

        _setConnectedState(!!settings);
    }

    async function _saveFromPage() {
        var cloudNameInput = document.getElementById('cloudinary-cloud-name');
        var presetInput = document.getElementById('cloudinary-upload-preset');
        var saveBtn = document.getElementById('cloudinary-save');

        if (!cloudNameInput || !presetInput || !saveBtn) return;

        _setMessage('', '');

        saveBtn.disabled = true;
        saveBtn.textContent = 'Bezig…';

        try {
            await saveSettings(cloudNameInput.value, presetInput.value);
            _setConnectedState(true);
            _setMessage('Cloudinary-koppeling opgeslagen.', 'success');
        } catch (error) {
            _setMessage(
                'Opslaan mislukt: ' + (error.message || String(error)),
                'error'
            );
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Opslaan';
        }
    }

    async function _removeFromPage() {
        var removeBtn = document.getElementById('cloudinary-remove');
        var cloudNameInput = document.getElementById('cloudinary-cloud-name');
        var presetInput = document.getElementById('cloudinary-upload-preset');

        if (!removeBtn) return;

        if (!window.confirm(
            'Cloudinary-koppeling verwijderen? Bestaande bron-URL’s in events blijven behouden.'
        )) {
            return;
        }

        _setMessage('', '');
        removeBtn.disabled = true;
        removeBtn.textContent = 'Bezig…';

        try {
            await removeSettings();

            if (cloudNameInput) cloudNameInput.value = '';
            if (presetInput) presetInput.value = '';

            _setConnectedState(false);
            _setMessage('Cloudinary-koppeling verwijderd.', 'success');
        } catch (error) {
            _setMessage(
                'Verwijderen mislukt: ' + (error.message || String(error)),
                'error'
            );
            _setConnectedState(true);
        } finally {
            removeBtn.textContent = 'Koppeling verwijderen';
        }
    }

    function _bindPageActions() {
        var saveBtn = document.getElementById('cloudinary-save');
        var removeBtn = document.getElementById('cloudinary-remove');

        if (saveBtn) saveBtn.addEventListener('click', _saveFromPage);
        if (removeBtn) removeBtn.addEventListener('click', _removeFromPage);
    }

    function _loadSharedComponents() {
        return i18nModule.init()
            .then(function () {
                return fetch('/MyFamTreeCollab/Layout/TopBar.html')
                    .then(function (r) { return r.text(); })
                    .then(function (html) {
                        i18nModule.onComponentLoaded(
                            html,
                            document.getElementById('topbar-placeholder')
                        );

                        var script = document.createElement('script');
                        script.src = '/MyFamTreeCollab/js/topbar.js';
                        document.body.appendChild(script);
                    });
            })
            .then(function () {
                return fetch('/MyFamTreeCollab/Layout/Navbar.html?v=1.4.1', { cache: 'no-store' })
                    .then(function (r) { return r.text(); })
                    .then(function (html) {
                        i18nModule.onComponentLoaded(
                            html,
                            document.getElementById('navbar-placeholder')
                        );
                    });
            })
            .then(function () {
                return fetch('/MyFamTreeCollab/Layout/Footer.html')
                    .then(function (r) { return r.text(); })
                    .then(function (html) {
                        i18nModule.onComponentLoaded(
                            html,
                            document.getElementById('footer-placeholder')
                        );
                    });
            });
    }

    function _initSettingsPage() {
        if (!document.getElementById('cloudinary-main')) return;

        _bindPageActions();

        _loadSharedComponents()
            .catch(function (error) {
                console.warn(
                    '[cloudinary] Gedeelde componenten konden niet volledig laden:',
                    error
                );
            })
            .finally(function () {
                _loadSettingsPage().catch(function (error) {
                    _showAccessDenied(
                        'Cloudinary-instellingen konden niet worden geladen: ' +
                        (error.message || String(error))
                    );
                });
            });
    }

    window.CloudinaryModule = {
        getSettings: getSettings,
        saveSettings: saveSettings,
        removeSettings: removeSettings,
        getActiveTreeId: getActiveTreeId,
        getAssetFolder: getAssetFolder,
        canUploadForTree: canUploadForTree,
        uploadImage: uploadImage
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _initSettingsPage);
    } else {
        _initSettingsPage();
    }
})();
