# BACKLOG.md — MyFamTreeCollab
## Bijgewerkt: 2026-05-10

> Alle taken georganiseerd per fase en prioriteit.
> Status: 📋 Open · 🔄 In uitvoering · ✅ Gedaan · ❌ Geannuleerd · 🔮 Toekomst

---

## Fase 0 — Audit & opschoning ✅ AFGEROND

| ID | Taak | Status |
|----|------|--------|
| F0-01 | ZIP analyseren en alle bestanden inventariseren | ✅ Gedaan |
| F0-02 | `js/DeleteRow.js` verwijderen (leeg bestand) | ✅ Gedaan |
| F0-03 | `js/schemaGlobal.js` verwijderen (verouderd) | ✅ Gedaan |
| F0-04 | Alle dubbele functies in kaart brengen | ✅ Gedaan |
| F0-05 | Kapotte bestanden identificeren | ✅ Gedaan |

---

## Fase 1 — Structuur & centrale modules ✅ AFGEROND

| ID | Taak | Status |
|----|------|--------|
| F1-01 | `idGenerator.js` herbouwen als centrale module (v2.0.0) | ✅ Gedaan |
| F1-02 | `utils.js` aanmaken met `safe()`, `formatDate()`, `parseBirthday()` | ✅ Gedaan |
| F1-03 | Lokale `safe()` verwijderen uit alle bestanden | ✅ Gedaan |
| F1-04 | `computeRelaties()` uit `manage.js` → centrale `relatieEngine.js` | ✅ Gedaan |
| F1-05 | `LiveSearch.js` volledig in IIFE wikkelen (bugfix safe already declared) | ✅ Gedaan |
| F1-06 | `utils.js` als eerste script toevoegen aan alle pagina's | ✅ Gedaan |
| F1-07 | `relatieEngine.js` toevoegen aan `manage.html` (ontbrak) | ✅ Gedaan |

---

## Fase 2 — Kapotte bestanden repareren ✅ AFGEROND

| ID | Taak | Status |
|----|------|--------|
| F2-01 | `export.js` herschrijven als centrale module met CSV + JSON | ✅ Gedaan |
| F2-02 | `export.html` repareren: `storage.js` + `schema.js` laden | ✅ Gedaan |
| F2-03 | `export.html` uitbreiden met JSON-knop | ✅ Gedaan |
| F2-04 | `storage.html` exportcode vervangen door centrale `export.js` | ✅ Gedaan |
| F2-05 | Export JSON/CSV knoppen verwijderen uit `storage.html` | ✅ Gedaan |
| F2-06 | `storage.js`: `migrate()` niet meer bij elke `get()` | ✅ Gedaan |
| F2-07 | `storage.js`: `migrate()` geeft `null` bij ongeldig record | ✅ Gedaan |
| F2-08 | `storage.js`: `console.log` bij laden verwijderd | ✅ Gedaan |
| F2-09 | `js/LSD.js` dubbele `DOMContentLoaded` | ❌ Geannuleerd — buiten scope |

---

## Fase 3 — Kernfeatures verbeteren

### 3B — Zoekfunctie

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F3-43 | 🔴 Hoog | Zoekresultaten highlighten | ❌ Geannuleerd |
| F3-44 | 🔴 Hoog | Zoeken op meerdere velden tegelijk | ✅ Gedaan |
| F3-45 | 🟡 Middel | Popup-stijlen verplaatsen naar `style.css` | 📋 Open |
| F3-46 | 🟡 Middel | Keyboard navigatie in zoekpopup | 📋 Open |
| F3-47 | 🟢 Laag | Zoekgeschiedenis | 📋 Open |

### 3C — Relaties

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F3-48 | 🔴 Hoog | Meerdere partners ondersteunen | 📋 Open |
| F3-49 | 🔴 Hoog | Relatie toevoegen vanuit `manage.html` | 📋 Open |
| F3-50 | 🟡 Middel | Grootouders en kleinkinderen tonen in view.html | 📋 Open |
| F3-51 | 🟡 Middel | Halfbroers/halfzussen correct onderscheiden | 📋 Open |
| F3-52 | 🟢 Laag | Relatie-labels vertalen | 📋 Open |

