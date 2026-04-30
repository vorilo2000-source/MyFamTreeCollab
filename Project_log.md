# MyFamTreeCollab — Project Log
## Bijgewerkt: 2026-04-29

> Chronologisch overzicht van alle sessies en wijzigingen.
---

## Sessie 2026-04-30

### Onderwerp
Kritieke Supabase beveiligingskwetsbaarheden opgelost

### Uitgevoerde acties
1. `public.admin_users` view verwijderd en opnieuw aangemaakt met `SECURITY INVOKER`
   — view draait niet meer met superuser-rechten
2. View selecteert niet langer uit `auth.users` — alleen uit `public.profiles`
3. RLS policy "Admin kan alle profielen bijwerken" vervangen
   — verwijzing naar `user_metadata` (gebruiker-aanpasbaar) vervangen door `profiles.is_admin`
4. Nieuwe RLS policy toegevoegd die voorkomt dat gebruikers `is_admin` zelf kunnen wijzigen
5. `REVOKE` toegepast: `anon` en `authenticated` kunnen `auth.users` niet direct bevragen
6. `anon` rol heeft geen toegang meer tot `public.admin_users` view

### Bestanden gewijzigd
- Supabase database (SQL Editor): schema/policies aangepast
- `fix_security_vulnerabilities.sql` toegevoegd aan project (documentatie)

### Verificatie
- View `admin_users` bestaat zonder SECURITY DEFINER ✅
- 0 policies refereren nog aan `user_metadata` ✅
- `anon` heeft geen toegang tot view of `auth.users` ✅

### Openstaand
- Controleer frontend (`admin/`) of JavaScript nog `user_metadata.role` controleert
  → moet worden aangepast naar query op `profiles.is_admin`

---

## Sessie 19 — Berichtenboard herontwerp + notificatie-badge + bugfixes

**Datum:** 2026-04-29
**Doel:** Berichtenboard uitbreiden met multi-boom weergave per rol, 4 statussen, notificatie-badge in TopBar, en diverse bugfixes.

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `stamboom/collab.html` | v2.0.0 | v2.2.0 | 4 statusbadges, stamboom-sectie header CSS, ledenlijst CSS, cloudSync.js toegevoegd aan laadvolgorde |
| `js/collab.js` | v2.0.0 | v2.3.1 | Multi-boom weergave per rol, correcte localStorage keys (stamboomActiefId/Naam), kolomnamen gecorrigeerd (username/message/created_at), ledenlijst per boom, badge reset na paginabezoek |
| `js/topbar.js` | v2.2.2 | v2.3.0 | Notificatie-badge op gebruikersnaamknop, badge in dropdown menu, 💬 Samenwerken link in dropdown, updateCollabBadge() + refreshCollabBadge() |
| `js/cloudSync.js` | v2.2.0 | v2.2.1 | loadFromCloud() zonder _checkCloudAccess() — viewer/editor mogen laden, alleen login vereist |

### Supabase wijzigingen

| Onderdeel | Actie |
|-----------|-------|
| `collab_messages` tabel | Kolommen toegevoegd: persoon_id, persoon_naam, rol, diff_voorstel, status |
| Database Webhook `collab-notify` | Aangemaakt op collab_messages (INSERT + UPDATE) — voorbereid, nog niet actief |
| Edge Function `bright-handler` | Aangemaakt met collab-notify code — deployment nog niet geslaagd |

### Bugfixes

| ID | Omschrijving | Oplossing |
|----|-------------|-----------|
| BF-23 | collab.js las `activeBoomId` maar storage.js schrijft `stamboomActiefId` | Keys gecorrigeerd naar `stamboomActiefId` / `stamboomActiefNaam` |
| BF-24 | Bericht verzenden mislukt: `auteur_naam` kolom bestaat niet | Gecorrigeerd naar `username`, `bericht` → `message`, `aangemaakt_op` → `created_at` |
| BF-25 | Viewer kon gedeelde stamboom niet laden: `no_cloud_access` fout | `loadFromCloud()` gebruikt geen `_checkCloudAccess()` meer — alleen login vereist |

### Openstaande punten volgende sessie

| Punt | Actie |
|------|-------|
| Storage pagina — lokale en cloud zijn gescheiden frames | Samenvoegen tot één overzicht |
| Edge Function deployment afronden | `collab-notify` correct deployen in Supabase |
| Berichtenboard testen | Owner + viewer + editor testen, berichten plaatsen, status wijzigen |
| Invite e-mail template | `{{ .ConfirmationURL }}` → `{{ .SiteURL }}/#{{ .TokenHash }}&type=invite` |

---



## Sessie 18 — Demo knop + F6-17 abonnementen

**Datum:** 2026-04-26
**Doel:** Demo knop toevoegen op index.html, demo.js herschrijven met correcte CSV, abonnementen bijwerken naar nieuw rolmodel.

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `index.html` | v2.1.0 | v2.2.2 | Demo knop + demotekst in hero, `demo.js` + `idGenerator.js` in laadvolgorde |
| `js/demo.js` | v1.0.0 | v1.2.1 | Herschreven met hardcoded CSV (14 kolommen conform schema.js), parsing via `StamboomSchema.fromCSV()` |
| `abonnementen/vergelijk.html` | v1.1.0 | v2.0.0 | Volledig herschreven — oude abonnementsstructuur vervangen door rolvergelijkingstabel |
| `abonnementen/voordelen.html` | v1.2.0 | v2.0.0 | Bijgewerkt naar nieuw rolmodel, verwijzingen naar oude abonnementen verwijderd |

