// =============================================================================
// topbar.js — TopBar Auth Modal & Status
// MyFamTreeCollab v2.3.2
// -----------------------------------------------------------------------------
// Nieuw in v2.3.2 (sessie 28):
// - _showAdminDropdown() herschreven van setInterval-poll naar MutationObserver
//   De oude poll (20x per 100ms = max 2s) faalde wanneer de Navbar-HTML later
//   dan 2s werd geïnjecteerd (i18n init + namespace load verlengt de keten).
//   MutationObserver reageert exact op het moment dat adminDropdown/developDropdown
//   in de DOM verschijnen — geen race condition meer.
//
// Nieuw in v2.3.1:
// - _fixDropdownPosition() — voorkomt dat dropdown buiten viewport valt
//
// Nieuw in v2.3.0:
// - Notificatie-badge op gebruikersnaamknop voor ongelezen collab berichten
// - updateCollabBadge() — telt berichten na collabLaatstGezien, van anderen
// - window.TopBarAuth.refreshCollabBadge() — publieke API voor collab.js
// - 💬 Samenwerken link toegevoegd in dropdown menu
//
// Nieuw in v2.2.1:
// - _clearLocalData() alleen bij echte gebruikerswissel
//
// Nieuw in v2.2.0:
// - Gebruikersnaam dropdown menu
//
// Dependencies: Supabase SDK, auth.js
// Load order:   utils.js → auth.js → topbar.js → [pagina].js
// =============================================================================

