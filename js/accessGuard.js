// =============================================================================
// accessGuard.js — Pagina toegangsbeveiliging op basis van rol
// MyFamTreeCollab v1.1.0
// -----------------------------------------------------------------------------
// Nieuw in v1.1.0 (F6-06):
// - Rolnamen waren al correct (owner/editor/viewer) — geen logica-aanpassingen nodig
// - Dubbele bestandsinhoud verwijderd (was per ongeluk twee keer opgeslagen)
//
// Checks whether the current user has the required role to access a page.
// Works by looking up the active tree ID in localStorage and verifying the
// user's role via ShareModule.getMyRoleForTree().
//
// Usage (add to each protected page, after shareModule.js):
//
//   document.addEventListener('DOMContentLoaded', function () {
//     AccessGuard.check(['viewer', 'editor']);   // Allow viewer and editor
//     AccessGuard.check(['editor']);             // Allow only editor (e.g. manage.html)
//   });
//
// Pages accessible to all roles (no guard needed):
//   view.html, timeline.html, storage.html, stats.html, collab.html
//
// Pages blocked for viewer:
//   manage.html — editor + owner only
//
// Pages blocked for viewer AND editor:
//   create.html, import.html, export.html — owner only
//
// The guard hides <main> until the check passes, then reveals it.
// On failure: shows an error block, keeps <main> hidden.
//
// Dependencies:
//   auth.js        (window.AuthModule)
//   storage.js     (window.StamboomStorage)
//   shareModule.js (window.ShareModule)
//
// Load order:
//   utils.js → schema.js → storage.js → auth.js → shareModule.js → accessGuard.js → [pagina].js
// =============================================================================

