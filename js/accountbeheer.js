// js/accountbeheer.js — v1.0.5 — Admin accountbeheer logica
// Verantwoordelijk voor: gebruikers laden, tier wijzigen, verwijderen, stats tonen
// Vereist: window.AuthModule (auth.js), Supabase SDK geladen via topbar/auth
// Toegang: alleen admin — AccessGuard blokkeert andere rollen voor de pagina laadt

'use strict'; // strikte modus — voorkomt stille fouten

// ─── Supabase client ophalen ───────────────────────────────────────────────
// auth.js stelt window._supabase in na initialisatie
const sb = window.AuthModule.getClient(); // Supabase client via AuthModule

// ─── Staat ────────────────────────────────────────────────────────────────
let allUsers   = [];   // volledige gebruikerslijst (gecached na laden)
let filteredUsers = []; // gefilterde weergave (zoek + tier-filter)
let deleteTarget  = null; // user-object dat wacht op bevestiging

// ─── DOM-referenties ───────────────────────────────────────────────────────
const tbody        = document.getElementById('usersTbody');      // tabel body
const searchInput  = document.getElementById('searchInput');     // zoekbalk
const tierFilter   = document.getElementById('tierFilter');      // tier-dropdown filter
const lastRefresh  = document.getElementById('lastRefresh');     // timestamp label
const btnRefresh   = document.getElementById('btnRefresh');      // vernieuwen knop
const toast        = document.getElementById('toast');           // toast notificatie
const modalOverlay = document.getElementById('modalOverlay');    // bevestigingsmodal
const modalName    = document.getElementById('modalName');       // naam in modal tekst
const btnCancel    = document.getElementById('btnCancel');       // annuleer knop modal
const btnConfirm   = document.getElementById('btnConfirm');      // bevestig verwijder knop

// ─── Statistiek-elementen ──────────────────────────────────────────────────
const statTotal   = document.getElementById('statTotal');   // totaal gebruikers
const statViewer  = document.getElementById('statViewer');  // aantal viewers
const statEditor  = document.getElementById('statEditor');  // aantal editors
const statOwner   = document.getElementById('statOwner');   // aantal owners
const statAdmin   = document.getElementById('statAdmin');   // aantal admins

// ─── Toast helper ──────────────────────────────────────────────────────────
/**
 * Toont een tijdelijke toast notificatie onderaan het scherm.
 * @param {string} msg     - Bericht om te tonen
 * @param {boolean} isError - true = rode rand, false = gele rand
 */
function showToast(msg, isError = false) {
  toast.textContent = msg;                   // bericht instellen
  toast.className = 'show' + (isError ? ' error' : ''); // klasse toepassen
  clearTimeout(toast._timer);               // vorige timer annuleren
  toast._timer = setTimeout(() => {         // automatisch verbergen na 3s
    toast.className = '';
  }, 3000);
}

// ─── Statistieken bijwerken ────────────────────────────────────────────────
/**
 * Telt gebruikers per tier en schrijft waarden naar de stat-kaarten.
 * @param {Array} users - Lijst van gebruikersobjecten
 */
function updateStats(users) {
  statTotal.textContent  = users.length;                                    // totaal
  statViewer.textContent = users.filter(u => u.tier === 'viewer').length;  // viewers
  statEditor.textContent = users.filter(u => u.tier === 'editor').length;  // editors
  statOwner.textContent  = users.filter(u => u.tier === 'owner').length;   // owners
  statAdmin.textContent  = users.filter(u => u.tier === 'admin').length;   // admins
}

// ─── Datum formatteren ────────────────────────────────────────────────────
/**
 * Zet ISO-datumstring om naar leesbaar formaat (dd-mm-jjjj).
 * @param {string} iso - ISO 8601 datumstring
 * @returns {string} Geformatteerde datum
 */
