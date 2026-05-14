// =============================================================================
// topbar.js — TopBar Auth Modal & Status
// MyFamTreeCollab v2.3.2
// -----------------------------------------------------------------------------
// Wijziging v2.3.2 (sessie 26):
// - Alle hardcoded strings via i18nModule.t('auth:...')
// - Modal HTML gegenereerd via i18n keys (labels, placeholders, knoppen)
// - Dropdown links via i18n keys
// - Fallback-strings als tweede argument bij _t() zodat het werkt
//   ook als de auth namespace nog niet geladen is
//
// Nieuw in v2.3.1:
// - _fixDropdownPosition() — voorkomt dat dropdown buiten viewport valt
//
// Nieuw in v2.3.0:
// - Notificatie-badge op gebruikersnaamknop voor ongelezen collab berichten
// - window.TopBarAuth.refreshCollabBadge() — publieke API voor collab.js
//
// Dependencies: Supabase SDK, auth.js, i18n.js
// Load order:   utils.js → auth.js → topbar.js → [pagina].js
// =============================================================================

(function () {
  "use strict";

  var _currentUserId = null;    // UUID van de huidig ingelogde gebruiker

  // ---------------------------------------------------------------------------
  // _t(key, fallback)
  // Veilige i18n wrapper — werkt ook als auth namespace nog niet geladen is.
  // ---------------------------------------------------------------------------
  function _t(key, fallback) {
    try {
      if (window.i18nModule && typeof window.i18nModule.t === 'function') {
        var result = window.i18nModule.t(key);
        if (result && result !== key) return result;                       // Vertaling gevonden
      }
    } catch (e) { /* i18n niet klaar */ }
    return fallback || key;                                                // Fallback
  }

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
  // Genereert de auth-modal HTML via i18n keys en voegt toe aan body.
  // ---------------------------------------------------------------------------
  function _injectModal() {
    if (document.getElementById("auth-modal-root")) return;               // Voorkom dubbele injectie

    var root = document.createElement("div");
    root.id = "auth-modal-root";

    // Modal HTML opbouwen met i18n teksten
    root.innerHTML =
      '<div id="auth-modal-backdrop" onclick="TopBarAuth.closeModal()"></div>' +
      '<div id="auth-modal-box" role="dialog" aria-modal="true" aria-label="' + _t('auth:modal.ariaLabel', 'Inloggen') + '">' +
        '<button id="auth-modal-close" onclick="TopBarAuth.closeModal()" aria-label="' + _t('auth:modal.close', 'Sluiten') + '">&times;</button>' +
        '<div class="auth-tabs" id="auth-tabs">' +
          '<button class="auth-tab active" id="tab-btn-login"    onclick="TopBarAuth.switchTab(\'login\')">'    + _t('auth:tabs.login',    'Inloggen')        + '</button>' +
          '<button class="auth-tab"        id="tab-btn-register" onclick="TopBarAuth.switchTab(\'register\')">' + _t('auth:tabs.register', 'Account aanmaken') + '</button>' +
        '</div>' +

        // ── Login sectie ──
        '<div class="auth-form-section active" id="auth-section-login">' +
          '<div class="auth-field">' +
            '<label for="auth-login-email">' + _t('auth:login.labelEmail', 'E-mailadres') + '</label>' +
            '<input type="email" id="auth-login-email" placeholder="' + _t('auth:login.placeholderEmail', 'naam@voorbeeld.nl') + '" autocomplete="email" />' +
          '</div>' +
          '<div class="auth-field">' +
            '<label for="auth-login-password">' + _t('auth:login.labelPassword', 'Wachtwoord') + '</label>' +
            '<input type="password" id="auth-login-password" placeholder="' + _t('auth:login.placeholderPassword', '••••••••') + '" autocomplete="current-password" />' +
          '</div>' +
          '<button class="auth-btn-primary" id="auth-btn-login" onclick="TopBarAuth.doLogin()">' + _t('auth:login.btn', 'Inloggen') + '</button>' +
          '<p class="auth-forgot-link"><a href="#" onclick="TopBarAuth.switchTab(\'forgot\'); return false;">' + _t('auth:login.forgot', 'Wachtwoord vergeten?') + '</a></p>' +
          '<div class="auth-msg" id="auth-msg-login"></div>' +
        '</div>' +

        // ── Registratie sectie ──
        '<div class="auth-form-section" id="auth-section-register">' +
          '<div class="auth-field">' +
            '<label for="auth-reg-username">' + _t('auth:register.labelUsername', 'Gebruikersnaam') + '</label>' +
            '<input type="text" id="auth-reg-username" placeholder="' + _t('auth:register.placeholderUsername', 'Hoe wil je heten?') + '" autocomplete="nickname" maxlength="32" />' +
          '</div>' +
          '<div class="auth-field">' +
            '<label for="auth-reg-email">' + _t('auth:register.labelEmail', 'E-mailadres') + '</label>' +
            '<input type="email" id="auth-reg-email" placeholder="' + _t('auth:login.placeholderEmail', 'naam@voorbeeld.nl') + '" autocomplete="email" />' +
          '</div>' +
          '<div class="auth-field">' +
            '<label for="auth-reg-password">' + _t('auth:register.labelPassword', 'Wachtwoord') + '</label>' +
            '<input type="password" id="auth-reg-password" placeholder="' + _t('auth:register.placeholderPassword', 'Minimaal 6 tekens') + '" autocomplete="new-password" />' +
          '</div>' +
          '<div class="auth-field">' +
            '<label for="auth-reg-password2">' + _t('auth:register.labelPassword2', 'Wachtwoord herhalen') + '</label>' +
            '<input type="password" id="auth-reg-password2" placeholder="' + _t('auth:register.placeholderPassword2', 'Herhaal wachtwoord') + '" autocomplete="new-password" />' +
          '</div>' +
          '<button class="auth-btn-primary" id="auth-btn-register" onclick="TopBarAuth.doRegister()">' + _t('auth:register.btn', 'Account aanmaken') + '</button>' +
          '<div class="auth-msg" id="auth-msg-register"></div>' +
        '</div>' +

        // ── Wachtwoord vergeten sectie ──
        '<div class="auth-form-section" id="auth-section-forgot">' +
          '<p class="auth-back-link"><a href="#" onclick="TopBarAuth.switchTab(\'login\'); return false;">' + _t('auth:forgot.back', '← Terug naar inloggen') + '</a></p>' +
          '<p class="auth-forgot-intro">' + _t('auth:forgot.intro', 'Vul je e-mailadres in. Je ontvangt een link om een nieuw wachtwoord in te stellen.') + '</p>' +
          '<div class="auth-field">' +
            '<label for="auth-forgot-email">' + _t('auth:forgot.labelEmail', 'E-mailadres') + '</label>' +
            '<input type="email" id="auth-forgot-email" placeholder="' + _t('auth:login.placeholderEmail', 'naam@voorbeeld.nl') + '" autocomplete="email" />' +
          '</div>' +
          '<button class="auth-btn-primary" id="auth-btn-forgot" onclick="TopBarAuth.doForgotPassword()">' + _t('auth:forgot.btn', 'Resetlink versturen') + '</button>' +
          '<div class="auth-msg" id="auth-msg-forgot"></div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(root);
    _injectStyles();
  }

  // ---------------------------------------------------------------------------
  // _injectStyles() — ongewijzigd t.o.v. v2.3.1
  // ---------------------------------------------------------------------------
  function _injectStyles() {
    if (document.getElementById("auth-modal-styles")) return;

    var style = document.createElement("style");
    style.id = "auth-modal-styles";
    style.textContent =
      '#auth-modal-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;}' +
      '#auth-modal-box{display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:10px;padding:28px 32px 24px;width:100%;max-width:400px;z-index:1001;box-shadow:0 8px 32px rgba(0,0,0,0.18);font-family:Arial,sans-serif;}' +
      '#auth-modal-root.open #auth-modal-backdrop,#auth-modal-root.open #auth-modal-box{display:block;}' +
      '#auth-modal-close{position:absolute;top:12px;right:16px;background:none;border:none;font-size:1.4rem;cursor:pointer;color:#888;line-height:1;}' +
      '#auth-modal-close:hover{color:#333;}' +
      '.auth-tabs{display:flex;border-bottom:2px solid #e5e7eb;margin-bottom:20px;}' +
      '.auth-tab{padding:8px 20px;border:none;background:none;font-size:0.92rem;cursor:pointer;color:#666;border-bottom:2px solid transparent;margin-bottom:-2px;font-weight:bold;}' +
      '.auth-tab.active{color:#2563eb;border-bottom-color:#2563eb;}' +
      '.auth-form-section{display:none;}.auth-form-section.active{display:block;}' +
      '.auth-field{margin-bottom:14px;}' +
      '.auth-field label{display:block;font-size:0.88rem;font-weight:bold;margin-bottom:4px;color:#333;}' +
      '.auth-field input{width:100%;padding:8px 11px;font-size:0.95rem;border:1px solid #bbb;border-radius:6px;box-sizing:border-box;font-weight:normal;}' +
      '.auth-field input:focus{outline:none;border-color:#2563eb;}' +
      '.auth-btn-primary{width:100%;padding:9px;font-size:0.92rem;font-weight:bold;background:#2563eb;color:white;border:none;border-radius:6px;cursor:pointer;margin-top:4px;}' +
      '.auth-btn-primary:hover{background:#1d4ed8;}.auth-btn-primary:disabled{background:#93c5fd;cursor:default;}' +
      '.auth-msg{margin-top:12px;padding:9px 13px;border-radius:6px;font-size:0.88rem;display:none;}' +
      '.auth-msg.error{background:#fee2e2;color:#991b1b;display:block;}.auth-msg.success{background:#dcfce7;color:#166534;display:block;}' +
      '.auth-forgot-link{margin-top:10px;font-size:0.85rem;text-align:right;}' +
      '.auth-forgot-link a,.auth-back-link a{color:#2563eb;text-decoration:none;}' +
      '.auth-forgot-link a:hover,.auth-back-link a:hover{text-decoration:underline;}' +
      '.auth-back-link{font-size:0.85rem;margin-bottom:12px;}' +
      '.auth-forgot-intro{font-size:0.88rem;color:#555;margin-bottom:14px;line-height:1.5;}' +
      '#top-auth{display:flex;align-items:center;gap:8px;position:relative;}' +
      '.top-auth-login{color:#000;text-decoration:none;font-size:0.9rem;cursor:pointer;background:none;border:none;padding:0;font-family:Arial,sans-serif;font-weight:normal;}' +
      '.top-auth-login:hover{text-decoration:underline;}' +
      '.top-user-wrapper{position:relative;display:inline-block;}' +
      '.top-user-btn{display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:5px;background:none;border:1px solid transparent;cursor:pointer;font-size:0.88rem;font-weight:bold;color:#333;font-family:Arial,sans-serif;transition:background 0.15s,border-color 0.15s;white-space:nowrap;}' +
      '.top-user-btn:hover,.top-user-btn.open{background:#f3f4f6;border-color:#d1d5db;}' +
      '.top-user-chevron{font-size:0.65rem;color:#888;transition:transform 0.2s;display:inline-block;}' +
      '.top-user-btn.open .top-user-chevron{transform:rotate(180deg);}' +
      '.collab-badge{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;background:#dc2626;color:#fff;font-size:0.68rem;font-weight:bold;border-radius:9px;line-height:1;margin-left:2px;box-shadow:0 1px 3px rgba(220,38,38,0.4);animation:badge-pop 0.3s ease;}' +
      '@keyframes badge-pop{0%{transform:scale(0.5);opacity:0;}70%{transform:scale(1.15);}100%{transform:scale(1);opacity:1;}}' +
      '.top-user-dropdown{display:none;position:absolute;top:calc(100% + 6px);left:0;right:auto;min-width:190px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);z-index:2000;overflow:hidden;padding:4px 0;}' +
      '.top-user-dropdown.align-right{left:auto;right:0;}' +
      '.top-user-wrapper.open .top-user-dropdown{display:block;}' +
      '.top-user-dropdown-header{padding:8px 16px 6px;font-size:0.78rem;color:#9ca3af;border-bottom:1px solid #f3f4f6;margin-bottom:4px;}' +
      '.top-user-dropdown a,.top-user-dropdown button{display:flex;align-items:center;gap:9px;width:100%;padding:9px 16px;text-decoration:none;font-size:0.88rem;color:#374151;background:none;border:none;cursor:pointer;text-align:left;font-family:Arial,sans-serif;transition:background 0.1s;box-sizing:border-box;}' +
      '.top-user-dropdown a:hover,.top-user-dropdown button:hover{background:#f9fafb;color:#111827;}' +
      '.top-user-dropdown .dropdown-divider{border:none;border-top:1px solid #f3f4f6;margin:4px 0;}' +
      '.top-user-dropdown .btn-logout{color:#dc2626;}.top-user-dropdown .btn-logout:hover{background:#fef2f2;color:#b91c1c;}' +
      '.dropdown-collab-badge{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 4px;background:#dc2626;color:#fff;font-size:0.65rem;font-weight:bold;border-radius:8px;margin-left:auto;}';

    document.head.appendChild(style);
  }

  // ---------------------------------------------------------------------------
  // _fixDropdownPosition(dropdownEl) — ongewijzigd t.o.v. v2.3.1
  // ---------------------------------------------------------------------------
  function _fixDropdownPosition(dropdownEl) {
    dropdownEl.classList.remove("align-right");
    dropdownEl.style.left  = "";
    dropdownEl.style.right = "";

    requestAnimationFrame(function () {
      var rect      = dropdownEl.getBoundingClientRect();
      var viewportW = window.innerWidth || document.documentElement.clientWidth;
      var MARGE     = 8;
      if (rect.right > viewportW - MARGE) {
        dropdownEl.classList.add("align-right");
      } else if (rect.left < MARGE) {
        dropdownEl.style.left  = MARGE + "px";
        dropdownEl.style.right = "auto";
      }
    });
  }

  // ---------------------------------------------------------------------------
  // updateCollabBadge(userId, supabase) — ongewijzigd t.o.v. v2.3.1
  // ---------------------------------------------------------------------------
  async function updateCollabBadge(userId, supabase) {
    try {
      var laarstGezien = localStorage.getItem('collabLaatstGezien') || '2000-01-01T00:00:00.000Z';
      var boomIds = new Set();

      var eigenResult = await supabase.from('stambomen').select('id').eq('user_id', userId);
      if (eigenResult.data) eigenResult.data.forEach(function (b) { boomIds.add(b.id); });

      var gedeeldResult = await supabase.from('stamboom_gedeeld').select('stamboom_id').eq('viewer_id', userId);
      if (gedeeldResult.data) gedeeldResult.data.forEach(function (b) { boomIds.add(b.stamboom_id); });

      if (boomIds.size === 0) { _setBadgeTelling(0); return; }

      var result = await supabase
        .from('collab_messages')
        .select('id', { count: 'exact', head: true })
        .in('boom_id', Array.from(boomIds))
        .neq('user_id', userId)
        .gte('created_at', laarstGezien);

      _setBadgeTelling(result.count || 0);
    } catch (err) {
      console.warn('[topbar] updateCollabBadge fout (niet-fataal):', err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // _setBadgeTelling(telling)
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
    if (badge)         { badge.textContent = tekst;         badge.style.display = 'inline-flex'; }
    if (dropdownBadge) { dropdownBadge.textContent = tekst; dropdownBadge.style.display = 'inline-flex'; }
  }

  // ---------------------------------------------------------------------------
  // _renderTopBar(username)
  // Dropdown-links en login-knop via i18n keys.
  // ---------------------------------------------------------------------------
  function _renderTopBar(username) {
    var slot = document.getElementById("top-auth");
    if (!slot) return;

    if (username) {
      slot.innerHTML =
        '<div class="top-user-wrapper" id="top-user-wrapper">' +
          '<button class="top-user-btn" id="top-user-btn" aria-haspopup="true" aria-expanded="false">' +
            '\uD83D\uDC64 <span>' + _escHtml(username) + '</span>' +
            '<span class="collab-badge" id="collab-badge-knop" style="display:none;" title="' + _t('auth:topbar.unread', 'Ongelezen berichten in Samenwerken') + '"></span>' +
            '<span class="top-user-chevron">▼</span>' +
          '</button>' +
          '<div class="top-user-dropdown" role="menu" id="top-user-dropdown">' +
            '<div class="top-user-dropdown-header">' + _escHtml(username) + '</div>' +
            '<a href="/MyFamTreeCollab/account/account.html" role="menuitem">' + _t('auth:dropdown.account', '⚙️ Mijn Account') + '</a>' +
            '<a href="/MyFamTreeCollab/account/history.html" role="menuitem">' + _t('auth:dropdown.history', '📜 Versiegeschiedenis') + '</a>' +
            '<a href="/MyFamTreeCollab/stamboom/collab.html" role="menuitem">' +
              _t('auth:dropdown.collab', '💬 Samenwerken') +
              '<span class="dropdown-collab-badge" id="collab-badge-dropdown" style="display:none;"></span>' +
            '</a>' +
            '<hr class="dropdown-divider">' +
            '<button class="btn-logout" id="btn-dropdown-logout" role="menuitem">' + _t('auth:dropdown.logout', '🚪 Uitloggen') + '</button>' +
          '</div>' +
        '</div>';

      var wrapper  = document.getElementById("top-user-wrapper");
      var btn      = document.getElementById("top-user-btn");
      var dropdown = document.getElementById("top-user-dropdown");

      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var isOpen = wrapper.classList.toggle("open");
        btn.classList.toggle("open", isOpen);
        btn.setAttribute("aria-expanded", isOpen);
        if (isOpen) _fixDropdownPosition(dropdown);
      });

      document.getElementById("btn-dropdown-logout").addEventListener("click", async function () {
        _clearLocalData();
        await AuthModule.logout();
      });

    } else {
      // Login-knop — label via i18n
      slot.innerHTML =
        '<button class="top-auth-login" onclick="TopBarAuth.openModal()">' +
          _t('auth:topbar.loginBtn', 'Login') +
        '</button>';
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
    var wrapper = document.getElementById("top-user-wrapper");
    var btn     = document.getElementById("top-user-btn");
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
      var profileResult = await AuthModule.getProfile();
      if (profileResult.profile && profileResult.profile.username) return profileResult.profile.username;
    } catch (e) { /* profiel bestaat nog niet */ }
    var email = session.user.email || "";
    return email.split("@")[0] || _t('auth:fallbackUsername', 'Gebruiker'); // Fallback via i18n
  }

  // ---------------------------------------------------------------------------
  // Modal functies
  // ---------------------------------------------------------------------------
  function openModal() {
    _injectModal();
    switchTab("login");
    document.getElementById("auth-modal-root").classList.add("open");
    setTimeout(function () {
      var f = document.getElementById("auth-login-email");
      if (f) f.focus();
    }, 50);
  }

  function closeModal() {
    var root = document.getElementById("auth-modal-root");
    if (root) root.classList.remove("open");
    ["auth-msg-login", "auth-msg-register", "auth-msg-forgot"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.textContent = ""; el.className = "auth-msg"; }
    });
  }

  function switchTab(tab) {
    ["login", "register", "forgot"].forEach(function (name) {
      var s = document.getElementById("auth-section-" + name);
      if (s) s.classList.remove("active");
    });
    var target = document.getElementById("auth-section-" + tab);
    if (target) target.classList.add("active");
    var tabs = document.getElementById("auth-tabs");
    if (tabs) tabs.style.display = tab === "forgot" ? "none" : "flex";
    var lb = document.getElementById("tab-btn-login");
    var rb = document.getElementById("tab-btn-register");
    if (lb) lb.classList.toggle("active", tab === "login");
    if (rb) rb.classList.toggle("active", tab === "register");
  }

  function _showMsg(id, text, type) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className   = "auth-msg " + type;
  }

  async function doLogin() {
    var email    = document.getElementById("auth-login-email").value.trim();
    var password = document.getElementById("auth-login-password").value;
    var btn      = document.getElementById("auth-btn-login");
    btn.disabled = true;
    btn.textContent = _t('auth:busy', 'Bezig…'); // Vertaald
    var result = await AuthModule.login(email, password);
    btn.disabled = false;
    btn.textContent = _t('auth:login.btn', 'Inloggen'); // Vertaald
    if (result.error) { _showMsg("auth-msg-login", result.error, "error"); return; }
    _showMsg("auth-msg-login", _t('auth:login.success', 'Ingelogd!'), "success"); // Vertaald
    setTimeout(function () { closeModal(); }, 800);
  }

  async function doRegister() {
    var username  = document.getElementById("auth-reg-username").value.trim();
    var email     = document.getElementById("auth-reg-email").value.trim();
    var password  = document.getElementById("auth-reg-password").value;
    var password2 = document.getElementById("auth-reg-password2").value;
    var btn       = document.getElementById("auth-btn-register");
    if (password !== password2) {
      _showMsg("auth-msg-register", _t('auth:register.mismatch', 'Wachtwoorden komen niet overeen.'), "error");
      return;
    }
    btn.disabled = true;
    btn.textContent = _t('auth:busy', 'Bezig…'); // Vertaald
    var result = await AuthModule.register(email, password, username);
    btn.disabled = false;
    btn.textContent = _t('auth:register.btn', 'Account aanmaken'); // Vertaald
    if (result.error) { _showMsg("auth-msg-register", result.error, "error"); return; }
    switchTab("login");
    _showMsg("auth-msg-login", _t('auth:register.success', 'Account aangemaakt! Controleer je e-mail en bevestig je adres, log daarna in.'), "success");
  }

  async function doForgotPassword() {
    var email = document.getElementById("auth-forgot-email").value.trim();
    var btn   = document.getElementById("auth-btn-forgot");
    btn.disabled = true;
    btn.textContent = _t('auth:busy', 'Bezig…'); // Vertaald
    var result = await AuthModule.resetPassword(email);
    btn.disabled = false;
    btn.textContent = _t('auth:forgot.btn', 'Resetlink versturen'); // Vertaald
    if (result.error) { _showMsg("auth-msg-forgot", result.error, "error"); return; }
    _showMsg("auth-msg-forgot", _t('auth:forgot.success', 'Als dit e-mailadres bekend is, ontvang je een resetlink. Controleer ook je spammap.'), "success");
  }

  // ---------------------------------------------------------------------------
  // init()
  // Laadt de auth namespace EERST zodat _injectModal() en _renderTopBar()
  // de vertaalde strings kunnen ophalen via _t().
  // ---------------------------------------------------------------------------
  async function init() {

    // Stap 1: zorg dat i18nModule en de auth namespace klaar zijn.
    // Zonder dit toont _injectModal() ruwe keys (bijv. "tabs.login").
    if (window.i18nModule && typeof window.i18nModule.init === 'function') {
      try {
        await window.i18nModule.init();                  // i18next initialiseren (idempotent)
        await window.i18nModule.loadNamespace('auth');   // auth namespace inladen
      } catch (e) {
        console.warn('[topbar] i18n init mislukt (niet-fataal):', e);
      }
    }

    // Stap 2: modal injecteren — nu zijn de vertaalde strings beschikbaar
    _injectModal();

    var session = await AuthModule.getSession();

    if (session) {
      _currentUserId = session.user.id;
      var username = await _getUsernameFromSession(session);
      _renderTopBar(username);

      var supabase = AuthModule.getClient();
      updateCollabBadge(session.user.id, supabase);

      try {
        var profileResult = await AuthModule.getProfile();
        _showAdminDropdown(profileResult.profile && profileResult.profile.is_admin === true);
      } catch (e) { _showAdminDropdown(false); }

    } else {
      _renderTopBar(null);
      _showAdminDropdown(false);
    }

    AuthModule.onAuthChange(async function (event, session) {
      if (event === "SIGNED_IN" && session) {
        var inkomendUserId = session.user.id;
        if (_currentUserId && _currentUserId !== inkomendUserId) _clearLocalData();
        _currentUserId = inkomendUserId;
      }
      if (event === "SIGNED_OUT") { _clearLocalData(); _currentUserId = null; }

      if (session) {
        var username = await _getUsernameFromSession(session);
        _renderTopBar(username);
        var supabase = AuthModule.getClient();
        updateCollabBadge(session.user.id, supabase);
        try {
          var profileResult = await AuthModule.getProfile();
          _showAdminDropdown(profileResult.profile && profileResult.profile.is_admin === true);
        } catch (e) { _showAdminDropdown(false); }
      } else {
        _renderTopBar(null);
        _showAdminDropdown(false);
      }
    });

    document.addEventListener("click", function () { _closeUserDropdown(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { _closeUserDropdown(); closeModal(); }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // ---------------------------------------------------------------------------
  // Publieke API
  // ---------------------------------------------------------------------------
  window.TopBarAuth = {
    openModal:  openModal,
    closeModal: closeModal,
    switchTab:  switchTab,
    doLogin:    doLogin,
    doRegister: doRegister,
    doForgotPassword: doForgotPassword,
    refreshCollabBadge: function () {
      if (!_currentUserId) return;
      updateCollabBadge(_currentUserId, AuthModule.getClient());
    }
  };

})();