(function () {
    'use strict';

    // ---------------------------------------------------------------------------
    // _injectErrorBlock()
    // Creates and injects the error UI block into the page.
    // Called once on first failed check.
    // ---------------------------------------------------------------------------
    function _injectErrorBlock(titel, tekst) {
        // Hide the main content so nothing leaks through
        var main = document.querySelector('main');
        if (main) main.style.display = 'none';                 // Hide page content

        // Build the error container
        var blok = document.createElement('div');
        blok.id = 'access-guard-blok';
        blok.style.cssText = [
            'max-width: 520px',
            'margin: 48px auto',
            'padding: 32px 36px',
            'background: #fef2f2',
            'border: 1px solid #fca5a5',
            'border-radius: 10px',
            'text-align: center',
            'font-family: Arial, sans-serif'
        ].join(';');

        // Icon
        var icon = document.createElement('div');
        icon.textContent = '🔒';
        icon.style.cssText = 'font-size: 2.5rem; margin-bottom: 12px;';

        // Title
        var h2 = document.createElement('h2');
        h2.textContent = titel;
        h2.style.cssText = 'font-size: 1.1rem; font-weight: bold; color: #991b1b; margin: 0 0 10px 0;';

        // Description
        var p = document.createElement('p');
        p.textContent = tekst;
        p.style.cssText = 'font-size: 0.92rem; color: #7f1d1d; line-height: 1.6; margin: 0 0 20px 0;';

        // Back button — navigates to storage.html
        var btn = document.createElement('a');
        btn.href = '/MyFamTreeCollab/stamboom/storage.html';    // Always back to storage
        btn.textContent = '← Terug naar opslag';
        btn.style.cssText = [
            'display: inline-block',
            'padding: 9px 20px',
            'background: #2563eb',
            'color: #fff',
            'border-radius: 5px',
            'text-decoration: none',
            'font-size: 0.9rem',
            'font-weight: bold'
        ].join(';');

        blok.appendChild(icon);
        blok.appendChild(h2);
        blok.appendChild(p);
        blok.appendChild(btn);

        // Insert before <main> or at top of body
        var main2 = document.querySelector('main');
        if (main2) {
            document.body.insertBefore(blok, main2);           // Place error block before hidden main
        } else {
            document.body.appendChild(blok);                   // Fallback: append to body
        }
    }

    // ---------------------------------------------------------------------------
    // _reveal()
    // Makes <main> visible after a successful access check.
    // ---------------------------------------------------------------------------
    function _reveal() {
        var main = document.querySelector('main');
        if (main) main.style.display = '';                     // Restore default display
    }

    // ---------------------------------------------------------------------------
    // _hide()
    // Hides <main> while the async check is in progress.
    // Prevents content flash before the check completes.
    // ---------------------------------------------------------------------------
    function _hide() {
        var main = document.querySelector('main');
        if (main) main.style.display = 'none';                 // Hide until check resolves
    }

    // ---------------------------------------------------------------------------
    // check(toegestaneRollen)
    // Main entry point. Call from DOMContentLoaded on each protected page.
    //
    // @param {string[]} toegestaneRollen — e.g. ['viewer', 'editor'] or ['editor']
    //
    // Flow:
    //   1. Always allow 'owner' — they own the tree, no check needed
    //   2. If no active tree ID → assume own local tree → allow
    //   3. Look up role via ShareModule.getMyRoleForTree()
    //   4. If role is in toegestaneRollen → reveal page
    //   5. If role is not allowed → show error block
    // ---------------------------------------------------------------------------
    async function check(toegestaneRollen) {
        _hide();    // Hide content immediately while async check runs

        // Step 1: Verify dependencies are loaded
        if (!window.AuthModule || !window.StamboomStorage || !window.ShareModule) {
            console.warn('[AccessGuard] Vereiste modules niet geladen — toegang geweigerd.');
            _injectErrorBlock(
                'Pagina kon niet worden geladen',
                'Een vereiste module ontbreekt. Herlaad de pagina of ga terug naar opslag.'
            );
            return;
        }

        // Step 2: Get active tree ID from localStorage
        var actieveId = window.StamboomStorage.getActiveTreeId();

        // Step 3: If no active tree ID — user is working on a local tree (no cloud share)
        // In that case, this is the owner's own local data → always allow
        if (!actieveId) {
            _reveal();
            return;
        }

        // Step 4: Check if user is logged in
        var user = await window.AuthModule.getUser();
        if (!user) {
            // Not logged in — only local data is allowed, no shared tree access
            _reveal();    // Local tree → allow (no sharing context)
            return;
        }

        // Step 5: Get the user's role for the active tree
        var result = await window.ShareModule.getMyRoleForTree(actieveId);

        if (result.error) {
            // Could not determine role — safe fallback: allow (might be own tree)
            console.warn('[AccessGuard] Rol kon niet worden bepaald:', result.error);
            _reveal();
            return;
        }

        var rol = result.rol;    // 'owner', 'editor', 'viewer', or null

        // Step 6: Owner always has access to everything
        if (rol === 'owner') {
            _reveal();
            return;
        }

        // Step 7: No role found — user has no access to this shared tree
        if (!rol) {
            _injectErrorBlock(
                'Geen toegang',
                'Je hebt geen toegang tot de actieve stamboom. Laad een stamboom waarvoor je toegang hebt via de opslagpagina.'
            );
            return;
        }

        // Step 8: Check if the user's role is in the allowed roles list
        if (toegestaneRollen.indexOf(rol) !== -1) {
            _reveal();    // Role is allowed → show page
            return;
        }

        // Step 9: Role not allowed for this page — show error block
        var rolNaam = rol === 'viewer' ? 'Viewer' : 'Editor';
        _injectErrorBlock(
            'Geen toegang voor ' + rolNaam,
            'Je hebt de rol "' + rolNaam + '" voor deze stamboom. ' +
            'Deze pagina is niet beschikbaar voor jouw rol.'
        );
    }

    // ---------------------------------------------------------------------------
    // Publieke API
    // ---------------------------------------------------------------------------
    window.AccessGuard = {
        check    // (toegestaneRollen: string[]) → void (async)
    };
