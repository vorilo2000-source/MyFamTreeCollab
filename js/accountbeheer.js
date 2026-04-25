// js/accountbeheer.js — v1.0.6 — Admin accountbeheer logica
// Verantwoordelijk voor: gebruikers laden, tier wijzigen, verwijderen, stats tonen
// Vereist: window.AuthModule (auth.js), Supabase SDK geladen via topbar/auth
// Toegang: alleen admin — init() controleert tier via AuthModule.getTier()
//
// Nieuw in v1.0.4:
// - saveTier()  gebruikt RPC 'update_user_tier' i.p.v. directe tabel update (RLS omzeiling)
// - deleteUser() gebruikt RPC 'delete_user_profile' i.p.v. directe tabel delete (RLS omzeiling)

'use strict'; // strikte modus — voorkomt stille fouten

// ─── Supabase client ophalen ───────────────────────────────────────────────
const sb = window.AuthModule.getClient(); // Supabase client via AuthModule

// ─── Staat ────────────────────────────────────────────────────────────────
let allUsers      = []; // volledige gebruikerslijst (gecached na laden)
let filteredUsers = []; // gefilterde weergave (zoek + tier-filter)
let deleteTarget  = null; // user-object dat wacht op bevestiging

// ─── DOM-referenties ───────────────────────────────────────────────────────
const tbody        = document.getElementById('usersTbody');   // tabel body
const searchInput  = document.getElementById('searchInput');  // zoekbalk
const tierFilter   = document.getElementById('tierFilter');   // tier-dropdown filter
const lastRefresh  = document.getElementById('lastRefresh');  // timestamp label
const btnRefresh   = document.getElementById('btnRefresh');   // vernieuwen knop
const toast        = document.getElementById('toast');        // toast notificatie
const modalOverlay = document.getElementById('modalOverlay'); // bevestigingsmodal
const modalName    = document.getElementById('modalName');    // naam in modal tekst
const btnCancel    = document.getElementById('btnCancel');    // annuleer knop modal
const btnConfirm   = document.getElementById('btnConfirm');   // bevestig verwijder knop

// ─── Statistiek-elementen ──────────────────────────────────────────────────
const statTotal  = document.getElementById('statTotal');  // totaal gebruikers
const statViewer = document.getElementById('statViewer'); // aantal viewers
const statEditor = document.getElementById('statEditor'); // aantal editors
const statOwner  = document.getElementById('statOwner');  // aantal owners
const statAdmin  = document.getElementById('statAdmin');  // aantal admins

// ─── Toast helper ──────────────────────────────────────────────────────────
function showToast(msg, isError = false) {
  toast.textContent = msg;                                        // bericht instellen
  toast.className = 'show' + (isError ? ' error' : '');          // klasse toepassen
  clearTimeout(toast._timer);                                     // vorige timer annuleren
  toast._timer = setTimeout(() => { toast.className = ''; }, 3000); // verbergen na 3s
}

// ─── Statistieken bijwerken ────────────────────────────────────────────────
function updateStats(users) {
  statTotal.textContent  = users.length;                                   // totaal
  statViewer.textContent = users.filter(u => u.tier === 'viewer').length;  // viewers
  statEditor.textContent = users.filter(u => u.tier === 'editor').length;  // editors
  statOwner.textContent  = users.filter(u => u.tier === 'owner').length;   // owners
  statAdmin.textContent  = users.filter(u => u.tier === 'admin').length;   // admins
}