(function () {
  "use strict";

  let _currentUserId = null;    // UUID van de huidig ingelogde gebruiker

  // ---------------------------------------------------------------------------
  // _clearLocalData()
  // Wist alle stamboom-gerelateerde data uit localStorage.
  // ---------------------------------------------------------------------------
  function _clearLocalData() {
    localStorage.removeItem('stamboomData');               // Stamboom JSON
    localStorage.removeItem('stamboomData_modified');      // Wijzigingsvlag
    localStorage.removeItem('stamboomActiefId');           // Actief boom-ID
    localStorage.removeItem('stamboomActiefNaam');         // Actief boom-naam
    console.log('[topbar] Lokale stamboomdata gewist.');
  }

  // ---------------------------------------------------------------------------
  // _injectModal()
  // Maakt de auth-modal HTML aan en voegt deze toe aan de body (eenmalig).
  // ---------------------------------------------------------------------------
  function _injectModal() {
    if (document.getElementById("auth-modal-root")) return; // Voorkom dubbele injectie

    const root = document.createElement("div");            // Modal container
    root.id = "auth-modal-root";
    root.innerHTML = `
      <div id="auth-modal-backdrop" onclick="TopBarAuth.closeModal()"></div>
      <div id="auth-modal-box" role="dialog" aria-modal="true" aria-label="Inloggen">
        <button id="auth-modal-close" onclick="TopBarAuth.closeModal()" aria-label="Sluiten">&times;</button>
        <div class="auth-tabs" id="auth-tabs">
          <button class="auth-tab active" id="tab-btn-login"    onclick="TopBarAuth.switchTab('login')">Inloggen</button>
          <button class="auth-tab"        id="tab-btn-register" onclick="TopBarAuth.switchTab('register')">Account aanmaken</button>
        </div>
        <div class="auth-form-section active" id="auth-section-login">
          <div class="auth-field">
            <label for="auth-login-email">E-mailadres</label>
            <input type="email" id="auth-login-email" placeholder="naam@voorbeeld.nl" autocomplete="email" />
          </div>
          <div class="auth-field">
            <label for="auth-login-password">Wachtwoord</label>
            <input type="password" id="auth-login-password" placeholder="••••••••" autocomplete="current-password" />
          </div>
          <button class="auth-btn-primary" id="auth-btn-login" onclick="TopBarAuth.doLogin()">Inloggen</button>
          <p class="auth-forgot-link">
            <a href="#" onclick="TopBarAuth.switchTab('forgot'); return false;">Wachtwoord vergeten?</a>
          </p>
          <div class="auth-msg" id="auth-msg-login"></div>
        </div>
        <div class="auth-form-section" id="auth-section-register">
          <div class="auth-field">
            <label for="auth-reg-username">Gebruikersnaam</label>
            <input type="text" id="auth-reg-username" placeholder="Hoe wil je heten?" autocomplete="nickname" maxlength="32" />
          </div>
          <div class="auth-field">
            <label for="auth-reg-email">E-mailadres</label>
            <input type="email" id="auth-reg-email" placeholder="naam@voorbeeld.nl" autocomplete="email" />
          </div>
          <div class="auth-field">
            <label for="auth-reg-password">Wachtwoord</label>
            <input type="password" id="auth-reg-password" placeholder="Minimaal 6 tekens" autocomplete="new-password" />
          </div>
          <div class="auth-field">
            <label for="auth-reg-password2">Wachtwoord herhalen</label>
            <input type="password" id="auth-reg-password2" placeholder="Herhaal wachtwoord" autocomplete="new-password" />
          </div>
          <button class="auth-btn-primary" id="auth-btn-register" onclick="TopBarAuth.doRegister()">Account aanmaken</button>
          <div class="auth-msg" id="auth-msg-register"></div>
        </div>
        <div class="auth-form-section" id="auth-section-forgot">
          <p class="auth-back-link">
            <a href="#" onclick="TopBarAuth.switchTab('login'); return false;">← Terug naar inloggen</a>
          </p>
          <p class="auth-forgot-intro">
            Vul je e-mailadres in. Je ontvangt een link om een nieuw wachtwoord in te stellen.
          </p>
          <div class="auth-field">
            <label for="auth-forgot-email">E-mailadres</label>
            <input type="email" id="auth-forgot-email" placeholder="naam@voorbeeld.nl" autocomplete="email" />
          </div>
          <button class="auth-btn-primary" id="auth-btn-forgot" onclick="TopBarAuth.doForgotPassword()">Resetlink versturen</button>
          <div class="auth-msg" id="auth-msg-forgot"></div>
        </div>
      </div>
    `;

    document.body.appendChild(root);                       // Modal aan DOM toevoegen
    _injectStyles();                                       // CSS injecteren
  }

  // ---------------------------------------------------------------------------
  // _injectStyles()
  // Voegt alle CSS toe voor de auth-modal en topbar-dropdown (eenmalig).
  // ---------------------------------------------------------------------------
  function _injectStyles() {
    if (document.getElementById("auth-modal-styles")) return; // Voorkom dubbele injectie

    const style = document.createElement("style");        // Stijl-element aanmaken
    style.id = "auth-modal-styles";
    style.textContent = `
      #auth-modal-backdrop {
        display: none; position: fixed; inset: 0;
        background: rgba(0,0,0,0.45); z-index: 1000;
      }
      #auth-modal-box {
        display: none; position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: #ffffff; border-radius: 10px;
        padding: 28px 32px 24px; width: 100%; max-width: 400px;
        z-index: 1001; box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        font-family: Arial, sans-serif;
      }
      #auth-modal-root.open #auth-modal-backdrop,
      #auth-modal-root.open #auth-modal-box { display: block; }
      #auth-modal-close {
        position: absolute; top: 12px; right: 16px;
        background: none; border: none; font-size: 1.4rem;
        cursor: pointer; color: #888; line-height: 1;
      }
      #auth-modal-close:hover { color: #333; }
      .auth-tabs { display: flex; border-bottom: 2px solid #e5e7eb; margin-bottom: 20px; }
      .auth-tab {
        padding: 8px 20px; border: none; background: none;
        font-size: 0.92rem; cursor: pointer; color: #666;
        border-bottom: 2px solid transparent; margin-bottom: -2px; font-weight: bold;
      }
      .auth-tab.active { color: #2563eb; border-bottom-color: #2563eb; }
      .auth-form-section        { display: none; }
      .auth-form-section.active { display: block; }
      .auth-field { margin-bottom: 14px; }
      .auth-field label {
        display: block; font-size: 0.88rem; font-weight: bold;
        margin-bottom: 4px; color: #333;
      }
      .auth-field input {
        width: 100%; padding: 8px 11px; font-size: 0.95rem;
        border: 1px solid #bbb; border-radius: 6px;
        box-sizing: border-box; font-weight: normal;
      }
      .auth-field input:focus { outline: none; border-color: #2563eb; }
      .auth-btn-primary {
        width: 100%; padding: 9px; font-size: 0.92rem; font-weight: bold;
        background: #2563eb; color: white; border: none;
        border-radius: 6px; cursor: pointer; margin-top: 4px;
      }
      .auth-btn-primary:hover    { background: #1d4ed8; }
      .auth-btn-primary:disabled { background: #93c5fd; cursor: default; }
      .auth-msg {
        margin-top: 12px; padding: 9px 13px; border-radius: 6px;
        font-size: 0.88rem; display: none;
      }
      .auth-msg.error   { background: #fee2e2; color: #991b1b; display: block; }
      .auth-msg.success { background: #dcfce7; color: #166534; display: block; }
      .auth-forgot-link { margin-top: 10px; font-size: 0.85rem; text-align: right; }
      .auth-forgot-link a, .auth-back-link a { color: #2563eb; text-decoration: none; }
      .auth-forgot-link a:hover, .auth-back-link a:hover { text-decoration: underline; }
      .auth-back-link { font-size: 0.85rem; margin-bottom: 12px; }
      .auth-forgot-intro { font-size: 0.88rem; color: #555; margin-bottom: 14px; line-height: 1.5; }

      #top-auth { display: flex; align-items: center; gap: 8px; position: relative; }

      .top-auth-login {
        color: #000; text-decoration: none; font-size: 0.9rem; cursor: pointer;
        background: none; border: none; padding: 0;
        font-family: Arial, sans-serif; font-weight: normal;
      }
      .top-auth-login:hover { text-decoration: underline; }

      .top-user-wrapper { position: relative; display: inline-block; }

      .top-user-btn {
        display: flex; align-items: center; gap: 5px;
        padding: 4px 10px; border-radius: 5px;
        background: none; border: 1px solid transparent;
        cursor: pointer; font-size: 0.88rem; font-weight: bold;
        color: #333; font-family: Arial, sans-serif;
        transition: background 0.15s, border-color 0.15s;
        white-space: nowrap;
      }
      .top-user-btn:hover, .top-user-btn.open {
        background: #f3f4f6; border-color: #d1d5db;
      }

      .top-user-chevron {
        font-size: 0.65rem; color: #888;
        transition: transform 0.2s; display: inline-block;
      }
      .top-user-btn.open .top-user-chevron { transform: rotate(180deg); }

      .collab-badge {
        display: inline-flex; align-items: center; justify-content: center;
        min-width: 18px; height: 18px; padding: 0 5px;
        background: #dc2626; color: #fff;
        font-size: 0.68rem; font-weight: bold;
        border-radius: 9px; line-height: 1;
        margin-left: 2px;
        box-shadow: 0 1px 3px rgba(220,38,38,0.4);
        animation: badge-pop 0.3s ease;
      }
      @keyframes badge-pop {
        0%   { transform: scale(0.5); opacity: 0; }
        70%  { transform: scale(1.15); }
        100% { transform: scale(1); opacity: 1; }
      }

      .top-user-dropdown {
        display: none;
        position: absolute; top: calc(100% + 6px);
        left: 0; right: auto;
        min-width: 190px; background: #ffffff;
        border: 1px solid #e5e7eb; border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        z-index: 2000; overflow: hidden; padding: 4px 0;
      }
      .top-user-dropdown.align-right { left: auto; right: 0; }
      .top-user-wrapper.open .top-user-dropdown { display: block; }

      .top-user-dropdown-header {
        padding: 8px 16px 6px; font-size: 0.78rem;
        color: #9ca3af; border-bottom: 1px solid #f3f4f6; margin-bottom: 4px;
      }

      .top-user-dropdown a,
      .top-user-dropdown button {
        display: flex; align-items: center; gap: 9px;
        width: 100%; padding: 9px 16px; text-decoration: none;
        font-size: 0.88rem; color: #374151;
        background: none; border: none; cursor: pointer;
        text-align: left; font-family: Arial, sans-serif;
        transition: background 0.1s; box-sizing: border-box;
      }
      .top-user-dropdown a:hover,
      .top-user-dropdown button:hover { background: #f9fafb; color: #111827; }

      .top-user-dropdown .dropdown-divider {
        border: none; border-top: 1px solid #f3f4f6; margin: 4px 0;
      }
      .top-user-dropdown .btn-logout { color: #dc2626; }
      .top-user-dropdown .btn-logout:hover { background: #fef2f2; color: #b91c1c; }

      .dropdown-collab-badge {
        display: inline-flex; align-items: center; justify-content: center;
        min-width: 16px; height: 16px; padding: 0 4px;
        background: #dc2626; color: #fff;
        font-size: 0.65rem; font-weight: bold;
        border-radius: 8px; margin-left: auto;
      }
    `;

    document.head.appendChild(style);                     // CSS aan <head> toevoegen
  }

  // ---------------------------------------------------------------------------
  // _fixDropdownPosition(dropdownEl)
  // Controleert na het openen of de dropdown buiten de viewport valt.
  // Zet .align-right als de rechterrand buiten beeld valt.
  // ---------------------------------------------------------------------------
  function _fixDropdownPosition(dropdownEl) {
    dropdownEl.classList.remove("align-right");            // Reset vorige flip
    dropdownEl.style.left  = "";                           // Reset inline override
    dropdownEl.style.right = "";                           // Reset inline override

    requestAnimationFrame(function () {
      var rect      = dropdownEl.getBoundingClientRect();  // Positie na render
      var viewportW = window.innerWidth || document.documentElement.clientWidth;
      var MARGE     = 8;                                   // Minimale marge tot rand (px)

      if (rect.right > viewportW - MARGE) {
        dropdownEl.classList.add("align-right");           // Flip: rechts uitlijnen
      } else if (rect.left < MARGE) {
        dropdownEl.style.left  = MARGE + "px";             // Vastpinnen aan viewport-rand
        dropdownEl.style.right = "auto";
      }
    });
  }

  // ---------------------------------------------------------------------------
  // updateCollabBadge(userId, supabase)
  // Telt ongelezen collab berichten en toont/verbergt de rode badge.
  // ---------------------------------------------------------------------------
  async function updateCollabBadge(userId, supabase) {
    try {
      var laarstGezien = localStorage.getItem('collabLaatstGezien') || '2000-01-01T00:00:00.000Z'; // Fallback: ver verleden

      var boomIds = new Set();                             // Verzamel toegankelijke boom-IDs

      var eigenResult = await supabase
        .from('stambomen').select('id').eq('user_id', userId);
      if (eigenResult.data) {
        eigenResult.data.forEach(function (b) { boomIds.add(b.id); }); // Eigen bomen toevoegen
      }

      var gedeeldResult = await supabase
        .from('stamboom_gedeeld').select('stamboom_id').eq('viewer_id', userId);
      if (gedeeldResult.data) {
        gedeeldResult.data.forEach(function (b) { boomIds.add(b.stamboom_id); }); // Gedeelde bomen toevoegen
      }

      if (boomIds.size === 0) { _setBadgeTelling(0); return; } // Geen bomen → geen badge

      var result = await supabase
        .from('collab_messages')
        .select('id', { count: 'exact', head: true })
        .in('boom_id', Array.from(boomIds))                // Alleen toegankelijke bomen
        .neq('user_id', userId)                            // Niet eigen berichten
        .gte('created_at', laarstGezien);                  // Nieuwer dan laatste bezoek

      _setBadgeTelling(result.count || 0);                 // Badge bijwerken

    } catch (err) {
      console.warn('[topbar] updateCollabBadge fout (niet-fataal):', err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // _setBadgeTelling(telling)
  // Toont of verbergt de badge op de knop en in het dropdown menu.
  // ---------------------------------------------------------------------------
  function _setBadgeTelling(telling) {
    var badge         = document.getElementById('collab-badge-knop');     // Badge op knop
    var dropdownBadge = document.getElementById('collab-badge-dropdown'); // Badge in dropdown
    var tekst         = telling > 99 ? '99+' : String(telling);          // Tekst begrenzen op 99+

    if (telling <= 0) {
      if (badge)         badge.style.display = 'none';                    // Badge verbergen
      if (dropdownBadge) dropdownBadge.style.display = 'none';
      return;
    }

    if (badge) {
      badge.textContent   = tekst;                                        // Telling tonen
      badge.style.display = 'inline-flex';
    }
    if (dropdownBadge) {
      dropdownBadge.textContent   = tekst;
      dropdownBadge.style.display = 'inline-flex';
    }
  }

  // ---------------------------------------------------------------------------
  // _renderTopBar(username)
  // Rendert de ingelogde gebruikersknop met dropdown, of de login-knop.
  // ---------------------------------------------------------------------------
  function _renderTopBar(username) {
    const slot = document.getElementById("top-auth");      // Plaatshouder in TopBar.html
    if (!slot) return;                                     // Guard: element moet bestaan

    if (username) {
      slot.innerHTML = `
        <div class="top-user-wrapper" id="top-user-wrapper">
          <button class="top-user-btn" id="top-user-btn" aria-haspopup="true" aria-expanded="false">
            👤 <span>${_escHtml(username)}</span>
            <span class="collab-badge" id="collab-badge-knop" style="display:none;" title="Ongelezen berichten in Samenwerken"></span>
            <span class="top-user-chevron">▼</span>
          </button>
          <div class="top-user-dropdown" role="menu" id="top-user-dropdown">
            <div class="top-user-dropdown-header">${_escHtml(username)}</div>
            <a href="/MyFamTreeCollab/account/account.html" role="menuitem">⚙️ Mijn Account</a>
            <a href="/MyFamTreeCollab/account/history.html" role="menuitem">📜 Versiegeschiedenis</a>
            <a href="/MyFamTreeCollab/stamboom/collab.html" role="menuitem">
              💬 Samenwerken
              <span class="dropdown-collab-badge" id="collab-badge-dropdown" style="display:none;"></span>
            </a>
            <hr class="dropdown-divider">
            <button class="btn-logout" id="btn-dropdown-logout" role="menuitem">🚪 Uitloggen</button>
          </div>
        </div>
      `;

      const wrapper  = document.getElementById("top-user-wrapper");       // Wrapper element
      const btn      = document.getElementById("top-user-btn");           // Knop element
      const dropdown = document.getElementById("top-user-dropdown");      // Dropdown paneel

      btn.addEventListener("click", (e) => {
        e.stopPropagation();                               // Klik niet doorgeven aan document
        const isOpen = wrapper.classList.toggle("open");  // Toggle open/dicht
        btn.classList.toggle("open", isOpen);             // Knop-staat bijwerken
        btn.setAttribute("aria-expanded", isOpen);        // Toegankelijkheid bijwerken

        if (isOpen) {
          _fixDropdownPosition(dropdown);                 // Positie corrigeren na openen
        }
      });

      document.getElementById("btn-dropdown-logout").addEventListener("click", async () => {
        _clearLocalData();                                 // Lokale data wissen
        await AuthModule.logout();                         // Uitloggen via Supabase
      });

    } else {
      slot.innerHTML = `
        <button class="top-auth-login" onclick="TopBarAuth.openModal()">Login</button>
      `;                                                   // Login-knop tonen als niet ingelogd
    }
  }

  // ---------------------------------------------------------------------------
  // _escHtml(str)
  // Escapet HTML-speciale tekens om XSS te voorkomen.
  // ---------------------------------------------------------------------------
  function _escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")       // & en < escapen
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")      // > en " escapen
      .replace(/'/g, "&#39;");                            // ' escapen
  }

  // ---------------------------------------------------------------------------
  // _closeUserDropdown()
  // Sluit de gebruikers-dropdown en reset aria-attributen.
  // ---------------------------------------------------------------------------
  function _closeUserDropdown() {
    const wrapper = document.getElementById("top-user-wrapper");
    const btn     = document.getElementById("top-user-btn");
    if (!wrapper) return;                                  // Guard: wrapper moet bestaan
    wrapper.classList.remove("open");                     // Dropdown sluiten
    if (btn) { btn.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
  }

  // ---------------------------------------------------------------------------
  // _showAdminDropdown(isAdmin)
  // Toont of verbergt de admin/develop menu-items in de navigatie.
  //
  // v2.3.2: herschreven van setInterval-poll naar MutationObserver.
  // De oude poll (max 2s) faalde bij trage i18n-initialisatie omdat de Navbar-HTML
  // pas na topbar.js werd geïnjecteerd. MutationObserver reageert exact op het
  // moment dat adminDropdown/developDropdown in de DOM verschijnen.
  // Fallback: als beide elementen al in de DOM zitten, direct toepassen.
  // ---------------------------------------------------------------------------
  function _showAdminDropdown(isAdmin) {
    var displayVal = isAdmin ? "list-item" : "none";       // Zichtbaarheidsstatus bepalen

    // Probeer direct toe te passen als elementen al in de DOM zitten
    var adminDd   = document.getElementById("adminDropdown");
    var developDd = document.getElementById("developDropdown");

    if (adminDd || developDd) {
      // Elementen al aanwezig — direct toepassen, geen observer nodig
      if (adminDd)   adminDd.style.display   = displayVal; // Admin dropdown tonen/verbergen
      if (developDd) developDd.style.display = displayVal; // Developer dropdown tonen/verbergen
      return;
    }

    // Elementen nog niet in DOM — wacht via MutationObserver tot ze verschijnen
    var observer = new MutationObserver(function (mutations, obs) {
      var ad = document.getElementById("adminDropdown");   // Admin dropdown zoeken
      var dd = document.getElementById("developDropdown"); // Developer dropdown zoeken

      if (ad || dd) {
        if (ad) ad.style.display   = displayVal;           // Admin dropdown instellen
        if (dd) dd.style.display   = displayVal;           // Developer dropdown instellen

        // Beide gevonden: observer stoppen
        if (ad && dd) {
          obs.disconnect();                                 // Observer stoppen — werk gedaan
        }
      }
    });

    // Observeer de volledige body op toevoegingen van child-elementen (subtree)
    observer.observe(document.body, {
      childList: true,   // Directe kinderen bewaken
      subtree: true      // Ook diepere nakomelingen bewaken (Navbar is genest)
    });
  }

  // ---------------------------------------------------------------------------
  // _getUsernameFromSession(session)
  // Haalt de weergavenaam op uit het profiel, valt terug op e-mail prefix.
  // ---------------------------------------------------------------------------
  async function _getUsernameFromSession(session) {
    if (!session) return null;                             // Geen sessie → geen naam
    try {
      const { profile } = await AuthModule.getProfile();  // Profiel ophalen via Supabase
      if (profile && profile.username) return profile.username; // Gebruikersnaam teruggeven
    } catch (e) { /* profiel bestaat nog niet */ }
    const email = session.user.email || "";               // Fallback: e-mail prefix
    return email.split("@")[0] || "Gebruiker";            // Voor @-teken als naam
  }

  // ---------------------------------------------------------------------------
  // Modal functies
  // ---------------------------------------------------------------------------

  // Opent de auth-modal en focust het e-mailinvoerveld
  function openModal() {
    _injectModal();                                        // Modal aanmaken als nog niet aanwezig
    switchTab("login");                                    // Login-tab activeren
    document.getElementById("auth-modal-root").classList.add("open"); // Modal tonen
    setTimeout(() => { const f = document.getElementById("auth-login-email"); if (f) f.focus(); }, 50); // Focus e-mail
  }

  // Sluit de auth-modal en wist alle fout-/succesboodschappen
  function closeModal() {
    const root = document.getElementById("auth-modal-root");
    if (root) root.classList.remove("open");              // Modal verbergen
    ["auth-msg-login", "auth-msg-register", "auth-msg-forgot"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) { el.textContent = ""; el.className = "auth-msg"; } // Berichten wissen
    });
  }

  // Wisselt tussen de tabbladen login / register / forgot
  function switchTab(tab) {
    ["login", "register", "forgot"].forEach(function (name) {
      const s = document.getElementById("auth-section-" + name);
      if (s) s.classList.remove("active");               // Alle secties verbergen
    });
    const target = document.getElementById("auth-section-" + tab);
    if (target) target.classList.add("active");          // Gewenste sectie tonen
    const tabs = document.getElementById("auth-tabs");
    if (tabs) tabs.style.display = tab === "forgot" ? "none" : "flex"; // Tabs verbergen bij forgot
    const lb = document.getElementById("tab-btn-login");
    const rb = document.getElementById("tab-btn-register");
    if (lb) lb.classList.toggle("active", tab === "login");    // Login-tab markeren
    if (rb) rb.classList.toggle("active", tab === "register"); // Register-tab markeren
  }

  // Toont een feedback-boodschap (error of success) in het opgegeven element
  function _showMsg(id, text, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;                                // Boodschaptekst instellen
    el.className   = "auth-msg " + type;                 // Type-klasse toepassen (error/success)
  }

  // Verwerkt het loginformulier en roept AuthModule.login() aan
  async function doLogin() {
    const email    = document.getElementById("auth-login-email").value.trim();     // E-mail ophalen
    const password = document.getElementById("auth-login-password").value;         // Wachtwoord ophalen
    const btn      = document.getElementById("auth-btn-login");
    btn.disabled = true; btn.textContent = "Bezig…";     // Knop uitschakelen
    const { user, error } = await AuthModule.login(email, password);               // Inloggen
    btn.disabled = false; btn.textContent = "Inloggen";  // Knop herstellen
    if (error) { _showMsg("auth-msg-login", error, "error"); return; }             // Fout tonen
    _showMsg("auth-msg-login", "Ingelogd!", "success");  // Succes tonen
    setTimeout(() => closeModal(), 800);                  // Modal sluiten na bevestiging
  }

  // Verwerkt het registratieformulier en roept AuthModule.register() aan
  async function doRegister() {
    const username  = document.getElementById("auth-reg-username").value.trim();   // Gebruikersnaam
    const email     = document.getElementById("auth-reg-email").value.trim();      // E-mail
    const password  = document.getElementById("auth-reg-password").value;         // Wachtwoord
    const password2 = document.getElementById("auth-reg-password2").value;        // Herhaling
    const btn       = document.getElementById("auth-btn-register");
    if (password !== password2) {
      _showMsg("auth-msg-register", "Wachtwoorden komen niet overeen.", "error"); return; // Validatie
    }
    btn.disabled = true; btn.textContent = "Bezig…";     // Knop uitschakelen
    const { user, error } = await AuthModule.register(email, password, username); // Registreren
    btn.disabled = false; btn.textContent = "Account aanmaken"; // Knop herstellen
    if (error) { _showMsg("auth-msg-register", error, "error"); return; }          // Fout tonen
    switchTab("login");                                   // Naar login-tab na succes
    _showMsg("auth-msg-login", "Account aangemaakt! Controleer je e-mail en bevestig je adres, log daarna in.", "success");
  }

  // Verwerkt het wachtwoord-vergeten formulier en verstuurt een resetlink
  async function doForgotPassword() {
    const email = document.getElementById("auth-forgot-email").value.trim();       // E-mail ophalen
    const btn   = document.getElementById("auth-btn-forgot");
    btn.disabled = true; btn.textContent = "Bezig…";     // Knop uitschakelen
    const { error } = await AuthModule.resetPassword(email);                       // Reset versturen
    btn.disabled = false; btn.textContent = "Resetlink versturen"; // Knop herstellen
    if (error) { _showMsg("auth-msg-forgot", error, "error"); return; }            // Fout tonen
    _showMsg("auth-msg-forgot", "Als dit e-mailadres bekend is, ontvang je een resetlink. Controleer ook je spammap.", "success");
  }

  // ---------------------------------------------------------------------------
  // init()
  // Initialiseert de topbar: laadt sessie, rendert UI, start auth-listener.
  // ---------------------------------------------------------------------------
  async function init() {
    _injectModal();                                        // Modal alvast injecteren

    const session = await AuthModule.getSession();         // Controleer bestaande sessie

    if (session) {
      _currentUserId = session.user.id;                   // Huidige gebruiker opslaan
      const username = await _getUsernameFromSession(session); // Naam ophalen
      _renderTopBar(username);                             // TopBar renderen met naam

      const supabase = AuthModule.getClient();             // Supabase client ophalen
      updateCollabBadge(session.user.id, supabase);        // Badge asynchroon bijwerken

      try {
        const { profile } = await AuthModule.getProfile(); // Profiel ophalen
        _showAdminDropdown(profile && profile.is_admin === true); // Admin-menu tonen/verbergen
      } catch (e) { _showAdminDropdown(false); }           // Fout → admin-menu verbergen

    } else {
      _renderTopBar(null);                                 // Login-knop tonen
      _showAdminDropdown(false);                           // Admin-menu verborgen houden
    }

    // Luister naar auth-wijzigingen (login, logout, token refresh)
    AuthModule.onAuthChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const inkomendUserId = session.user.id;
        if (_currentUserId && _currentUserId !== inkomendUserId) _clearLocalData(); // Andere gebruiker
        _currentUserId = inkomendUserId;                   // Nieuwe gebruiker opslaan
      }
      if (event === "SIGNED_OUT") { _clearLocalData(); _currentUserId = null; } // Uitgelogd

      if (session) {
        const username = await _getUsernameFromSession(session);  // Naam ophalen
        _renderTopBar(username);                           // TopBar bijwerken
        const supabase = AuthModule.getClient();
        updateCollabBadge(session.user.id, supabase);      // Badge bijwerken
        try {
          const { profile } = await AuthModule.getProfile(); // Profiel opnieuw ophalen
          _showAdminDropdown(profile && profile.is_admin === true); // Admin-menu bijwerken
        } catch (e) { _showAdminDropdown(false); }
      } else {
        _renderTopBar(null);                               // Login-knop tonen
        _showAdminDropdown(false);                         // Admin-menu verbergen
      }
    });

    document.addEventListener("click", () => _closeUserDropdown()); // Klik buiten sluit dropdown
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { _closeUserDropdown(); closeModal(); } // Escape sluit alles
    });
  }

  // Auto-init: wacht op DOM als die nog niet klaar is
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);  // Wacht op DOM-klaar
  } else {
    init();                                                // DOM al klaar, direct initialiseren
  }

  // ---------------------------------------------------------------------------
  // Publieke API
  // ---------------------------------------------------------------------------
  window.TopBarAuth = {
    openModal,                                             // Modal openen
    closeModal,                                            // Modal sluiten
    switchTab,                                             // Tab wisselen
    doLogin,                                               // Login verwerken
    doRegister,                                            // Registratie verwerken
    doForgotPassword,                                      // Wachtwoord-reset verwerken
    refreshCollabBadge: function () {                      // Badge handmatig vernieuwen (voor collab.js)
      if (!_currentUserId) return;
      updateCollabBadge(_currentUserId, AuthModule.getClient());
    }
  };

})();
