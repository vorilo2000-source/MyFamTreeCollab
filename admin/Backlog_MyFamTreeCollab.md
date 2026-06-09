# BACKLOG.md — Backlog_MyFamTreeCollab
## Bijgewerkt: 09-06-2026

> Versie: v1.1.3 · 119 items

## [BACKLOG]

## Fase 0 — Audit & opschoning

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Startdatum | Einddatum | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|-----------|----------|------------|-----------|--------|
| F0-001 |  | ZIP bestand | ZIP bestand analyseren en alle bestanden inventariseren |  | Improvement |  |  |  | 🟡 Medium | ✅ Done |
| F0-002 |  | DeleteRow | js/DeleteRow.js` verwijderen (leeg bestand) |  | Bug |  |  |  | 🟡 Medium | ✅ Done |
| F0-003 |  | schemaGlobal.js | js/schemaGlobal.js` verwijderen (verouderd) |  | Bug |  |  |  | 🟡 Medium | ✅ Done |
| F0-004 |  | Dubbele functies | Alle dubbele functies in kaart brengen |  | Improvement |  |  |  | 🟡 Medium | ✅ Done |
| F0-005 |  | Kapotte bestanden identificeren |  |  | Improvement |  |  |  | 🟡 Medium | ✅ Done |
| FO-006 |  | Analytics (AN-01 t/m AN-40) | trackPage() alle pagina's + dashboard |  | Other |  |  |  | 🟡 Medium | ✅ Done |
| FF-007 |  | account.html (AN-21) | tracking toevoegen |  | Other |  |  |  | 🟡 Medium | ❌ Cancelled |

## Fase 1 — Structuur & centrale modules

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Startdatum | Einddatum | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|-----------|----------|------------|-----------|--------|
| F1-001 |  | idGenerator.js | `idGenerator.js` herbouwen als centrale module (v2.0.0) |  | Feature |  |  |  | 🟡 Medium | ✅ Done |
| F1-002 |  | utils.js | `utils.js` aanmaken met `safe()`, `formatDate()`, `parseBirthday()` |  | Improvement |  |  |  | 🟡 Medium | ✅ Done |
| F1-003 |  | Lokale | Lokale `safe()` verwijderen uit alle bestanden |  | Improvement |  |  |  | 🟡 Medium | ✅ Done |
| F1-004 |  | manage.js | `computeRelaties()` uit `manage.js` → centrale `relatieEngine.js` |  | Improvement |  |  |  | 🟡 Medium | ✅ Done |
| F1-005 |  | LiveSearch.js | volledig in IIFE wikkelen (bugfix safe already declared) |  | Feature |  |  |  | 🟡 Medium | ✅ Done |
| F1-006 |  | utils.js | als eerste script toevoegen aan alle pagina's |  | Improvement |  |  |  | 🟡 Medium | ✅ Done |
| F1-007 |  | relatieEngine.js | toevoegen aan `manage.html` (ontbrak) |  | Improvement |  |  |  | 🟡 Medium | ✅ Done |

## Fase 2 — Kapotte bestanden repareren

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Startdatum | Einddatum | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|-----------|----------|------------|-----------|--------|
| F2-001 |  | export.js | herschrijven als centrale module met CSV + JSON |  | Improvement |  |  |  | 🟡 Medium | ✅ Done |
| F2-002 |  | export.html | repareren: `storage.js` + `schema.js` laden |  | Improvement |  |  |  | 🟡 Medium | ✅ Done |
| F2-003 |  | export.html | uitbreiden met JSON-knop |  | Improvement |  |  |  | 🟡 Medium | ✅ Done |
| F2-004 |  | storage.html | exportcode vervangen door centrale `export.js` |  | Improvement |  |  |  | 🟡 Medium | ✅ Done |
| F2-005 |  | storage.html | Export JSON/CSV knoppen verwijderen uit `storage.html` |  | Improvement |  |  |  | 🟡 Medium | ✅ Done |
| F2-006 |  | storage.js | `migrate()` niet meer bij elke `get()` |  | Improvement |  |  |  | 🟡 Medium | ✅ Done |
| F2-007 |  | storage.js | `migrate()` geeft `null` bij ongeldig record |  | Bug |  |  |  | 🟡 Medium | ✅ Done |
| F2-008 |  | storage.js | `console.log` bij laden verwijderd |  | Bug |  |  |  | 🟡 Medium | ✅ Done |
| F2-009 |  | LSD.js | dubbele `DOMContentLoaded` |  | Other |  |  |  | 🟡 Medium | ❌ Cancelled |

