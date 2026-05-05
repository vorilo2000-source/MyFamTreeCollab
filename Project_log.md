# MyFamTreeCollab — Project Log
## Bijgewerkt: 2026-05-04

> Chronologisch overzicht van alle sessies en wijzigingen.
> 
---

## Sessie 21 — Analytics dashboard uitbreidingen + bugfixes

**Datum:** 2026-05-04
**Doel:** Analytics dashboard verbeteren, tracking debuggen, e-mail tracking toevoegen, tier definitie corrigeren.

### Uitgevoerde acties

#### Dashboard UI
- Analyticsbestanden samengevoegd: `analytics.js` (localStorage) + `siteAnalytics.js` + `analytics-dashboard.js` → één bestand `admin/analytics-dashboard.js`
- `js/siteAnalytics.js` hersteld als zelfstandig tracker-bestand — was per ongeluk samengevoegd waardoor tracking op gewone pagina's niet werkte
- Globale tier-filter bovenaan dashboard toegevoegd — filtert alle secties tegelijk (niet ingelogd / guest / owner / admin)
- Tabel recente bezoeken: sticky header, lichtgrijze rijen, groene header
- E-mail kolom toegevoegd aan recente bezoeken tabel
- Tier verdeling uitgebreid met uitklapbare e-maillijst per tier (▾ dropdown)
- `SiteAnalytics.trackPage()` prefix bug opgelost in `analytics-dashboard.js` — was `trackPage()` zonder prefix

#### Tracking bugfixes
- Supabase anon key gecorrigeerd van `sb_publishable_` naar JWT formaat — dit was de hoofdoorzaak van alle tracking problemen
- RLS op `page_visits` uitgeschakeld — INSERT policy blokkeerde anon inserts ondanks `with check (true)` en correcte rol-configuratie
- `admin_page_visits` view aangemaakt — SELECT beveiliging op database niveau voor niet-admins
- GoTrueClient warning opgelost — `AuthModule.getClient()` hergebruikt in `siteAnalytics.js`
- `getCurrentTier()` gecorrigeerd — geeft `null` terug voor niet-ingelogden (was `'guest'`)
- `getCurrentEmail()` gecorrigeerd — haalt email op via `AuthModule.getUser()` i.p.v. `profiles` tabel

#### Tier definitie gecorrigeerd
- Tier model verduidelijkt: account types zijn `guest` / `owner` / `admin` — `viewer` en `editor` zijn stamboom-rechten, geen account types
- `getCurrentTier()` in `siteAnalytics.js` — `viewer`/`editor` worden afgevangen en teruggegeven als `'guest'`
- `getTier()` in `auth.js` — fallback gecorrigeerd van `'viewer'` naar `'guest'`, extra check op `viewer`/`editor` toegevoegd
- Historische `page_visits` rijen met `tier = 'viewer'` of `'editor'` bijgewerkt naar `'guest'` via SQL

#### Supabase
- `email` kolom toegevoegd aan `page_visits` tabel
- `admin_page_visits` view herschreven na kolom toevoeging
- RLS uitgeschakeld op `page_visits` — `NO FORCE ROW LEVEL SECURITY`

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `js/siteAnalytics.js` | v2.0.0 | v2.6.0 | Hersteld als zelfstandig bestand, getCurrentTier() gecorrigeerd, getCurrentEmail() via getUser(), GoTrueClient fix |
| `admin/analytics-dashboard.js` | v3.0.0 | v3.9.0 | Globale filter, e-mail kolom tabel, tier e-maillijst dropdown, SiteAnalytics.trackPage() prefix fix |
| `admin/analytics.html` | v2.0.0 | v2.7.0 | Filter bar, tabel stijlen, tier e-mail lijst CSS |
| `js/auth.js` | v2.4.2 | v2.5.0 | getTier() fallback 'viewer' → 'guest', viewer/editor check toegevoegd |

### Supabase wijzigingen

| Onderdeel | Actie |
|-----------|-------|
| `page_visits.email` | Kolom toegevoegd (text, nullable) |
| `page_visits` RLS | Uitgeschakeld — INSERT policy blokkeerde anon ondanks correcte configuratie |
| `admin_page_visits` view | Aangemaakt — SELECT alleen voor admins via EXISTS check op profiles |
| Historische data | `tier = 'viewer'/'editor'` → `'guest'` via UPDATE |

### Verificatie
- Tracking werkt voor niet-ingelogde bezoekers (`tier = null`) ✅
- Tracking werkt voor ingelogde gebruikers (guest / owner / admin) ✅
- E-mail wordt correct opgeslagen in `page_visits.email` ✅
- Tier verdeling toont correct: admin / guest / owner / niet ingelogd ✅
- E-maillijst uitklapbaar per tier in dashboard ✅
- GoTrueClient warning verdwenen ✅

---

## Sessie 2026-05-04 (vroege sessie) — Analytics samenvoegen

**Datum:** 2026-05-04
**Doel:** Analytics JS bestanden samenvoegen, dashboard UI verbeteren.

- `analytics.js` (localStorage) + `siteAnalytics.js` + `analytics-dashboard.js` samengevoegd tot `admin/analytics-dashboard.js` v3.x
- `siteAnalytics.js` hersteld als zelfstandig bestand in `/js/`
- Globale tier-filter toegevoegd bovenaan dashboard
- Tabel recente bezoeken: sticky header + lichtgrijze rijen + groene header
- Supabase API key gecorrigeerd van `sb_publishable_` naar JWT formaat
- RLS uitgeschakeld op `page_visits`
- `admin_page_visits` view aangemaakt
- GoTrueClient warning opgelost