function fmtDate(iso) {
  if (!iso) return '—';                      // ontbrekende datum
  const d = new Date(iso);                   // Date object aanmaken
  return d.toLocaleDateString('nl-NL', {     // Nederlandse notatie
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

// ─── Tabel renderen ───────────────────────────────────────────────────────
/**
 * Geeft de gefilterde gebruikerslijst weer in de HTML-tabel.
 * @param {Array} users - Te renderen gebruikers
 */
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
/**
 * Koppelt click-handlers aan de opslaan- en verwijderknoppen in alle rijen.
 * Wordt aangeroepen na elke renderTable() call.
 */
function bindRowEvents() {
  // Opslaan-knoppen: tier wijzigen
  document.querySelectorAll('.btn-save-tier').forEach(btn => {
    btn.addEventListener('click', () => {
      const uid = btn.dataset.uid;                          // gebruiker ID
      const sel = document.querySelector(`.tier-select[data-uid="${uid}"]`); // dropdown
      saveTier(uid, sel.value);                             // tier opslaan
    });
  });

  // Verwijder-knoppen: bevestigingsmodal tonen
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteTarget = { id: btn.dataset.uid, email: btn.dataset.email }; // target bewaren
      modalName.textContent = deleteTarget.email;           // naam in modal zetten
      modalOverlay.classList.add('open');                   // modal openen
    });
  });
}

// ─── Gebruikers laden via Supabase ────────────────────────────────────────
/**
 * Laadt alle gebruikers uit de Supabase `profiles` tabel.
 * Combineert met auth.admin.listUsers() voor e-mail + last_sign_in.
 * Vereist: service_role key — dit draait client-side, dus alleen e-mail
 * via profiles.email kolom (indien aanwezig) of auth meta via RPC.
 */