## Fase 3 — UX<br>- Form voor task beheer<br> - Filtering & sorting<br><hr>## Fase 4 — Integratie<br>- Koppeling met MyFamTreeCollab<br><hr>## Fase 5 — Advanced<br>- Interactieve Gantt library<br>- Drag & drop<br> |  | Description |  |  |  |

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Startdatum | Einddatum | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|-----------|----------|------------|-----------|--------|
| F3-043 | 3b | Zoekfunctie | Zoekresultaten highlighten |  | Feature |  |  |  | 🔴 High | ❌ Cancelled |
| F3-044 | 3b | Zoekfunctie | Zoeken op meerdere velden tegelijk |  | Feature |  |  |  | 🔴 High | ✅ Done |
| F3-045 | 3b | Zoekfunctie | Popup-stijlen verplaatsen naar `style.css` |  | Feature |  |  |  | 🟡 Medium | 📋 Open |
| F3-046 | 3b | Zoekfunctie | Keyboard navigatie in zoek-popup |  | Feature |  |  |  | 🟡 Medium | 📋 Open |
| F3-047 | 3b | Zoekfunctie | Zoekgeschiedenis |  | Feature |  |  |  | 🟢 Low | 📋 Open |
| F3-048 | 3c | Relaties | Meerdere partners ondersteunen |  | Feature |  |  |  | 🔴 High | ✅ Done |
| F3-049 | 3c | Relaties | toevoegen vanuit `manage.html` |  | Feature |  |  |  | 🔴 High | 📋 Open |
| F3-050 | 3c | Relaties | Grootouders en kleinkinderen tonen in view.html |  | Feature |  |  |  | 🟡 Medium | 📋 Open |
| F3-051 | 3c | Relaties | Halfbroers/halfzussen correct onderscheiden |  | Feature |  |  |  | 🟡 Medium | 📋 Open |
| F3-052 | 3c | Relaties | Relatie-labels vertalen |  | Feature |  |  |  | 🟢 Low | 📋 Open |
| F3-053 | 3d | Stamboomvisualisatie | Verbindingslijnen tekenen (SVG of CSS) |  | Feature |  |  |  | 🔴 High | 🔮 Future |
| F3-054 | 3d | Stamboomvisualisatie | Foto/avatar toevoegen aan persoon-node |  | Feature |  |  |  | 🔴 High | 🔮 Future |
| F3-055 | 3d | Stamboomvisualisatie | Zoom en pan op de stamboomweergave |  | Feature |  |  |  | 🟡 Medium | 🔮 Future |
| F3-056 | 3d | Stamboomvisualisatie | Uitklappen/inklappen van takken |  | Feature |  |  |  | 🟢 Low | 🔮 Future |
| F3-057 | 3e | Tijdlijn | Overlijdensdatum tonen op tijdlijn |  | Feature |  |  |  | 🟢 Low | ✅ Done |
| F3-058 | 3e | Tijdlijn | Levensspanne als balk weergeven |  | Feature |  |  |  | 🟡 Medium | 🔮 Future |
| F3-59 | 3E | Tijdlijn | Schaalbare tijdas |  | Feature |  |  |  | 🟡 Medium | 🔮 Future |
| F3-060 | 3e | Tijdlijn | Historische gebeurtenissen toevoegen |  | Feature |  |  |  | 🟡 Medium | 🔮 Future |
| F3-061 | 3f | Import / export | `import.js` herschrijven met inline commentaar |  | Feature |  |  |  | 🔴 High | ✅ Done |
| F3-062 | 3f | Import / export | Import validatie: dubbele ID's detecteren |  | Feature |  |  |  | 🔴 High | 📋 Open |
| F3-063 | 3f | Import / export | Import preview tonen vóór opslaan |  | Feature |  |  |  | 🟡 Medium | 📋 Open |
| F3-064 | 3f | Import / export | GEDCOM-formaat importeren |  | Feature |  |  |  | 🟡 Medium | 📋 Open |
| F3-068 | 3h | Kernfeatures verbeteren | `stamboom/stats.html` JS verplaatsen naar apart `stats.js` |  | Feature |  |  |  | 🔴 High | 📋 Open |
| F3-069 | 3h | Kernfeatures verbeteren | `home/print.html` implementeren |  | Feature |  |  |  | 🔴 High | 📋 Open |
| F3-070 | 3h | Kernfeatures verbeteren | `schema.js` herschrijven met inline commentaar |  | Feature |  |  |  | 🟢 Low | 📋 Open |
| F3-065 | 3f, sessie, 34 | import.js | `import.js` v2.2.0 — legacy CSV (19 kolommen) werd niet herkend, parser gebruikte eigen object-bouw i.p.v. schema.normalizeHeader() + schema.fromCSV() |  | Bug | 2026-05-29 | 2026-05-29 |  | 🟡 Medium | ✅ Done |

