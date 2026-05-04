# MyFamTreeCollab — Project Log
## Bijgewerkt: 2026-05-04

> Chronologisch overzicht van alle sessies en wijzigingen.
> 
---

Sessie — 2026-05-04

analytics.js (localStorage) + siteAnalytics.js + analytics-dashboard.js samengevoegd tot admin/analytics-dashboard.js v3.x
siteAnalytics.js hersteld als zelfstandig bestand in /js/ — was per ongeluk verwijderd waardoor tracking op gewone pagina's niet werkte
Globale tier-filter toegevoegd bovenaan dashboard — filtert alle secties tegelijk (niet ingelogd / guest / owner / admin)
Tabel recente bezoeken: sticky header + lichtgrijze rijen + groene header
Supabase API key gecorrigeerd van sb_publishable_ naar JWT formaat
RLS uitgeschakeld op page_visits — policy blokkeerde anon inserts ondanks correcte configuratie
admin_page_visits view aangemaakt — SELECT beveiliging op database niveau
GoTrueClient warning opgelost — AuthModule.getClient() hergebruikt

Bestanden gewijzigd:

js/siteAnalytics.js → v2.3.0
admin/analytics-dashboard.js → v3.6.0
admin/analytics.html → v2.5.0
js/auth.js → JWT anon key bijgewerkt
Supabase: RLS uitgeschakeld, admin_page_visits view aangemaakt

---

## Sessie 20 — Analytics uitrol alle pagina's

**Datum:** 2026-05-03
**Doel:** siteAnalytics.js + SiteAnalytics.trackPage() toevoegen aan alle pagina's conform de vaste analyticsstructuur uit de projectvisie.

### Aanpak
Vaste regel: siteAnalytics.js laden na auth.js (zodat tier beschikbaar is), trackPage() aanroepen binnen het fetch-scriptblok na de drie fetch-calls.

### Gewijzigde bestanden

| Bestand | Van | Naar | trackPage naam |
|---------|-----|------|----------------|
| `stamboom/collab.html` | v2.2.0 | v2.3.0 | collab |
| `stamboom/manage.html` | v2.3.0 | v2.4.0 | manage |
| `stamboom/timeline.html` | v2.2.0 | v2.3.0 | timeline |
| `stamboom/view.html` | v2.0.1 | v2.1.0 | view |
| `home/about.html` | v2.1.0 | v2.2.0 | about |
| `home/create.html` | v2.0.2 | v2.1.0 | create |
| `home/export.html` | v2.1.3 | v2.2.0 | export |
| `home/import.html` | v2.0.3 | v2.1.0 | import |
| `home/print.html` | v2.0.1 | v2.1.0 | print |
| `bronnen/artikelen.html` | v0.1.0 | v0.2.0 | artikelen |
| `bronnen/extern.html` | v0.1.0 | v0.2.0 | extern |
| `bronnen/handleiding.html` | v2.0.0 | v2.1.0 | handleiding |
| `bronnen/instructies.html` | v0.1.0 | v0.2.0 | instructies |
| `bronnen/template.html` | v2.0.0 | v2.1.0 | template |
| `abonnementen/overzicht.html` | v2.0.1 | v2.0.2 | overzicht |
| `abonnementen/vergelijk.html` | v2.0.0 | v2.1.0 | vergelijk |
| `abonnementen/voordelen.html` | v2.0.0 | v2.1.0 | voordelen |
| `gemeenschap/contact.html` | v0.1.0 | v0.2.0 | contact |
| `gemeenschap/discussies.html` | v0.1.0 | v0.2.0 | discussies |
| `gemeenschap/evenement.html` | v0.1.0 | v0.2.0 | evenement |

### Meegenomen bugfixes (geconstateerd tijdens sessie)

| Bestand | Bugfix |
|---------|--------|
| `stamboom/timeline.html` | Dubbele utils.js verwijderd |
| `stamboom/view.html` | Dubbele utils.js verwijderd |
| `home/print.html` | Dubbele script-blokken opgeruimd, pad /js/ → ../js/ gecorrigeerd |
| `bronnen/artikelen.html` | Dubbele script-blokken, pad /js/ → ../js/, Navbar ID-mismatch |
| `bronnen/extern.html` | Idem + typfout "uggesties" gecorrigeerd |
| `bronnen/template.html` | Versnipperde fetch-blokken geconsolideerd, topbar.js injectie hersteld, supabase/utils/auth ontbraken |
| `bronnen/handleiding.html` | Kapotte `<h3>` tag (`</h3` zonder `>`) gecorrigeerd |
| `gemeenschap/contact.html` | Dubbele script-blokken, pad /js/ → ../js/, Navbar ID-mismatch, favicon pad gecorrigeerd |
| `gemeenschap/discussies.html` | Idem |
| `gemeenschap/evenement.html` | Idem |

### Openstaande punten volgende sessie

| Punt | Actie |
|------|-------|
| `stamboom/account.html` | analytics toevoegen |
| Overige gemeenschap/*.html | analytics toevoegen (forum, nieuws, etc.) |
| F3-61 import.js herschrijven | Hoogste open backlog prioriteit |

---

## Sessie 2026-04-30 — Supabase beveiligingsfixes

### Uitgevoerde acties
1. `public.admin_users` view herschreven met `SECURITY INVOKER`
   — niet meer via `auth.users`, alleen via `public.profiles`
2. RLS policy "Admin kan alle profielen bijwerken" vervangen
   — `user_metadata` vervangen door `profiles.is_admin`
3. RLS policy toegevoegd: gebruiker kan `is_admin` niet zelf wijzigen
4. `REVOKE` toegepast op `anon` en `authenticated` voor `auth.users`
5. `email` kolom toegevoegd aan `public.profiles`
   — trigger `on_auth_user_created` kopieert email bij registratie
   — bestaande rijen gevuld via UPDATE
6. `admin_users` view uitgebreid met `email` kolom (uit profiles)
7. `last_sign_in_at` verwijderd uit view, JS en HTML (kwam uit auth.users)
8. `accountbeheer.js` bijgewerkt naar v1.1.0
9. `accountbeheer.html` bijgewerkt naar v2.2.0

### Bestanden gewijzigd
- Supabase database (SQL Editor)
- `js/accountbeheer.js` → v1.1.0
- `admin/accountbeheer.html` → v2.2.0
- `fix_security_vulnerabilities.sql` toegevoegd (documentatie)

### Verificatie
- Alle 3 Supabase beveiligingswaarschuwingen opgelost ✅
- Adminpagina laadt gebruikers correct met email uit profiles ✅
- Geen `user_metadata` meer in RLS policies ✅

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
