// js/accountbeheer.js — v1.0.8 — Admin accountbeheer logica
// Verantwoordelijk voor: gebruikers laden, tier wijzigen, verwijderen, stats tonen
// Vereist: window.AuthModule (auth.js), Supabase SDK, topbar.js (sessie herstel)
// Toegang: alleen admin — init() controleert tier via AuthModule.getTier()
//
// v1.0.8: automatische refresh na laden (setTimeout 1.5s)
// v1.0.7: eigen topbar en logoutLink verwijderd
// v1.0.6: init() gebruikt onAuthStateChange + directe sessiecheck als fallback
// v1.0.5: onAuthStateChange patroon voor sessie herstel
// v1.0.4: saveTier() en deleteUser() gebruiken RPC (SECURITY DEFINER)

'use strict';

const sb = window.AuthModule.getClient();

let allUsers      = [];
let filteredUsers = [];
let deleteTarget  = null;

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

function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.className = 'show' + (isError ? ' error' : '');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = ''; }, 3000);
}

function updateStats(users) {
  statTotal.textContent  = users.length;
  statViewer.textContent = users.filter(u => u.tier === 'viewer').length;
  statEditor.textContent = users.filter(u => u.tier === 'editor').length;
  statOwner.textContent  = users.filter(u => u.tier === 'owner').length;
  statAdmin.textContent  = users.filter(u => u.tier === 'admin').length;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function renderTable(users) {
  tbody.innerHTML = '';
  if (users.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Geen gebruikers gevonden.</td></tr>';
    return;
  }
  users.forEach(u => {
    const tr = document.createElement('tr');
    const tierOptions = ['viewer', 'editor', 'owner', 'admin']
      .map(t => `<option value="${t}" ${t === u.tier ? 'selected' : ''}>${t}</option>`)
      .join('');
    tr.innerHTML = `
      <td class="col-email">${u.email || '—'}</td>
      <td><span class="tier-badge ${u.tier}">${u.tier}</span></td>
      <td><select class="tier-select" data-uid="${u.id}">${tierOptions}</select></td>
      <td>${fmtDate(u.created_at)}</td>
      <td>${fmtDate(u.last_sign_in_at)}</td>
      <td>
        <div class="row-actions">
          <button class="btn-action btn-save-tier" data-uid="${u.id}">Opslaan</button>
          <button class="btn-action danger btn-delete" data-uid="${u.id}" data-email="${u.email}">Verwijderen</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
  bindRowEvents();
}

function bindRowEvents() {
  document.querySelectorAll('.btn-save-tier').forEach(btn => {
    btn.addEventListener('click', () => {
      const uid = btn.dataset.uid;
      const sel = document.querySelector(`.tier-select[data-uid="${uid}"]`);
      saveTier(uid, sel.value);
    });
  });
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteTarget = { id: btn.dataset.uid, email: btn.dataset.email };
      modalName.textContent = deleteTarget.email;
      modalOverlay.classList.add('open');
    });
  });
}

async function loadUsers() {
  tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Laden...</td></tr>';
  try {
    const { data: profiles, error } = await sb
      .from('admin_users')
      .select('id, username, tier, created_at, email, last_sign_in_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    allUsers      = profiles || [];
    filteredUsers = [...allUsers];
    updateStats(allUsers);
    renderTable(filteredUsers);
    lastRefresh.textContent = 'Bijgewerkt: ' + new Date().toLocaleTimeString('nl-NL');
  } catch (err) {
    console.error('[accountbeheer] loadUsers fout:', err);
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Fout bij laden: ${err.message}</td></tr>`;
    showToast('Laden mislukt: ' + err.message, true);
  }
}

async function saveTier(uid, newTier) {
  try {
    const { error } = await sb.rpc('update_user_tier', { target_id: uid, new_tier: newTier });
    if (error) throw error;
    const user = allUsers.find(u => u.id === uid);
    if (user) user.tier = newTier;
    updateStats(allUsers);
    renderTable(filteredUsers);
    showToast(`Tier bijgewerkt naar "${newTier}"`);
  } catch (err) {
    console.error('[accountbeheer] saveTier fout:', err);
    showToast('Opslaan mislukt: ' + err.message, true);
  }
}

async function deleteUser(uid) {
  try {
    const { error } = await sb.rpc('delete_user_profile', { target_id: uid });
    if (error) throw error;
    allUsers      = allUsers.filter(u => u.id !== uid);
    filteredUsers = filteredUsers.filter(u => u.id !== uid);
    updateStats(allUsers);
    renderTable(filteredUsers);
    showToast('Gebruiker verwijderd.');
  } catch (err) {
    console.error('[accountbeheer] deleteUser fout:', err);
    showToast('Verwijderen mislukt: ' + err.message, true);
  }
}

function applyFilters() {
  const q    = searchInput.value.trim().toLowerCase();
  const tier = tierFilter.value;
  filteredUsers = allUsers.filter(u => {
    const matchQ    = !q || (u.email || '').toLowerCase().includes(q)
                         || (u.username || '').toLowerCase().includes(q);
    const matchTier = tier === 'all' || u.tier === tier;
    return matchQ && matchTier;
  });
  renderTable(filteredUsers);
}

searchInput.addEventListener('input', applyFilters);
tierFilter.addEventListener('change', applyFilters);
btnRefresh.addEventListener('click', loadUsers);

btnCancel.addEventListener('click', () => {
  modalOverlay.classList.remove('open');
  deleteTarget = null;
});

btnConfirm.addEventListener('click', async () => {
  if (!deleteTarget) return;
  modalOverlay.classList.remove('open');
  await deleteUser(deleteTarget.id);
  deleteTarget = null;
});

modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove('open');
    deleteTarget = null;
  }
});

async function init() {
  const client = window.AuthModule.getClient();
  let geladen = false;

  client.auth.onAuthStateChange(async (event, session) => {
    if (geladen) return;
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      if (!session) return;
      geladen = true;
      const tier = await window.AuthModule.getTier();
      if (tier !== 'admin') { window.location.href = '/MyFamTreeCollab/index.html'; return; }
      await loadUsers();
      setTimeout(loadUsers, 1500);
    }
  });

  const { data } = await client.auth.getSession();
  if (data.session && !geladen) {
    geladen = true;
    const tier = await window.AuthModule.getTier();
    if (tier !== 'admin') { window.location.href = '/MyFamTreeCollab/index.html'; return; }
    await loadUsers();
    setTimeout(loadUsers, 1500);
  }
}

document.addEventListener('DOMContentLoaded', init);