## Fase 5 — Cloud & accounts

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Startdatum | Einddatum | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|-----------|----------|------------|-----------|--------|
| F5-001/-008 |  | Cloud & accounts | Supabase, accounts, sync, delen, versiegeschiedenis |  | Feature |  |  |  | 🟡 Medium | ✅ Done |
| F5-009 |  | Cloud & accounts | Promotiecodes voor cloud toegang |  | Feature |  |  |  | 🟡 Medium | 📋 Open |
| F5-010 |  | Cloud & accounts | Abonnementen en betaaltiers verder uitwerken → Fase 7 |  | Feature |  |  |  | 🟡 Medium | 🔍 Review |
| F5-011 |  | Cloud & accounts | Ko-fi webhook integratie voor donateur-badge  → Fase 7 |  | Improvement |  |  |  | 🟡 Medium | 🔍 Review |

## Fase 6 — Rolmodel implementatie

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Startdatum | Einddatum | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|-----------|----------|------------|-----------|--------|
| F6-001/-020 |  | Rolmodel | Rolmodel, demo database, upgrade flow, versiebeheer, handleiding |  | Feature |  |  |  | 🟡 Medium | ✅ Done |

## Fase 7 — Businessmodel & betaling

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Startdatum | Einddatum | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|-----------|----------|------------|-----------|--------|
| F7-001/-006 |  | Donatie | Stripe, Ko-fi, prijsstelling |  | Feature |  |  |  | 🟡 Medium | 🔮 Future |

