// js/accountbeheer.js — v1.1.0 — Admin accountbeheer logica
// Verantwoordelijk voor: gebruikers laden, tier wijzigen, verwijderen, stats tonen
// Vereist: window.AuthModule (auth.js), Supabase SDK, topbar.js (sessie herstel)
// Toegang: alleen admin — init() controleert tier via AuthModule.getTier()
//
// v1.1.0: last_sign_in_at verwijderd (kwam uit auth.users — niet meer toegestaan)
//         email wordt nu geladen uit public.profiles (veilig)
//         admin_users view updated: bevat nu email kolom vanuit profiles
// v1.0.8: automatische refresh na laden (setTimeout 1.5s)
// v1.0.7: eigen topbar en logoutLink verwijderd
// v1.0.6: init() gebruikt onAuthStateChange + directe sessiecheck als fallback
// v1.0.5: onAuthStateChange patroon voor sessie herstel
// v1.0.4: saveTier() en deleteUser() gebruiken RPC (SECURITY DEFINER)

'use strict';

const sb = window.AuthModule.getClient(); // Supabase client via AuthModule

let allUsers      = []; // Alle geladen gebruikers
let filteredUsers = []; // Gefilterde subset voor weergave
let deleteTarget  = null; // Gebruiker die verwijderd wordt

// DOM referenties
const tbody        = document.getElementById('usersTbody');
const searchInput  = document.getElementById('searchInput');
const tierFilter   = document.getElementById('tierFilter');
const lastRefresh  = document.getElementById('lastRefresh');
const btnRefresh   = document.getElementById('btnRefresh');
const toast        = document.getElementById('toast');
const modalOverlay = document.getElementById('modalOverlay');
const modalName    = document.getElementById('modalName');
const btnCancel    = document.getElementById('btnCancel');
const btnConfirm   = document.getElementById('btnConfirm');
const statTotal    = document.getElementById('statTotal');
const statViewer   = document.getElementById('statViewer');
const statEditor   = document.getElementById('statEditor');
const statOwner    = document.getElementById('statOwner');
const statAdmin    = document.getElementById('statAdmin');

// ---------------------------------------------------------------------------
// showToast(msg, isError)
// Toont een tijdelijke notificatie onderaan het scherm
// ---------------------------------------------------------------------------
function showToast(msg, isError = false) {
  toast.textContent = msg; // Bericht instellen
  toast.className = 'show' + (isError ? ' error' : ''); // Klasse instellen
  clearTimeout(toast._timer); // Vorige timer annuleren
  toast._timer = setTimeout(() => { toast.className = ''; }, 3000); // Na 3s verbergen
}

// ---------------------------------------------------------------------------
// updateStats(users)
// Berekent en toont aantallen per tier in de stat-kaarten
// ---------------------------------------------------------------------------
function updateStats(users) {
  statTotal.textContent  = users.length; // Totaal aantal gebruikers
  statViewer.textContent = users.filter(u => u.tier === 'viewer').length; // Aantal viewers
  statEditor.textContent = users.filter(u => u.tier === 'editor').length; // Aantal editors
  statOwner.textContent  = users.filter(u => u.tier === 'owner').length;  // Aantal owners
  statAdmin.textContent  = users.filter(u => u.tier === 'admin').length;  // Aantal admins
}

// ---------------------------------------------------------------------------
// fmtDate(iso)
// Formatteert een ISO datumstring naar Nederlands formaat (dd-mm-yyyy)
// ---------------------------------------------------------------------------
function fmtDate(iso) {
  if (!iso) return '—'; // Geen datum beschikbaar
  const d = new Date(iso); // Datum object aanmaken
  return d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }); // Nederlands formaat
}

