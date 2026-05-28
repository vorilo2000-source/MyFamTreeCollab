# BACKLOG.md — MyFamTreeCollab
## Bijgewerkt: 2026-05-28

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
| F3-61 | 🔴 Hoog | `import.js` herschrijven met inline commentaar | ✅ Gedaan |
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
| F8-01 t/m F8-16 | Core i18n module, common/home/create/manage/auth locales | ✅ Gedaan |
| F8-17 | 🟢 Laag | Automatische namespace detectie op basis van URL | 🔮 Toekomst |
| F8-18 | 🟢 Laag | Missing key logging activeren in development | 🔮 Toekomst |
| F8-19 | 🟢 Laag | `handleiding-nl.html` bijwerken met i18n uitleg | ❌ Geannuleerd |
| F8-20 t/m F8-55 | Start/Stamboom/Bronnen/Gemeenschap/Develop/Abonnementen i18n | ✅ Gedaan |
| F8-56 | 🔴 Hoog | Import-parser aanpassen: rij 2 lezen als technische header (schema.js) | 📋 Open |
| F8-57 t/m F8-61 | template.html taalwissel + abonnementen namespaces | ✅ Gedaan |
| F8-62 | 🟡 Middel | `locales/{nl,en,es}/common.json` — `nav.sub.supabaseAnalyse` toegevoegd | ✅ Gedaan |
| F8-15 | 🟢 Laag | `lang-link` handlers verwijderen uit `topbar.js` (TD-09) | 📋 Open |

---

## Fase 9 — Bronnen (genealogisch onderzoek) 📋 NIEUW

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F9-01 | 🔴 Hoog | Ontwerp bronnen-datamodel (Supabase tabel `bronnen`) | 📋 Open |
| F9-02 | 🔴 Hoog | `stamboom/bronnen.html` aanmaken — overzicht en beheer | 📋 Open |
| F9-03 | 🔴 Hoog | `js/bronnen.js` aanmaken — CRUD voor bronnen | 📋 Open |
| F9-04 | 🟡 Middel | Bron koppelen aan persoon in `manage.html` | 📋 Open |
| F9-05 | 🟡 Middel | Bronnen tonen in `view.html` per persoon | 📋 Open |
| F9-06 | 🟡 Middel | Brontypen: boek, archief, website, mondelinge overlevering | 📋 Open |
| F9-07 | 🟡 Middel | `locales/{nl,en,es}/bronnen.json` aanmaken | 📋 Open |
| F9-08 | 🟢 Laag | Extern archieflink valideren (URL check) | 📋 Open |
| F9-09 | 🟢 Laag | Bron exporteren als onderdeel van GEDCOM | 📋 Open |

---

## Fase 10 — Admin toegangsbeveiliging 🔄 VOLGENDE SESSIE

> Referentie-implementatie: `admin/supabase-analyse.html` — bevat het patroon dat uitgerold wordt.
>
> **Patroon:**
> 1. `AuthModule.getTier()` check bij `initPage()`
> 2. Tier !== 'admin' → toon rood foutscherm (`#accessDenied`), stop uitvoering
> 3. `AuthModule.onAuthChange()` listener → bij uitloggen automatisch redirect naar `index.html`
> 4. Pagina-inhoud (`#dashboard` of equivalent) standaard `display:none`, alleen zichtbaar na geslaagde admin-check

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F10-01 | 🔴 Hoog | `admin/accountbeheer.html` — admin-check + uitlog-redirect toevoegen | 📋 Open |
| F10-02 | 🔴 Hoog | `admin/analytics.html` — admin-check + uitlog-redirect toevoegen | 📋 Open |
| F10-03 | 🔴 Hoog | `admin/analyse.html` — admin-check + uitlog-redirect toevoegen | 📋 Open |
| F10-04 | 🟡 Middel | `admin/supabase-analyse.html` — `onAuthChange` uitlog-redirect toevoegen (check zit er al in) | 📋 Open |
| F10-05 | 🟡 Middel | Gedeeld `js/adminGuard.js` module aanmaken — herbruikbare guard functie voor alle admin-pagina's | 📋 Open |
| F10-06 | 🟢 Laag | Developer-pagina's (`develop/*.html`) — zelfde patroon voor developer-only toegang | 📋 Open |