## Fase 8 — Internationalisatie (i18n)

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Startdatum | Einddatum | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|-----------|----------|------------|-----------|--------|
| F8-001/-016 |  | i18n | Core i18n module, common/home/create/manage/auth locales |  | Feature |  |  |  | 🟡 Medium | ✅ Done |
| F8-017 |  | Namespace detectie | Automatische namespace detectie op basis van URL |  | Feature |  |  |  | 🟢 Low | 🔮 Future |
| F8-018 |  | Key logging activeren | Missing key logging activeren in development |  | Feature |  |  |  | 🟢 Low | 🔮 Future |
| F8-019 |  | handleiding html | `handleiding-nl.html` bijwerken met i18n uitleg |  | Feature |  |  |  | 🟡 Medium | ❌ Cancelled |
| F8-020/-055 |  | i18n | Start/Stamboom/Bronnen/Gemeenschap/Develop/Abonnementen i18n |  | Feature |  |  |  | 🟡 Medium | ✅ Done |
| F8-056 |  | Schema | Import-parser aanpassen: rij 2 lezen als technische header (schema.js) |  | Feature |  |  |  | 🔴 High | ✅ Done |
| F8-057/-062 |  | template.html | template.html taalwissel + abonnementen namespaces + supabaseAnalyse key |  | Feature |  |  |  | 🟡 Medium | ✅ Done |
| F8-015 |  | topbar.js | `lang-link` handlers verwijderen uit `topbar.js` (TD-09) — handlers waren al verwijderd in eerdere sessie |  | Feature |  |  |  | 🟡 Medium | ✅ Done |
| F8-0063 | sessie, 30 | i18n | Race condition — i18n keys toonden als key-naam op abonnementen-pagina's |  | Bug | 2026-05-25 | 2026-05-25 |  | 🟡 Medium | ✅ Done |
| FB-001 | sessie, 28 | template.html | tabelheaders bleven NL na taalwissel naar EN/ES |  | Bug | 2026-05-20 | 2026-02-20 |  | 🟡 Medium | ✅ Done |

## Fase 9 — Bronnen (genealogisch onderzoek)

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Startdatum | Einddatum | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|-----------|----------|------------|-----------|--------|
| F9-001 |  | Bronnen-datamodel | Ontwerp bronnen-datamodel (Supabase tabel `bronnen`) |  | Feature |  |  |  | 🔴 High | 📋 Open |
| F9-002 |  | Beheer | `stamboom/bronnen.html` aanmaken — overzicht en beheer |  | Feature |  |  |  | 🔴 High | 📋 Open |
| F9-003 |  | bronnen.js | `js/bronnen.js` aanmaken — CRUD voor bronnen |  | Feature |  |  |  | 🔴 High | 📋 Open |
| F9-004 |  | manage.html | Bron koppelen aan persoon in `manage.html` |  | Feature |  |  |  | 🟡 Medium | 📋 Open |
| F9-005 |  | view.html | Bronnen tonen in `view.html` per persoon |  | Feature |  |  |  | 🟡 Medium | 📋 Open |
| F9-006 |  | Brontypen | Brontypen: boek, archief, website, mondelinge overlevering |  | Feature |  |  |  | 🟡 Medium | 📋 Open |
| F9-007 |  | locales | `locales/{nl,en,es}/bronnen.json` aanmaken |  | Feature |  |  |  | 🟡 Medium | 📋 Open |
| F9-008 |  | archieflink | Extern archieflink valideren (URL check) |  | Feature |  |  |  | 🟢 Low | 📋 Open |
| F9-009 |  | GEDCOM | Bron exporteren als onderdeel van GEDCOM |  | Feature |  |  |  | 🟢 Low | 📋 Open |