// ---------------------------------------------------------------------------
// renderTable(users)
// Genereert tabelrijen voor de gegeven gebruikerslijst
// ---------------------------------------------------------------------------
function renderTable(users) {
  tbody.innerHTML = ''; // Tabel leegmaken
  if (users.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">Geen gebruikers gevonden.</td></tr>'; // Lege staat
    return;
  }
  users.forEach(u => {
    const tr = document.createElement('tr'); // Nieuwe rij aanmaken
    const tierOptions = ['viewer', 'editor', 'owner', 'admin']
      .map(t => `<option value="${t}" ${t === u.tier ? 'selected' : ''}>${t}</option>`) // Dropdown opties
      .join('');
    tr.innerHTML = `
      <td class="col-email">${u.email || '—'}</td>
      <td><span class="tier-badge ${u.tier}">${u.tier}</span></td>
      <td><select class="tier-select" data-uid="${u.id}">${tierOptions}</select></td>
      <td>${fmtDate(u.created_at)}</td>
      <td>
        <div class="row-actions">
          <button class="btn-action btn-save-tier" data-uid="${u.id}">Opslaan</button>
          <button class="btn-action danger btn-delete" data-uid="${u.id}" data-email="${u.email}">Verwijderen</button>
        </div>
      </td>`;
    tbody.appendChild(tr); // Rij toevoegen aan de tabel
  });
  bindRowEvents(); // Knoppen koppelen aan events
}

// ---------------------------------------------------------------------------
// bindRowEvents()
// Koppelt click-events aan opslaan- en verwijderknoppen per rij
// ---------------------------------------------------------------------------
function bindRowEvents() {
  document.querySelectorAll('.btn-save-tier').forEach(btn => {
    btn.addEventListener('click', () => {
      const uid = btn.dataset.uid; // Gebruikers-ID ophalen
      const sel = document.querySelector(`.tier-select[data-uid="${uid}"]`); // Dropdown ophalen
      saveTier(uid, sel.value); // Tier opslaan
    });
  });
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteTarget = { id: btn.dataset.uid, email: btn.dataset.email }; // Doelgebruiker instellen
      modalName.textContent = deleteTarget.email; // Naam in modal tonen
      modalOverlay.classList.add('open'); // Modal openen
    });
  });
}