async function loadUsers() {
  tbody.innerHTML = '<tr class="loading-row"><td colspan="6">Laden...</td></tr>'; // laadtekst

  try {
    // Gebruikers ophalen uit admin_users view (join van profiles + auth.users)
    const { data: profiles, error } = await sb
      .from('admin_users')               // view met email + last_sign_in_at
      .select('id, username, tier, created_at, email, last_sign_in_at') // alle kolommen
      .order('created_at', { ascending: false }); // nieuwste eerst

    if (error) throw error; // fout doorgooien

    allUsers = profiles || []; // lijst bewaren
    filteredUsers = [...allUsers]; // gefilterde lijst initialiseren als kopie

    updateStats(allUsers);   // statistieken bijwerken
    renderTable(filteredUsers); // tabel vullen

    // Timestamp bijwerken
    lastRefresh.textContent = 'Bijgewerkt: ' + new Date().toLocaleTimeString('nl-NL');

  } catch (err) {
    console.error('[accountbeheer] loadUsers fout:', err); // fout loggen
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Fout bij laden: ${err.message}</td></tr>`;
    showToast('Laden mislukt: ' + err.message, true); // foutmelding tonen
  }
}

// ─── Tier opslaan ─────────────────────────────────────────────────────────
/**
 * Slaat een gewijzigde tier op in de Supabase profiles tabel.
 * @param {string} uid      - UUID van de gebruiker
 * @param {string} newTier  - Nieuwe tier waarde
 */
async function saveTier(uid, newTier) {
  try {
    // RPC aanroepen — SECURITY DEFINER omzeilt RLS, admin-check zit in de functie
    const { error } = await sb
      .rpc('update_user_tier', {      // Supabase RPC functie
        target_id: uid,               // UUID van de te wijzigen gebruiker
        new_tier:  newTier            // nieuwe tier waarde
      });

    if (error) throw error;           // fout doorgooien

    // Lokale cache bijwerken zodat tabel direct klopt
    const user = allUsers.find(u => u.id === uid); // gebruiker zoeken in cache
    if (user) user.tier = newTier;                 // tier bijwerken in cache

    updateStats(allUsers);            // statistieken opnieuw berekenen
    renderTable(filteredUsers);       // tabel opnieuw renderen

    showToast(`Tier bijgewerkt naar "${newTier}"`); // bevestiging tonen

  } catch (err) {
    console.error('[accountbeheer] saveTier fout:', err); // fout loggen
    showToast('Opslaan mislukt: ' + err.message, true);   // foutmelding tonen
  }
}

// ─── Gebruiker verwijderen ────────────────────────────────────────────────
/**
 * Verwijdert een gebruiker uit de profiles tabel.
 * Let op: verwijdert NIET uit Supabase auth — dat vereist service_role key.
 * Profile-verwijdering volstaat voor toegangsblokkade via RLS.
 * @param {string} uid - UUID van te verwijderen gebruiker
 */
async function deleteUser(uid) {
  try {
    // RPC aanroepen — SECURITY DEFINER omzeilt RLS
    const { error } = await sb
      .rpc('delete_user_profile', {   // Supabase RPC functie
        target_id: uid                // UUID van te verwijderen gebruiker
      });

    if (error) throw error; // fout doorgooien

    // Gebruiker uit lokale cache verwijderen
    allUsers      = allUsers.filter(u => u.id !== uid);      // uit volledige lijst
    filteredUsers = filteredUsers.filter(u => u.id !== uid); // uit gefilterde lijst

    updateStats(allUsers);    // statistieken bijwerken
    renderTable(filteredUsers); // tabel opnieuw renderen

    showToast('Gebruiker verwijderd.'); // bevestiging

  } catch (err) {
    console.error('[accountbeheer] deleteUser fout:', err); // fout loggen
    showToast('Verwijderen mislukt: ' + err.message, true); // foutmelding
  }
}

// ─── Zoeken & filteren ────────────────────────────────────────────────────
/**
 * Filtert allUsers op basis van zoektekst en geselecteerde tier.
 * Wordt aangeroepen bij elke invoer in de zoekbalk of tier-filter.
 */
function applyFilters() {
  const q    = searchInput.value.trim().toLowerCase(); // zoekterm (lowercase)
  const tier = tierFilter.value;                       // geselecteerde tier ('all' of specifiek)

  filteredUsers = allUsers.filter(u => {
    const matchQ    = !q || (u.email || '').toLowerCase().includes(q) // e-mail bevat zoekterm
                         || (u.username || '').toLowerCase().includes(q); // of gebruikersnaam
    const matchTier = tier === 'all' || u.tier === tier; // tier overeenkomst
    return matchQ && matchTier; // beide filters moeten kloppen
  });

  renderTable(filteredUsers); // gefilterde tabel tonen
}

// ─── Event listeners ──────────────────────────────────────────────────────

// Zoekbalk — live filteren bij invoer
searchInput.addEventListener('input', applyFilters);

// Tier-filter dropdown — filteren bij selectie
tierFilter.addEventListener('change', applyFilters);

// Vernieuwen knop — gebruikers opnieuw laden
btnRefresh.addEventListener('click', loadUsers);

// Modal annuleren
btnCancel.addEventListener('click', () => {
  modalOverlay.classList.remove('open'); // modal sluiten
  deleteTarget = null;                   // target wissen
});

// Modal bevestigen — gebruiker daadwerkelijk verwijderen
btnConfirm.addEventListener('click', async () => {
  if (!deleteTarget) return;                   // niets te verwijderen
  modalOverlay.classList.remove('open');       // modal sluiten
  await deleteUser(deleteTarget.id);           // verwijderen uitvoeren
  deleteTarget = null;                         // target wissen
});

// Klik buiten modal — modal sluiten
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) {             // alleen als overlay zelf geklikt
    modalOverlay.classList.remove('open');
    deleteTarget = null;
  }
});

// Uitloggen link
document.getElementById('logoutLink').addEventListener('click', async e => {
  e.preventDefault();                          // standaard navigatie voorkomen
  await window.AuthModule.logout();            // uitloggen via AuthModule
  window.location.href = '../index.html';  // terug naar hoofdpagina
});

// ─── Init ─────────────────────────────────────────────────────────────────
/**
 * Startpunt: controleer of gebruiker admin is, laad dan gebruikers.
 * AccessGuard op de HTML-pagina blokkeert al niet-admins,
 * maar we controleren hier nogmaals als extra beveiliging.
 */
async function init() {
  const tier = await window.AuthModule.getTier(); // huidig tier ophalen
  if (tier !== 'admin') {                          // niet-admin geblokkeerd
    window.location.href = '../index.html';    // doorsturen naar home
    return;
  }
  await loadUsers(); // gebruikers laden
}

// Wachten tot DOM klaar is
document.addEventListener('DOMContentLoaded', init);