## Fase 10 — Admin toegangsbeveiliging

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Startdatum | Einddatum | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|-----------|----------|------------|-----------|--------|
| F10-001 |  | accountbeheer.html | `admin/accountbeheer.html` — admin-check + uitlog-redirect |  | Feature |  |  |  | 🔴 High | ✅ Done |
| F10-002 |  | analytics.html | `admin/analytics.html` — admin-check + uitlog-redirect |  | Feature |  |  |  | 🔴 High | ✅ Done |
| F10-003 |  | analyse.html | `admin/analyse.html` — admin-check + uitlog-redirect |  | Feature |  |  |  | 🔴 High | ✅ Done |
| F10-004 | sessie, 32, 33 | supabase-analyse.html | 1. `admin/supabase-analyse.html`<br>— inline check vervangen door `adminGuard.js` `AdminGuard.protect()`, `#dashboard` → `#page-content`.<br><hr>2. Storage-secties toonden "geen data" omdat app geen Supabase Storage gebruikt. |  | Bug | 2026-05-28 | 2026-05-28 |  | 🟡 Medium | ✅ Done |
| F10-005 |  | adminGuard.js | `js/adminGuard.js` — centrale herbruikbare guard module |  | Feature |  |  |  | 🟡 Medium | ✅ Done |
| F10-006 |  | blank.html | `develop/blank.html` — developer-only toegang via `adminGuard.js` |  | Feature |  |  |  | 🟢 Low | ✅ Done |
| F10-007 |  | sandbox.html | `develop/sandbox.html` — developer-only toegang via `adminGuard.js` |  | Feature |  |  |  | 🟢 Low | ✅ Done |
| F10-008 |  | standaardpagina.html | `develop/standaardpagina.html` — developer-only toegang via `adminGuard.js` |  | Feature |  |  |  | 🟢 Low | ✅ Done |
| F10-000 |  | Description | **Patroon:** `AdminGuard.protect(role)` via centrale `adminGuard.js` module.<br> - Tier !== 'admin' → `#accessDenied` zichtbaar, `#page-content` verborgen, uitvoering gestopt.<br>- Tier === 'admin' → `#page-content` zichtbaar, `onAuthChange` listener actief.  - Bij `SIGNED_OUT` → redirect naar `index.html` |  | Description |  |  |  | 🟡 Medium | 🔍 Review |
| F10-009 | sessie, 31 | developer menu | Admin/developer menu verborgen na security-fix — recursieve RLS op `profiles` |  | Bug | 2026-05-26 | 2026-05-26 |  | 🟡 Medium | ✅ Done |
| F10-010 | sessie, 31 | accountbeheer.html | admin_users` view ontbrak na security-fix |  | Bug | 2026-05-26 | 2026-05-26 |  | 🟡 Medium | ✅ Done |
| F10-011 | sessie, 31 | admin_users | view — `permission denied for table users |  | Bug | 2026-05-26 | 2026-05-26 |  | 🟡 Medium | ✅ Done |
| F10-012 | sessie, 29 | Supabase | auth_users_exposed` — `admin_users` view gedropt |  | Bug | 2026-05-22 | 2026-05-22 |  | 🟡 Medium | 🔍 Review |
| F10-013 | sessie, 29 | Supabase | rls_disabled_in_public` — RLS op 6 tabellen ingeschakeld |  | Bug | 2026-05-22 | 2026-05-22 |  | 🟡 Medium | ✅ Done |
| F10-014 | sessie, 29 | Supabase | `sensitive_columns_exposed` — anon REVOKED, grants minimaal |  | Bug | 2026-05-22 | 2026-05-22 |  | 🟡 Medium | ✅ Done |
| F10-015 | sessie, 33 | supabase-analyse.html | `supabase-analyse.html` — inline `AuthModule.getTier()` check vervangen door `AdminGuard.protect()`, `#dashboard` → `#page-content` |  | Bug | 2026-05-29 | 2026-05-29 |  | 🟡 Medium | ✅ Done |
| F10-015 | sessie, 33 | supabase-analyse.html | `supabase-analyse.html` — inline `AuthModule.getTier()` check vervangen door `AdminGuard.protect()`, `#dashboard` → `#page-content` |  | Bug | 2026-05-29 | 2026-05-29 |  | 🟡 Medium | ✅ Done |
| F10-016 | sessie, 38 | agendaStore.js | Centrale agenda store — brug tussen alle admin modules en agenda.html. register(), sync(), getAll() |  | Feature | 2026-06-08 | 2026-06-08 |  | 🔴 High | ✅ Done |
| F10-017 | sessie, 38 | agenda.html | Centrale agenda v1.1.0 — maand/week/dag, kleurcodering per bron, filter op bron+status+zoek, standalone events met herhaling, .ics export + import, conflict modal |  | Feature | 2026-06-08 | 2026-06-08 |  | 🔴 High | ✅ Done |
| F10-018 | sessie, 38 | backlog.html | v5.2.0 → v5.3.0 — kalender en KPI tabs verwijderd, agendaStore.js geladen, AgendaStore.sync() na elke _save(), "In agenda" stat-card, 📅 indicator |  | Improvement | 2026-06-08 | 2026-06-08 |  | 🔴 High | ✅ Done |
| F10-019 | sessie, 38 | backlog.html | v5.1.0 → v5.2.0 — tabs Backlog/Kalender/KPI's, kalender maand/week/dag, items als blok start-eind, KPI modal met naam+beschrijving tooltip+metriek-type+maand/kwartaal/jaar |  | Feature | 2026-06-08 | 2026-06-08 |  | 🟡 Medium | ✅ Done |