**Bestanden gewijzigd:**
- `js/siteAnalytics.js` → v2.3.0
- `admin/analytics-dashboard.js` → v3.6.0
- `admin/analytics.html` → v2.5.0
- `js/auth.js` → JWT anon key bijgewerkt

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

### Meegenomen bugfixes

| Bestand | Bugfix |
|---------|--------|
| `stamboom/timeline.html` | Dubbele utils.js verwijderd |
| `stamboom/view.html` | Dubbele utils.js verwijderd |
| `home/print.html` | Dubbele script-blokken opgeruimd, pad /js/ → ../js/ gecorrigeerd |
| `bronnen/artikelen.html` | Dubbele script-blokken, pad /js/ → ../js/, Navbar ID-mismatch |
| `bronnen/extern.html` | Idem + typfout "uggesties" gecorrigeerd |
| `bronnen/template.html` | Versnipperde fetch-blokken geconsolideerd, topbar.js injectie hersteld |
| `bronnen/handleiding.html` | Kapotte `<h3>` tag gecorrigeerd |
| `gemeenschap/contact.html` | Dubbele script-blokken, pad /js/ → ../js/, Navbar ID-mismatch |
| `gemeenschap/discussies.html` | Idem |
| `gemeenschap/evenement.html` | Idem |

---

## Sessie 2026-04-30 — Supabase beveiligingsfixes

### Uitgevoerde acties
1. `public.admin_users` view herschreven met `SECURITY INVOKER`
2. RLS policy "Admin kan alle profielen bijwerken" vervangen
3. RLS policy toegevoegd: gebruiker kan `is_admin` niet zelf wijzigen
4. `REVOKE` toegepast op `anon` en `authenticated` voor `auth.users`
5. `email` kolom toegevoegd aan `public.profiles`
6. `admin_users` view uitgebreid met `email` kolom
7. `last_sign_in_at` verwijderd uit view, JS en HTML
8. `accountbeheer.js` bijgewerkt naar v1.1.0
9. `accountbeheer.html` bijgewerkt naar v2.2.0

### Bestanden gewijzigd
- `js/accountbeheer.js` → v1.1.0
- `admin/accountbeheer.html` → v2.2.0

---

## Sessie 19 — Berichtenboard herontwerp + notificatie-badge + bugfixes

**Datum:** 2026-04-29

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `stamboom/collab.html` | v2.0.0 | v2.2.0 | 4 statusbadges, stamboom-sectie header CSS |
| `js/collab.js` | v2.0.0 | v2.3.1 | Multi-boom weergave per rol, correcte localStorage keys |
| `js/topbar.js` | v2.2.2 | v2.3.0 | Notificatie-badge, 💬 Samenwerken link |
| `js/cloudSync.js` | v2.2.0 | v2.2.1 | loadFromCloud() zonder _checkCloudAccess() |

---

## Sessie 18 — Demo knop + F6-17 abonnementen

**Datum:** 2026-04-26

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `index.html` | v2.1.0 | v2.2.2 | Demo knop + demotekst in hero |
| `js/demo.js` | v1.0.0 | v1.2.1 | Herschreven met hardcoded CSV |
| `abonnementen/vergelijk.html` | v1.1.0 | v2.0.0 | Rolvergelijkingstabel |
| `abonnementen/voordelen.html` | v1.2.0 | v2.0.0 | Bijgewerkt naar nieuw rolmodel |

---

## Sessie 17 — FA-14: Admin accountbeheer pagina

**Datum:** 2026-04-25

### Nieuwe bestanden

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `admin/accountbeheer.html` | v2.0.2 | Admin beheerpagina |
| `js/accountbeheer.js` | v1.0.9 | Paginalogica |

---

## Sessie 16 — Fase 6 rolmodel implementatie

**Datum:** 2026-04-24

### Gewijzigde bestanden

| Bestand | Van | Naar |
|---------|-----|------|
| `js/auth.js` | v2.4.0 | v2.4.1 |
| `js/cloudSync.js` | v2.1.2 | v2.2.0 |
| `js/shareModule.js` | v1.0.1 | v1.1.0 |
| `js/accessGuard.js` | v1.0.0 | v1.1.0 |
| `js/storage.js` | v2.1.0 | v2.2.0 |
| `js/versionControl.js` | v1.0.0 | v1.1.0 |
| `stamboom/storage.html` | v2.6.0 | v2.7.1 |
| `bronnen/handleiding.html` | v1.7.0 | v1.8.0 |

---

## Sessie 15 — Account overdracht & Supabase inrichting

**Datum:** 2026-04-23

### Supabase nieuw project (oihzuwlcgyyeuhghjahp)

| Onderdeel | Actie |
|-----------|-------|
| Tabellen | `profiles`, `stambomen`, `stamboom_gedeeld`, `collab_messages` aangemaakt |
| RLS | Alle policies ingesteld |
| Trigger | `handle_new_user` aangemaakt |
| RPC | `get_user_id_by_email(email)` aangemaakt |

---

## Sessies 1–14 — Zie eerdere PROJECT_LOG.md entries
