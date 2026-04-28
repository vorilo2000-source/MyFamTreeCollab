// =============================================================================
// topbar.js — TopBar Auth Modal & Status
// MyFamTreeCollab v2.3.0
// -----------------------------------------------------------------------------
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
  // ---------------------------------------------------------------------------
  function _clearLocalData() {
    localStorage.removeItem('stamboomData');
    localStorage.removeItem('stamboomData_modified');
    localStorage.removeItem('stamboomActiefId');
    localStorage.removeItem('stamboomActiefNaam');
    console.log('[topbar] Lokale stamboomdata gewist.');
  }

  // ---------------------------------------------------------------------------
  // _injectModal()
  // ---------------------------------------------------------------------------
  function _injectModal() {
    if (document.getElementById("auth-modal-root")) return;

    const root = document.createElement("div");
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

    document.body.appendChild(root);
    _injectStyles();
  }

  // ---------------------------------------------------------------------------
  // _injectStyles()
  // ---------------------------------------------------------------------------
  function _injectStyles() {
    if (document.getElementById("auth-modal-styles")) return;

    const style = document.createElement("style");
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

      /* ── Notificatie-badge op de knop ── */
      .collab-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        background: #dc2626;
        color: #fff;
        font-size: 0.68rem;
        font-weight: bold;
        border-radius: 9px;
        line-height: 1;
        margin-left: 2px;
        box-shadow: 0 1px 3px rgba(220,38,38,0.4);
        animation: badge-pop 0.3s ease;
      }
      @keyframes badge-pop {
        0%   { transform: scale(0.5); opacity: 0; }
        70%  { transform: scale(1.15); }
        100% { transform: scale(1); opacity: 1; }
      }

      /* ── Dropdown paneel ── */
      .top-user-dropdown {
        display: none;
        position: absolute; top: calc(100% + 6px); right: 0;
        min-width: 190px; background: #ffffff;
        border: 1px solid #e5e7eb; border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        z-index: 2000; overflow: hidden; padding: 4px 0;
      }
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

      /* Badge in het dropdown menu naast Samenwerken */
      .dropdown-collab-badge {
        display: inline-flex; align-items: center; justify-content: center;
        min-width: 16px; height: 16px; padding: 0 4px;
        background: #dc2626; color: #fff;
        font-size: 0.65rem; font-weight: bold;
        border-radius: 8px; margin-left: auto;
      }
    `;

    document.head.appendChild(style);
  }

  // ---------------------------------------------------------------------------
  // updateCollabBadge(userId, supabase)
  // Telt ongelezen collab berichten en toont/verbergt de rode badge.
  // Ongelezen = geplaatst door iemand anders, na collabLaatstGezien timestamp.
  // ---------------------------------------------------------------------------
  async function updateCollabBadge(userId, supabase) {
    try {
      // Laatste bezoek aan collab.html — ver verleden als nog nooit bezocht
      var laarstGezien = localStorage.getItem('collabLaatstGezien') || '2000-01-01T00:00:00.000Z';

      // Verzamel alle boom-IDs waar de gebruiker toegang toe heeft
      var boomIds = new Set();

      // Eigen bomen
      var eigenResult = await supabase
        .from('stambomen')
        .select('id')
        .eq('user_id', userId);
      if (eigenResult.data) {
        eigenResult.data.forEach(function (b) { boomIds.add(b.id); });
      }

      // Gedeelde bomen
      var gedeeldResult = await supabase
        .from('stamboom_gedeeld')
        .select('stamboom_id')
        .eq('viewer_id', userId);
      if (gedeeldResult.data) {
        gedeeldResult.data.forEach(function (b) { boomIds.add(b.stamboom_id); });
      }

      if (boomIds.size === 0) { _setBadgeTelling(0); return; }

      // Tel berichten van anderen, nieuwer dan laatste bezoek
      var result = await supabase
        .from('collab_messages')
        .select('id', { count: 'exact', head: true })
        .in('boom_id', Array.from(boomIds))    // Alleen toegankelijke bomen
        .neq('user_id', userId)                 // Niet eigen berichten
        .gte('created_at', laarstGezien);       // Nieuwer dan laatste bezoek

      _setBadgeTelling(result.count || 0);

    } catch (err) {
      console.warn('[topbar] updateCollabBadge fout (niet-fataal):', err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // _setBadgeTelling(telling)
  // Toont of verbergt de badge op de knop en in het dropdown menu.
  // ---------------------------------------------------------------------------
  function _setBadgeTelling(telling) {
    var badge         = document.getElementById('collab-badge-knop');
    var dropdownBadge = document.getElementById('collab-badge-dropdown');
    var tekst         = telling > 99 ? '99+' : String(telling);

    if (telling <= 0) {
      if (badge)         badge.style.display = 'none';
      if (dropdownBadge) dropdownBadge.style.display = 'none';
      return;
    }

    if (badge) {
      badge.textContent   = tekst;
      badge.style.display = 'inline-flex';
    }
    if (dropdownBadge) {
      dropdownBadge.textContent   = tekst;
      dropdownBadge.style.display = 'inline-flex';
    }
  }

  // ---------------------------------------------------------------------------
  // _renderTopBar(username)
  // ---------------------------------------------------------------------------
  function _renderTopBar(username) {
    const slot = document.getElementById("top-auth");
    if (!slot) return;

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

      const wrapper = document.getElementById("top-user-wrapper");
      const btn     = document.getElementById("top-user-btn");

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = wrapper.classList.toggle("open");
        btn.classList.toggle("open", isOpen);
        btn.setAttribute("aria-expanded", isOpen);
      });

      document.getElementById("btn-dropdown-logout").addEventListener("click", async () => {
        _clearLocalData();
        await AuthModule.logout();
      });

    } else {
      slot.innerHTML = `
        <button class="top-auth-login" onclick="TopBarAuth.openModal()">Login</button>
      `;
    }
  }

  // ---------------------------------------------------------------------------
  // Hulpfuncties
  // ---------------------------------------------------------------------------
  function _escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function _closeUserDropdown() {
    const wrapper = document.getElementById("top-user-wrapper");
    const btn     = document.getElementById("top-user-btn");
    if (!wrapper) return;
    wrapper.classList.remove("open");
    if (btn) { btn.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
  }

  function _showAdminDropdown(isAdmin) {
    var attempts = 0;
    var interval = setInterval(function () {
      var adminDd   = document.getElementById("adminDropdown");
      var developDd = document.getElementById("developDropdown");
      if (adminDd || developDd) {
        clearInterval(interval);
        if (adminDd)   adminDd.style.display   = isAdmin ? "list-item" : "none";
        if (developDd) developDd.style.display = isAdmin ? "list-item" : "none";
      }
      if (++attempts >= 20) clearInterval(interval);
    }, 100);
  }

  async function _getUsernameFromSession(session) {
    if (!session) return null;
    try {
      const { profile } = await AuthModule.getProfile();
      if (profile && profile.username) return profile.username;
    } catch (e) { /* profiel bestaat nog niet */ }
    const email = session.user.email || "";
    return email.split("@")[0] || "Gebruiker";
  }

  // ---------------------------------------------------------------------------
  // Modal functies
  // ---------------------------------------------------------------------------
  function openModal() {
    _injectModal();
    switchTab("login");
    document.getElementById("auth-modal-root").classList.add("open");
    setTimeout(() => { const f = document.getElementById("auth-login-email"); if (f) f.focus(); }, 50);
  }

  function closeModal() {
    const root = document.getElementById("auth-modal-root");
    if (root) root.classList.remove("open");
    ["auth-msg-login", "auth-msg-register", "auth-msg-forgot"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) { el.textContent = ""; el.className = "auth-msg"; }
    });
  }

  function switchTab(tab) {
    ["login", "register", "forgot"].forEach(function (name) {
      const s = document.getElementById("auth-section-" + name);
      if (s) s.classList.remove("active");
    });
    const target = document.getElementById("auth-section-" + tab);
    if (target) target.classList.add("active");
    const tabs = document.getElementById("auth-tabs");
    if (tabs) tabs.style.display = tab === "forgot" ? "none" : "flex";
    const lb = document.getElementById("tab-btn-login");
    const rb = document.getElementById("tab-btn-register");
    if (lb) lb.classList.toggle("active", tab === "login");
    if (rb) rb.classList.toggle("active", tab === "register");
  }

  function _showMsg(id, text, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className   = "auth-msg " + type;
  }

  async function doLogin() {
    const email = document.getElementById("auth-login-email").value.trim();
    const password = document.getElementById("auth-login-password").value;
    const btn = document.getElementById("auth-btn-login");
    btn.disabled = true; btn.textContent = "Bezig…";
    const { user, error } = await AuthModule.login(email, password);
    btn.disabled = false; btn.textContent = "Inloggen";
    if (error) { _showMsg("auth-msg-login", error, "error"); return; }
    _showMsg("auth-msg-login", "Ingelogd!", "success");
    setTimeout(() => closeModal(), 800);
  }

  async function doRegister() {
    const username  = document.getElementById("auth-reg-username").value.trim();
    const email     = document.getElementById("auth-reg-email").value.trim();
    const password  = document.getElementById("auth-reg-password").value;
    const password2 = document.getElementById("auth-reg-password2").value;
    const btn       = document.getElementById("auth-btn-register");
    if (password !== password2) {
      _showMsg("auth-msg-register", "Wachtwoorden komen niet overeen.", "error"); return;
    }
    btn.disabled = true; btn.textContent = "Bezig…";
    const { user, error } = await AuthModule.register(email, password, username);
    btn.disabled = false; btn.textContent = "Account aanmaken";
    if (error) { _showMsg("auth-msg-register", error, "error"); return; }
    switchTab("login");
    _showMsg("auth-msg-login", "Account aangemaakt! Controleer je e-mail en bevestig je adres, log daarna in.", "success");
  }

  async function doForgotPassword() {
    const email = document.getElementById("auth-forgot-email").value.trim();
    const btn   = document.getElementById("auth-btn-forgot");
    btn.disabled = true; btn.textContent = "Bezig…";
    const { error } = await AuthModule.resetPassword(email);
    btn.disabled = false; btn.textContent = "Resetlink versturen";
    if (error) { _showMsg("auth-msg-forgot", error, "error"); return; }
    _showMsg("auth-msg-forgot", "Als dit e-mailadres bekend is, ontvang je een resetlink. Controleer ook je spammap.", "success");
  }

  // ---------------------------------------------------------------------------
  // init()
  // ---------------------------------------------------------------------------
  async function init() {
    _injectModal();

    const session = await AuthModule.getSession();

    if (session) {
      _currentUserId = session.user.id;
      const username = await _getUsernameFromSession(session);
      _renderTopBar(username);

      // Badge asynchroon bijwerken — niet-blokkerend
      const supabase = AuthModule.getClient();
      updateCollabBadge(session.user.id, supabase);

      try {
        const { profile } = await AuthModule.getProfile();
        _showAdminDropdown(profile && profile.is_admin === true);
      } catch (e) { _showAdminDropdown(false); }

    } else {
      _renderTopBar(null);
      _showAdminDropdown(false);
    }

    AuthModule.onAuthChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const inkomendUserId = session.user.id;
        if (_currentUserId && _currentUserId !== inkomendUserId) _clearLocalData();
        _currentUserId = inkomendUserId;
      }
      if (event === "SIGNED_OUT") { _clearLocalData(); _currentUserId = null; }

      if (session) {
        const username = await _getUsernameFromSession(session);
        _renderTopBar(username);
        const supabase = AuthModule.getClient();
        updateCollabBadge(session.user.id, supabase);    // Badge bijwerken na auth-wijziging
        try {
          const { profile } = await AuthModule.getProfile();
          _showAdminDropdown(profile && profile.is_admin === true);
        } catch (e) { _showAdminDropdown(false); }
      } else {
        _renderTopBar(null);
        _showAdminDropdown(false);
      }
    });

    document.addEventListener("click", () => _closeUserDropdown());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { _closeUserDropdown(); closeModal(); }
    });
  }

  // Auto-init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // ---------------------------------------------------------------------------
  // Publieke API
  // ---------------------------------------------------------------------------
  window.TopBarAuth = {
    openModal,
    closeModal,
    switchTab,
    doLogin,
    doRegister,
    doForgotPassword,
    // Badge handmatig vernieuwen — aanroepbaar vanuit collab.js na paginabezoek
    refreshCollabBadge: function () {
      if (!_currentUserId) return;
      updateCollabBadge(_currentUserId, AuthModule.getClient());
    }
  };

})();