## Fase A — Account & donaties

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Startdatum | Einddatum | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|-----------|----------|------------|-----------|--------|
| FA-001/022 |  | Account & donaties | Account, auth, Ko-fi, admin, bevestigingsmail |  | Other |  |  |  | 🟡 Medium | ✅ Done |
| FA-022/-032 |  | Cloud backup | Cloud sync, tiers, rollen |  | Feature |  |  |  | 🟡 Medium | ✅ Done |

## Beveiliging

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Startdatum | Einddatum | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|-----------|----------|------------|-----------|--------|
| SEC-001 |  | admin_users | `admin_users` view droppen — lekte auth.users via publieke API |  | Feature |  |  |  | 🔴 High | ✅ Done |
| SEC-002 |  | RLS inschakelen | RLS inschakelen op alle publieke tabellen (6 tabellen) |  | Feature |  |  |  | 🔴 High | ✅ Done |
| SEC-003 |  | Anon-rechten / authenticated | Anon-rechten intrekken + authenticated grants minimaliseren |  | Feature |  |  |  | 🔴 High | ✅ Done |
| SEC-004 |  | Editor-rol schrijfrecht op `stambomen` via `stamboom_gedeeld.rol` | Editor-rol schrijfrecht op `stambomen` via `stamboom_gedeeld.rol` (RLS was al correct, dubbele policies opgeruimd) |  | Feature |  |  |  | 🟡 Medium | ✅ Done |