// ---------------------------------------------------------------------------
// loadUsers()
// Haalt alle gebruikers op uit de admin_users view en rendert de tabel
// ---------------------------------------------------------------------------
async function loadUsers() {
  tbody.innerHTML = '<tr class="loading-row"><td colspan="5">Laden...</td></tr>'; // Laad indicator
  try {
    const { data: profiles, error } = await sb
      .from('admin_users')
      .select('id, username, email, tier, created_at') // email komt nu uit profiles (veilig)
      .order('created_at', { ascending: false }); // Nieuwste eerst
    if (error) throw error;
    allUsers      = profiles || []; // Alle gebruikers opslaan
    filteredUsers = [...allUsers];  // Gefilterde lijst initialiseren
    updateStats(allUsers);          // Statistieken bijwerken
    renderTable(filteredUsers);     // Tabel renderen
    lastRefresh.textContent = 'Bijgewerkt: ' + new Date().toLocaleTimeString('nl-NL'); // Tijdstempel
  } catch (err) {
    console.error('[accountbeheer] loadUsers fout:', err);
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Fout bij laden: ${err.message}</td></tr>`; // Foutmelding
    showToast('Laden mislukt: ' + err.message, true);
  }
}

// ---------------------------------------------------------------------------
// saveTier(uid, newTier)
// Wijzigt de tier van een gebruiker via een beveiligde RPC call
// ---------------------------------------------------------------------------
async function saveTier(uid, newTier) {
  try {
    const { error } = await sb.rpc('update_user_tier', { target_id: uid, new_tier: newTier }); // RPC aanroepen
    if (error) throw error;
    const user = allUsers.find(u => u.id === uid); // Gebruiker opzoeken in lokale lijst
    if (user) user.tier = newTier; // Lokaal bijwerken
    updateStats(allUsers);     // Statistieken bijwerken
    renderTable(filteredUsers); // Tabel opnieuw renderen
    showToast(`Tier bijgewerkt naar "${newTier}"`); // Bevestiging tonen
  } catch (err) {
    console.error('[accountbeheer] saveTier fout:', err);
    showToast('Opslaan mislukt: ' + err.message, true);
  }
}

// ---------------------------------------------------------------------------
// deleteUser(uid)
// Verwijdert een gebruiker via een beveiligde RPC call
// ---------------------------------------------------------------------------
async function deleteUser(uid) {
  try {
    const { error } = await sb.rpc('delete_user_profile', { target_id: uid }); // RPC aanroepen
    if (error) throw error;
    allUsers      = allUsers.filter(u => u.id !== uid);      // Uit lokale lijst verwijderen
    filteredUsers = filteredUsers.filter(u => u.id !== uid); // Uit gefilterde lijst verwijderen
    updateStats(allUsers);      // Statistieken bijwerken
    renderTable(filteredUsers); // Tabel opnieuw renderen
    showToast('Gebruiker verwijderd.'); // Bevestiging tonen
  } catch (err) {
    console.error('[accountbeheer] deleteUser fout:', err);
    showToast('Verwijderen mislukt: ' + err.message, true);
  }
}

// ---------------------------------------------------------------------------
// applyFilters()
// Filtert gebruikers op zoekterm en tier, rendert de gefilterde tabel
// ---------------------------------------------------------------------------
function applyFilters() {
  const q    = searchInput.value.trim().toLowerCase(); // Zoekterm ophalen
  const tier = tierFilter.value; // Geselecteerde tier ophalen
  filteredUsers = allUsers.filter(u => {
    const matchQ    = !q || (u.email || '').toLowerCase().includes(q)
                         || (u.username || '').toLowerCase().includes(q); // Zoek op email of username
    const matchTier = tier === 'all' || u.tier === tier; // Filter op tier
    return matchQ && matchTier;
  });
  renderTable(filteredUsers); // Gefilterde tabel renderen
}

// ---------------------------------------------------------------------------
// Event listeners
// ---------------------------------------------------------------------------
searchInput.addEventListener('input', applyFilters);   // Zoeken bij typen
tierFilter.addEventListener('change', applyFilters);   // Filteren bij selectie
btnRefresh.addEventListener('click', loadUsers);        // Handmatig vernieuwen

btnCancel.addEventListener('click', () => {
  modalOverlay.classList.remove('open'); // Modal sluiten
  deleteTarget = null; // Doelgebruiker resetten
});

btnConfirm.addEventListener('click', async () => {
  if (!deleteTarget) return;
  modalOverlay.classList.remove('open'); // Modal sluiten
  await deleteUser(deleteTarget.id);     // Gebruiker verwijderen
  deleteTarget = null; // Doelgebruiker resetten
});

modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove('open'); // Modal sluiten bij klik buiten de box
    deleteTarget = null;
  }
});

// ---------------------------------------------------------------------------
// init()
// Controleert of de ingelogde gebruiker admin is, laadt daarna de gebruikerslijst
// ---------------------------------------------------------------------------
async function init() {
  const client = window.AuthModule.getClient(); // Supabase client ophalen
  let geladen = false; // Voorkomt dubbel laden

  client.auth.onAuthStateChange(async (event, session) => {
    if (geladen) return; // Al geladen, niets doen
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      if (!session) return; // Geen sessie, niets doen
      geladen = true;
      const tier = await window.AuthModule.getTier(); // Tier ophalen uit profiles (veilig)
      if (tier !== 'admin') { window.location.href = '/MyFamTreeCollab/index.html'; return; } // Geen admin → redirect
      await loadUsers(); // Gebruikers laden
      setTimeout(loadUsers, 1500); // Nogmaals laden na 1.5s (sessie volledig hersteld)
    }
  });

  const { data } = await client.auth.getSession(); // Directe sessiecheck als fallback
  if (data.session && !geladen) {
    geladen = true;
    const tier = await window.AuthModule.getTier(); // Tier ophalen uit profiles (veilig)
    if (tier !== 'admin') { window.location.href = '/MyFamTreeCollab/index.html'; return; } // Geen admin → redirect
    await loadUsers(); // Gebruikers laden
    setTimeout(loadUsers, 1500); // Nogmaals laden na 1.5s
  }
}

document.addEventListener('DOMContentLoaded', init); // Init starten na laden van de DOM