---

## Fase A — Account & donaties ✅ AFGEROND

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| FA-01 t/m FA-22 | Account, auth, Ko-fi, admin, bevestigingsmail | ✅ Gedaan |

---

## Fase A+ — Cloud backup ✅ AFGEROND

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| FA+-01 t/m FA+-10 | Cloud sync, tiers, rollen | ✅ Gedaan |

---

## Fase 5 — Cloud & accounts ✅ AFGEROND

| ID | Taak | Status |
|----|------|--------|
| F5-01 t/m F5-08 | Supabase, accounts, sync, delen, versiegeschiedenis | ✅ Gedaan |
| F5-09 | Promotiecodes voor cloud toegang | 🔮 Toekomst |
| F5-10 | Abonnementen en betaaltiers verder uitwerken | → Fase 7 |
| F5-11 | Ko-fi webhook integratie voor donateur-badge | → Fase 7 |

---

## Fase 6 — Rolmodel implementatie ✅ AFGEROND

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F6-01 t/m F6-20 | Rolmodel, demo database, upgrade flow, versiebeheer, handleiding | ✅ Gedaan |

---

## Fase 7 — Businessmodel & betaling 🔮 TOEKOMST

| ID | Taak | Status |
|----|------|--------|
| F7-01 t/m F7-06 | Stripe, Ko-fi, prijsstelling | 🔮 Toekomst |

---

## Beveiliging

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| SEC-01 | 🔴 Kritiek | `admin_users` view droppen — lekte auth.users via publieke API | ✅ Gedaan |
| SEC-02 | 🔴 Kritiek | RLS inschakelen op alle publieke tabellen (6 tabellen) | ✅ Gedaan |
| SEC-03 | 🔴 Kritiek | Anon-rechten intrekken + authenticated grants minimaliseren | ✅ Gedaan |
| SEC-04 | 🟡 Middel | Editor-rol schrijfrecht op `stambomen` via `stamboom_gedeeld.rol` | 📋 Open |

---

## Bugfixes

### Sessie 2026-05-28 (sessie 32)

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-60 | `supabase-analyse.html` — Storage-secties toonden "geen data" omdat app geen Supabase Storage gebruikt. Vervangen door stamboom-analyse secties. | ✅ Opgelost |

### Sessie 2026-05-26 (sessie 31)

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-57 | Admin/developer menu verborgen na security-fix — recursieve RLS op `profiles` | ✅ Opgelost |
| BF-58 | `accountbeheer.html` — `admin_users` view ontbrak na security-fix | ✅ Opgelost |
| BF-59 | `admin_users` view — `permission denied for table users` | ✅ Opgelost |

### Sessie 2026-05-25 (sessie 30)

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-56 | Race condition — i18n keys toonden als key-naam op abonnementen-pagina's | ✅ Opgelost |

### Sessie 2026-05-22 (sessie 29)

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-53 | Supabase: `auth_users_exposed` — `admin_users` view gedropt | ✅ Opgelost |
| BF-54 | Supabase: `rls_disabled_in_public` — RLS op 6 tabellen ingeschakeld | ✅ Opgelost |
| BF-55 | Supabase: `sensitive_columns_exposed` — anon REVOKED, grants minimaal | ✅ Opgelost |

### Sessie 2026-05-20 (sessie 28)

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-52 | `bronnen/template.html` — tabelheaders bleven NL na taalwissel naar EN/ES | ✅ Opgelost |

---

## Analytics

| ID | Omschrijving | Status |
|----|-------------|--------|
| AN-01 t/m AN-40 | trackPage() alle pagina's + dashboard | ✅ Gedaan |
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
| TD-07 | Resend zonder eigen domein — mail alleen naar Resend-account | 🟡 Middel |
| TD-08 | async/await mismatch — call-sites van storage.add() controleren | 🟡 Middel |
| TD-09 | `lang-link` handlers in `topbar.js` — vervangen door i18n.js, handlers verwijderen | 🟡 Middel |
| TD-11 | Import-parser leest rij 1 als header — moet rij 2 lezen na template.html meertalig | 🔴 Hoog |