## Technische schuld

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Startdatum | Einddatum | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|-----------|----------|------------|-----------|--------|
| TD-001 |  | Sandbox.js | testbestand in repo |  | Tech Debt |  |  |  | 🟢 Low | 📋 Open |
| TD-002 |  | script.js | doet alleen console.log |  | Tech Debt |  |  |  | 🟡 Medium | 📋 Open |
| TD-003 |  | LSD.js | dubbele DOMContentLoaded |  | Feature | Tech Debt |  |  | 🟡 Medium | 📋 Open |
| TD-004 |  | Layout/*.html | via fetch() — werkt niet op file:// |  | Tech Debt |  |  |  | 🟡 Medium | 📋 Open |
| TD-005 |  | LiveSearch.js | Popup-stijlen in LiveSearch.js hardcoded inline |  | Tech Debt |  |  |  | 🟢 Low | 📋 Open |
| TD-007 |  | Resend | Resend zonder eigen domein — mail alleen naar Resend-account |  | Tech Debt |  |  |  | 🟡 Medium | 📋 Open |
| TD-008 |  | async/await mismatch | async/await mismatch — call-sites van storage.add() controleren |  | Tech Debt |  |  |  | 🟡 Medium | 📋 Open |
| TD-009 |  | topbar.j | `lang-link` handlers in `topbar.js` — vervangen door i18n.js, handlers verwijderen |  | Tech Debt |  |  |  | 🟡 Medium | ✅ Done |
| TD-011 |  | template.html | Import-parser leest rij 1 als header — moet rij 2 lezen na template.html me |  | Tech Debt |  |  |  | 🔴 High | ✅ Done |

## Supabase — Action, task & backlog

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Startdatum | Einddatum | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|-----------|----------|------------|-----------|--------|
| SD-001 |  | Projectoverzicht | ## 🎯 **Doel**<br>Het ontwikkelen van een dynamische, realtime Gantt chart applicatie gebaseerd op Supabase als backend en een JavaScript frontend (Mermaid of alternatieve Gantt library).<br><hr> ## 🧱 **Scope** <br> - Takenbeheer (CRUD) <br>  - Visualisatie via Gantt chart <br> - Realtime updates via Supabase <br> - Integratie met MyFamTreeCollab<br> <hr> ## 🚫 **Out of scope** (fase 1) <br> - Drag & drop planning <br> - Complex  resource management <br> - Multi-tenant enterprise features |  | Description |  |  |  | 🔴 High | 🔍 Review |
| SD-002 |  | Architectuur | ## **Backend**<br>- Supabase (PostgreSQL)<br>- Realtime subscriptions<br>- Row Level Security (RLS)<br><hr>## **Frontend**<br>- HTML + JavaScript<br> - Mermaid (fase 1)<br> - Eventueel upgrade naar inte**ractieve** Gantt lib<br><hr>## Datastroom<br>- User action → Supabase DB → Realtime → Frontend → Render Gantt<br> |  | Description |  |  |  | 🔴 High | 🔍 Review |
| SD-004 |  | Security (RLS) | ## **Basis policies**<br> - Users kunnen enkel eigen taken zien<br> - Admin kan alles beheren<br> Voorbeeld: <br> [sql]<br> CREATE POLICY "Users can view own tasks"<br> ON tasks<br> FOR SELECT<br> USING (auth.uid() = user_id);<br> |  | Description |  |  |  | 🟡 Medium | 🔍 Review |
| SD-005 |  | Functionaliteiten | ## Core features<br> - Taken aanmaken<br> - Taken wijzigen<br>- Taken verwijderen<br> - Gantt visualisatie<br> - Realtime updates<br> <hr> ## UI features<br>- Section grouping<br>- Status indicators<br>- Timeline view<br> |  | Description |  |  |  | 🟡 Medium | 🔍 Review |
| SD-008 |  | KPI’s | - Laadtijd < 2s<br>- Realtime latency < 500ms<br>- 99% uptime<br> |  | Description |  |  |  | 🟡 Medium | 🔍 Review |
| SD-009 |  | Deployment | ## Omgevingen<br>- dev<br>- staging<br>- prod<br><hr>## Hosting<br>- Frontend: GitHub Pages / Vercel<br>- Backend: Supabase<br> |  | Description |  |  |  | 🔴 High | 🔍 Review |
| SD-010 |  | Volgende stappen | 1. Supabase project aanmaken<br>2. Database schema implementeren<br>3. Basis frontend bouwen<br>4. Eerste Gantt render testen<br> |  | Description |  |  |  | 🟡 Medium | 🔍 Review |

## Instructies — Beschrijving van instructies voor uitvoering van taken

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Startdatum | Einddatum | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|-----------|----------|------------|-----------|--------|
| ID-001 |  | Taak is klaar als: | Een taak is **klaar** als:<br>- [ ] De code werkt zoals bedoeld<br>- [ ] Inline commentaar aanwezig op elke coderegel<br>- [ ] Bestandsheader bijgewerkt met versienummer (v2.0.0+)<br>- [ ] `PROJECT_LOG.md` bijgewerkt<br>- [ ] `BACKLOG.md` bijgewerkt: taak op ✅ Gedaan<br>- [ ] Getest in de browser (geen console-errors)<br> |  | Description |  |  |  | 🔴 High | 🔍 Review |
| ID-002 |  | Werkwijze Claude Code | Alle code-wijzigingen via Claude Code for VS Code.<br>**Process:**<br>1. Open project in VS Code<br>2. Geef opdracht in Claude Code chat<br>3. Claude Code leest/schrijft bestanden direct<br>4. Test in browser<br>5. `git add` + `git commit -m "beschrijving"` + `git push` |  | Description |  |  |  | 🔴 High | 🔍 Review |