### 3D — Stamboomvisualisatie

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F3-53 | 🔴 Hoog | Verbindingslijnen tekenen (SVG of CSS) | 🔮 Toekomst |
| F3-54 | 🔴 Hoog | Foto/avatar toevoegen aan persoon-node | 🔮 Toekomst |
| F3-55 | 🟡 Middel | Zoom en pan op de stamboomweergave | 🔮 Toekomst |
| F3-56 | 🟢 Laag | Uitklappen/inklappen van takken | 🔮 Toekomst |

### 3E — Tijdlijn

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F3-57 | 🔴 Hoog | Overlijdensdatum tonen op tijdlijn | ✅ Gedaan |
| F3-58 | 🟡 Middel | Levensspanne als balk weergeven | 🔮 Toekomst |
| F3-59 | 🟡 Middel | Schaalbare tijdas | 🔮 Toekomst |
| F3-60 | 🟢 Laag | Historische gebeurtenissen toevoegen | 🔮 Toekomst |

### 3F — Import / export

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F3-61 | 🔴 Hoog | `import.js` herschrijven met inline commentaar | 📋 Open |
| F3-62 | 🔴 Hoog | Import validatie: dubbele ID's detecteren | 📋 Open |
| F3-63 | 🟡 Middel | Import preview tonen vóór opslaan | 📋 Open |
| F3-64 | 🟡 Middel | GEDCOM-formaat importeren | 📋 Open |

### 3H — Overige

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F3-68 | 🟡 Middel | `stamboom/stats.html` JS verplaatsen naar apart `stats.js` | 📋 Open |
| F3-69 | 🟡 Middel | `home/print.html` implementeren | 📋 Open |
| F3-70 | 🟢 Laag | `schema.js` herschrijven met inline commentaar | 📋 Open |

---

## Fase 8 — Internationalisatie (i18n) 🔄 IN UITVOERING

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F8-01 | 🔴 Hoog | `js/i18n.js` v1.0.0 — core module aanmaken | ✅ Gedaan |
| F8-02 | 🔴 Hoog | `locales/{nl,en,es}/common.json` aanmaken | ✅ Gedaan |
| F8-03 | 🔴 Hoog | `locales/{nl,en,es}/home.json` aanmaken | ✅ Gedaan |
| F8-04 | 🔴 Hoog | `index.html` refactoren met `data-i18n` | ✅ Gedaan |
| F8-05 | 🔴 Hoog | `Layout/TopBar.html` — language switcher `<select>` | ✅ Gedaan |
| F8-06 | 🔴 Hoog | `Layout/Navbar.html` — `data-i18n="common:nav.*"` | 📋 Open |
| F8-07 | 🔴 Hoog | `Layout/Footer.html` — `data-i18n="common:footer.*"` | 📋 Open |
| F8-08 | 🔴 Hoog | `locales/{nl,en,es}/create.json` aanmaken | 📋 Open |
| F8-09 | 🔴 Hoog | `locales/{nl,en,es}/manage.json` aanmaken | 📋 Open |
| F8-10 | 🔴 Hoog | `locales/{nl,en,es}/auth.json` aanmaken | 📋 Open |
| F8-11 | 🟡 Middel | `home/create.html` refactoren met `data-i18n` | 📋 Open |
| F8-12 | 🟡 Middel | `home/about.html` refactoren met `data-i18n` | 📋 Open |
| F8-13 | 🟡 Middel | `stamboom/manage.html` refactoren met `data-i18n` | 📋 Open |
| F8-14 | 🟡 Middel | `home/confirm.html` refactoren met `data-i18n` | 📋 Open |
| F8-15 | 🟢 Laag | `lang-link` handlers verwijderen uit `topbar.js` | 📋 Open |
| F8-16 | 🟢 Laag | `common.meta.appName` opruimen uit `common.json` | 📋 Open |
| F8-17 | 🟢 Laag | Automatische namespace detectie op basis van URL | 🔮 Toekomst |
| F8-18 | 🟢 Laag | Missing key logging activeren in development | 🔮 Toekomst |
| F8-19 | 🟢 Laag | `Handleiding.html` bijwerken met i18n uitleg | 📋 Open |

---