### Bugfixes

| ID | Omschrijving | Oplossing |
|----|-------------|-----------|
| BF-21 | demo.js gebruikte lowercase veldnamen — lege cellen in storage | Herschreven als hardcoded CSV, geparsed via `StamboomSchema.fromCSV()` |
| BF-22 | demo.js had 19-kolommen CSV in plaats van 14 — verkeerde kolom mapping | CSV aangepast naar exact 14 kolommen conform `schema.js FIELDS` |

### Openstaande punten volgende sessie

| Punt | Actie |
|------|-------|
| Berichtenboard testen | Sessie 19 |
| Invite e-mail template Supabase | `type=invite` redirect fix |

---

## Sessie 17 — FA-14: Admin accountbeheer pagina

**Datum:** 2026-04-25
**Doel:** Admin beheerpagina bouwen voor gebruikers- en tierbeheer via de website.

### Nieuwe bestanden

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `admin/accountbeheer.html` | v2.0.2 | Admin beheerpagina — statistieken, gebruikerstabel, tier wijzigen, verwijderen |
| `js/accountbeheer.js` | v1.0.9 | Paginalogica — laadt uit `admin_users` view, saveTier() en deleteUser() via RPC |

### Supabase wijzigingen

| Onderdeel | Actie |
|-----------|-------|
| `admin_users` view | Aangemaakt: join van `profiles` + `auth.users` voor email + last_sign_in_at |
| GRANT SELECT | `admin_users` leesbaar voor `authenticated` rol |
| RLS policy "Admin kan alle profielen zien" | Verwijderd — veroorzaakte infinite recursion in profiles |
| RPC `update_user_tier` | Aangemaakt — SECURITY DEFINER, omzeilt RLS |
| RPC `delete_user_profile` | Aangemaakt — SECURITY DEFINER, omzeilt RLS |

### Bugfixes

| ID | Omschrijving | Oplossing |
|----|-------------|-----------|
| BF-17 | Infinite recursion in RLS policy op `profiles` — getTier() crashte met 500 error | Policy verwijderd |
| BF-18 | `window._supabase` bestaat niet | Vervangen door `window.AuthModule.getClient()` |
| BF-19 | Uitlogknop verwees naar `../../index.html` — 404 | Gecorrigeerd naar `../index.html` |
| BF-20 | Tabel laadde niet automatisch — DOMContentLoaded te vroeg | `onAuthStateChange` + directe sessiecheck als fallback |

---

## Sessie 16 — Fase 6 rolmodel implementatie (code aanpassingen)

**Datum:** 2026-04-24
**Doel:** Alle code aanpassingen voor het nieuwe rolmodel doorvoeren in auth.js, cloudSync.js, shareModule.js, accessGuard.js, storage.js, versionControl.js, storage.html en demo.js. Handleiding, BACKLOG en PROJECT_LOG bijgewerkt.

### Uitgevoerd

#### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `js/auth.js` | v2.4.0 | v2.4.1 | `getTier()` fallback `'free'` → `'viewer'`, JSDoc Returns bijgewerkt naar nieuw rolmodel |
| `js/cloudSync.js` | v2.1.2 | v2.2.0 | `CLOUD_TIERS` → `['owner','admin']`, `_checkCloudAccess()` `'free'` check → `['viewer','editor']` |
| `js/shareModule.js` | v1.0.1 | v1.1.0 | Tier-check uitnodigende gebruiker (alleen owner/admin), tier-check uitgenodigde gebruiker verwijderd |
| `js/accessGuard.js` | v1.0.0 | v1.1.0 | Rolnamen waren al correct — dubbele bestandsinhoud verwijderd |
| `js/storage.js` | v2.1.0 | v2.2.0 | `canAdd()` viewer/editor zelfde limiet als gast (60), owner/admin onbeperkt |
| `js/versionControl.js` | v1.0.0 | v1.1.0 | MAX_VERSIONS = 5, `restoreVersion()` tier-check toegevoegd |
| `stamboom/storage.html` | v2.6.0 | v2.7.1 | Actieve stamboom balk, upgrade-prompt, bugfix verwijderStamboom() + resetBtn |
| `bronnen/handleiding.html` | v1.7.0 | v1.8.0 | Demo-melding, actieve balk, uitnodiging, roltabel bijgewerkt |

#### Nieuw bestand

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `js/demo.js` | v1.0.0 | Hardcoded fictieve demo stamboom voor gasten |

---

## Sessie 15 — Account overdracht & Supabase inrichting

**Datum:** 2026-04-23
**Doel:** Volledige overdracht van thvd64@gmail.com naar vorilo2000@gmail.com.

### Uitgevoerd

#### Supabase nieuw project (oihzuwlcgyyeuhghjahp)

| Onderdeel | Actie |
|-----------|-------|
| Tabellen | `profiles`, `stambomen`, `stamboom_gedeeld`, `collab_messages`, `user_profiles` aangemaakt |
| RLS | Alle policies ingesteld per tabel |
| Trigger | `handle_new_user` — profiel aanmaken bij registratie |
| RPC | `get_user_id_by_email(email)` — security definer |
| Auth URLs | Site URL + Redirect URL ingesteld |
| SMTP | Gmail App Password ingesteld |

---

## Sessies 1–14 — Zie eerdere PROJECT_LOG.md entries
