# MyFamTreeCollab — Project Log
## Bijgewerkt: 2026-04-26

> Chronologisch overzicht van alle sessies en wijzigingen.

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