## Fase A — Account & donaties ✅ AFGEROND

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| FA-01 | 🔴 Hoog | Supabase project aanmaken + API-key configureren | ✅ Gedaan |
| FA-02 | 🔴 Hoog | `js/auth.js` aanmaken: registreren, inloggen, uitloggen | ✅ Gedaan |
| FA-03 | 🔴 Hoog | Login modal via `js/topbar.js` | ✅ Gedaan |
| FA-04 | 🔴 Hoog | TopBar uitbreiden: gebruikersnaam + uitlogknop | ✅ Gedaan |
| FA-05 | 🟡 Middel | Sessie bewaren na pagina-refresh | ✅ Gedaan |
| FA-06 | 🟡 Middel | Ko-fi donatie knop in TopBar en Footer | ✅ Gedaan |
| FA-07 | 🔴 Hoog | Wachtwoord vergeten flow | ✅ Gedaan |
| FA-08 | 🔴 Hoog | SMTP instellen via Gmail App Password | ✅ Gedaan |
| FA-09 | 🟡 Middel | Supabase redirect URL instellen | ✅ Gedaan |
| FA-10 | 🟡 Middel | Supabase profiles tabel aanmaken met RLS | ✅ Gedaan |
| FA-11 | 🟢 Laag | Donateurs-badge | 🔮 Toekomst |
| FA-12 | 🟡 Middel | E-mail templates huisstijl | ✅ Gedaan |
| FA-13 | 🔴 Hoog | Admin dropdown verbergen voor niet-admins | ✅ Gedaan |
| FA-14 | 🟡 Middel | Admin beheerpagina `admin/accountbeheer.html` | ✅ Gedaan |
| FA-15 | 🔴 Hoog | `home/confirm.html` aanmaken | ✅ Gedaan |
| FA-16 | 🔴 Hoog | Supabase email template Confirm signup bijgewerkt | ✅ Gedaan |
| FA-17 | 🔴 Hoog | Supabase anon key vervangen door sb_publishable_ formaat | ✅ Gedaan |
| FA-18 | 🟡 Middel | Tier constraint uitgebreid met 'guest' | ✅ Gedaan |
| FA-19 | 🔴 Hoog | Confirm-knop in accountbeheer — manueel bevestigen onbevestigde accounts | ✅ Gedaan |
| FA-20 | 🔴 Hoog | Admin-notificatie bij bevestiging — mail naar vorilo2000@gmail.com via Resend | ✅ Gedaan |
| FA-21 | 🟡 Middel | Bevestigingsmail naar account zelf bij manuele bevestiging | ✅ Gedaan |
| FA-22 | 🟡 Middel | Notificatie bij automatische bevestiging via confirm.html | ✅ Gedaan |

---

## Fase A+ — Cloud backup ✅ AFGEROND

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| FA+-01 | 🔴 Hoog | Supabase tabel `stambomen` aanmaken | ✅ Gedaan |
| FA+-02 | 🔴 Hoog | `js/cloudSync.js` aanmaken | ✅ Gedaan |
| FA+-03 | 🔴 Hoog | `stamboom/storage.html` tabbladen: Mijn data + Cloud backup | ✅ Gedaan |
| FA+-04 | 🔴 Hoog | Gratis limiet bewaken: max 100 personen lokaal | ✅ Gedaan |
| FA+-05 | 🟡 Middel | "Laad vanuit cloud" knop op `storage.html` | ✅ Gedaan |
| FA+-06 | 🟡 Middel | Conflictmelding tonen als cloud-versie nieuwer is | ✅ Gedaan |
| FA+-07 | 🟡 Middel | `home/account.html` aanmaken | 🔮 Toekomst |
| FA+-08 | 🟢 Laag | Timestamp tonen van laatste cloud-backup | ✅ Gedaan |
| FA+-09 | 🔴 Hoog | Tier/rollen systeem in profiles | ✅ Gedaan |
| FA+-10 | 🔴 Hoog | Cloud toegang alleen voor premium/admin | ✅ Gedaan |

---

## Fase 5 — Cloud & accounts ✅ AFGEROND

| ID | Taak | Status |
|----|------|--------|
| F5-01 | Backend: Supabase gekozen en opgezet | ✅ Gedaan |
| F5-02 | Gebruikersaccounts: registreren, inloggen, uitloggen | ✅ Gedaan |
| F5-03 | Data sync tussen apparaten | ✅ Gedaan |
| F5-04 | Stamboom delen met andere gebruikers | ✅ Gedaan |
| F5-05 | Samenwerkingsmodus: berichtenboard per persoon | ✅ Gedaan |
| F5-06 | Versiebeheer per persoon | ✅ Gedaan |
| F5-07 | Meerdere stambomen per gebruiker in cloud | ✅ Gedaan |
| F5-08 | account.html — overzicht stambomen, backups, profiel | ✅ Gedaan |
| F5-09 | Promotiecodes voor cloud toegang | 🔮 Toekomst |
| F5-10 | Abonnementen en betaaltiers verder uitwerken | → Fase 7 |
| F5-11 | Ko-fi webhook integratie voor donateur-badge | → Fase 7 |