// ─── Datum formatteren ────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';                     // ontbrekende datum
  const d = new Date(iso);                  // Date object aanmaken
  return d.toLocaleDateString('nl-NL', {    // Nederlandse notatie
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

// ─── Tabel renderen ───────────────────────────────────────────────────────
function renderTable(users) {
  tbody.innerHTML = ''; // tabel leegmaken

  if (users.length === 0) { // geen resultaten
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Geen gebruikers gevonden.</td></tr>';
    return;
  }

  users.forEach(u => { // elke gebruiker als tabelrij toevoegen
    const tr = document.createElement('tr'); // nieuwe rij

    // Tier-opties voor de inline dropdown
    const tierOptions = ['viewer', 'editor', 'owner', 'admin']
      .map(t => `<option value="${t}" ${t === u.tier ? 'selected' : ''}>${t}</option>`)
      .join('');

    tr.innerHTML = `
      <td class="col-email">${u.email || '—'}</td>
      <td><span class="tier-badge ${u.tier}">${u.tier}</span></td>
      <td>
        <select class="tier-select" data-uid="${u.id}" aria-label="Tier wijzigen">
          ${tierOptions}
        </select>
      </td>
      <td>${fmtDate(u.created_at)}</td>
      <td>${fmtDate(u.last_sign_in_at)}</td>
      <td>
        <div class="row-actions">
          <button class="btn-action btn-save-tier" data-uid="${u.id}">Opslaan</button>
          <button class="btn-action danger btn-delete" data-uid="${u.id}" data-email="${u.email}">Verwijderen</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr); // rij toevoegen aan tabel
  });

  bindRowEvents(); // event listeners koppelen aan de nieuwe rijen
}

// ─── Rij-events koppelen ──────────────────────────────────────────────────
function bindRowEvents() {
  // Opslaan-knoppen: tier wijzigen via RPC
  document.querySelectorAll('.btn-save-tier').forEach(btn => {
    btn.addEventListener('click', () => {
      const uid = btn.dataset.uid;                                          // gebruiker ID
      const sel = document.querySelector(`.tier-select[data-uid="${uid}"]`); // dropdown
      saveTier(uid, sel.value);                                             // tier opslaan
    });
  });

  // Verwijder-knoppen: bevestigingsmodal tonen
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteTarget = { id: btn.dataset.uid, email: btn.dataset.email }; // target bewaren
      modalName.textContent = deleteTarget.email;                        // naam in modal
      modalOverlay.classList.add('open');                                // modal openen
    });
  });
}

// ─── Gebruikers laden ─────────────────────────────────────────────────────
async function loadUsers() {
  tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Laden...</td></tr>'; // laadtekst

  try {
    // Lezen uit admin_users view — join van profiles + auth.users voor email
    const { data: profiles, error } = await sb
      .from('admin_users')                                           // view
      .select('id, username, tier, created_at, email, last_sign_in_at') // kolommen
      .order('created_at', { ascending: false });                    // nieuwste eerst

    if (error) throw error; // fout doorgooien

    allUsers      = profiles || [];    // lijst bewaren
    filteredUsers = [...allUsers];     // gefilterde lijst initialiseren

    updateStats(allUsers);             // statistieken bijwerken
    renderTable(filteredUsers);        // tabel vullen

    lastRefresh.textContent = 'Bijgewerkt: ' + new Date().toLocaleTimeString('nl-NL'); // timestamp

  } catch (err) {
    console.error('[accountbeheer] loadUsers fout:', err);
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Fout bij laden: ${err.message}</td></tr>`;
    showToast('Laden mislukt: ' + err.message, true);
  }
}

// ─── Tier opslaan via RPC ─────────────────────────────────────────────────
async function saveTier(uid, newTier) {
  try {
    // RPC 'update_user_tier' — SECURITY DEFINER omzeilt RLS
    const { error } = await sb.rpc('update_user_tier', {
      target_id: uid,    // UUID van de te wijzigen gebruiker
      new_tier:  newTier // nieuwe tier waarde
    });

    if (error) throw error; // fout doorgooien

    // Lokale cache bijwerken zodat tabel direct klopt zonder herlaad
    const user = allUsers.find(u => u.id === uid); // gebruiker zoeken in cache
    if (user) user.tier = newTier;                  // tier bijwerken in cache

    updateStats(allUsers);         // statistieken opnieuw berekenen
    renderTable(filteredUsers);    // tabel opnieuw renderen

    showToast(`Tier bijgewerkt naar "${newTier}"`); // bevestiging

  } catch (err) {
    console.error('[accountbeheer] saveTier fout:', err);
    showToast('Opslaan mislukt: ' + err.message, true);
  }
}

// ─── Gebruiker verwijderen via RPC ────────────────────────────────────────
async function deleteUser(uid) {
  try {
    // RPC 'delete_user_profile' — SECURITY DEFINER omzeilt RLS
    const { error } = await sb.rpc('delete_user_profile', {
      target_id: uid // UUID van te verwijderen gebruiker
    });

    if (error) throw error; // fout doorgooien

    // Gebruiker uit lokale cache verwijderen
    allUsers      = allUsers.filter(u => u.id !== uid);      // uit volledige lijst
    filteredUsers = filteredUsers.filter(u => u.id !== uid); // uit gefilterde lijst

    updateStats(allUsers);      // statistieken bijwerken
    renderTable(filteredUsers); // tabel opnieuw renderen

    showToast('Gebruiker verwijderd.'); // bevestiging

  } catch (err) {
    console.error('[accountbeheer] deleteUser fout:', err);
    showToast('Verwijderen mislukt: ' + err.message, true);
  }
}

// ─── Zoeken & filteren ────────────────────────────────────────────────────
function applyFilters() {
  const q    = searchInput.value.trim().toLowerCase(); // zoekterm
  const tier = tierFilter.value;                       // geselecteerde tier

  filteredUsers = allUsers.filter(u => {
    const matchQ    = !q || (u.email || '').toLowerCase().includes(q)    // e-mail match
                         || (u.username || '').toLowerCase().includes(q); // gebruikersnaam match
    const matchTier = tier === 'all' || u.tier === tier;                  // tier match
    return matchQ && matchTier;
  });

  renderTable(filteredUsers); // gefilterde tabel tonen
}

// ─── Event listeners ──────────────────────────────────────────────────────
searchInput.addEventListener('input', applyFilters);   // live zoeken
tierFilter.addEventListener('change', applyFilters);   // tier filter
btnRefresh.addEventListener('click', loadUsers);       // vernieuwen

btnCancel.addEventListener('click', () => {            // modal annuleren
  modalOverlay.classList.remove('open');
  deleteTarget = null;
});

btnConfirm.addEventListener('click', async () => {     // modal bevestigen
  if (!deleteTarget) return;
  modalOverlay.classList.remove('open');
  await deleteUser(deleteTarget.id);
  deleteTarget = null;
});

modalOverlay.addEventListener('click', e => {          // klik buiten modal
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove('open');
    deleteTarget = null;
  }
});

document.getElementById('logoutLink').addEventListener('click', async e => {
  e.preventDefault();                                  // standaard navigatie voorkomen
  await window.AuthModule.logout();                    // uitloggen
  window.location.href = '../index.html';              // terug naar home
});

// ─── Init ─────────────────────────────────────────────────────────────────
async function init() {
  // Wacht tot Supabase sessie hersteld is via onAuthStateChange
  const client = window.AuthModule.getClient(); // client ophalen

  client.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') { // sessie beschikbaar
      if (!session) {                                            // geen sessie — redirect
        window.location.href = '../index.html';
        return;
      }
      const tier = await window.AuthModule.getTier();            // tier ophalen
      if (tier !== 'admin') {                                    // niet-admin redirect
        window.location.href = '../index.html';
        return;
      }
      await loadUsers();                                         // gebruikers laden
    }
  });
}

document.addEventListener('DOMContentLoaded', init); // starten na DOM laden