---

## Fase 6 — Rolmodel implementatie ✅ AFGEROND

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F6-01 t/m F6-20 | Rolmodel implementatie, demo database, upgrade flow, versiebeheer, handleiding | ✅ Gedaan |

---

## Fase 7 — Businessmodel & betaling 🔮 TOEKOMST

| ID | Taak | Status |
|----|------|--------|
| F7-01 | Stripe integratie voor owner-donatie | 🔮 Toekomst |
| F7-02 | Supabase webhook: Stripe betaling → tier owner | 🔮 Toekomst |
| F7-03 | Bedrijfsoprichting & belastingstructuur | 🔮 Toekomst |
| F7-04 | Ko-fi behouden als vrijwillige steunknop | 🔮 Toekomst |
| F7-05 | Prijsstelling definitief vaststellen | 🔮 Toekomst |
| F7-06 | Owner-limiet verhogen op basis van inkomsten | 🔮 Toekomst |

---

## Bugfixes

### Sessie 2026-05-10

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-36 | i18n keys toonden letterlijk — oorzaak: dot i.p.v. colon als namespace separator | ✅ Opgelost |
| BF-37 | Taalwissel resette switcher — `onComponentLoaded()` riep `buildLanguageSwitcher()` bij elke injectie | ✅ Opgelost |
| BF-38 | Namespace niet herladen na taalwissel — `handleLanguageChange()` miste `loadNamespaces()` | ✅ Opgelost |

### Sessie 2026-05-09

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-33 | `handle_new_user` trigger — RLS blokkeerde INSERT via `auth.uid()` mismatch | ✅ Opgelost |
| BF-34 | `admin_users` view — `email_confirmed_at` ontbrak, geen JOIN op `auth.users` | ✅ Opgelost |
| BF-35 | Edge Function JWT 401 — `verify_jwt = false` ingesteld, Authorization header verwijderd | ✅ Opgelost |

### Sessie 2026-05-07

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-28 | auth.js — SUPABASE_ANON JWT key had `iat` in de toekomst | ✅ Opgelost |
| BF-29 | Bevestigingsmail redirect naar 404 | ✅ Opgelost |
| BF-30 | `profiles_tier_check` stond `guest` niet toe | ✅ Opgelost |
| BF-31 | accountbeheer.js — `statViewer`/`statEditor` DOM IDs bestonden niet meer | ✅ Opgelost |
| BF-32 | `handle_new_user` had geen `tier` in INSERT | ✅ Opgelost |

---

## Analytics

| ID | Omschrijving | Status |
|----|-------------|--------|
| AN-01 t/m AN-40 | trackPage() alle pagina's + dashboard uitbreidingen | ✅ Gedaan |
| AN-21 | `stamboom/account.html` — tracking toevoegen | 📋 Open |

---

## Technische schuld

| ID | Omschrijving | Ernst |
|----|-------------|-------|
| TD-01 | `js/Sandbox.js` — testbestand in repo | 🟢 Laag |
| TD-02 | `js/script.js` — doet alleen console.log | 🟡 Middel |
| TD-03 | `js/LSD.js` — dubbele DOMContentLoaded | 🟢 Laag |
| TD-04 | `Layout/*.html` via fetch() — werkt niet op file:// | 🟡 Middel |
| TD-05 | Popup-stijlen in LiveSearch.js hardcoded inline | 🟢 Laag |
| TD-06 | `home/import-en.html` laadt import.js zonder schema.js + storage.js | 🔴 Hoog |
| TD-07 | Resend zonder eigen domein — `onboarding@resend.dev`, mail alleen naar Resend-account | 🟡 Middel |
| TD-08 | async/await mismatch — call-sites van storage.add() controleren | 🟡 Middel |
| TD-09 | `lang-link` handlers in `topbar.js` — vervangen door i18n.js, handlers verwijderen | 🟡 Middel |
| TD-10 | `page_visits` RLS uitgeschakeld — beveiligd via view | 🟡 Middel |
