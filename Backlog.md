# BACKLOG.md — Backlog_MyFamTreeCollab
## Bijgewerkt: 29-05-2026

> Versie: V1.0.0 · 106 items

## Fase 0 — Audit & opschoning

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|------------|-----------|--------|
| F0-01 |  | ZIP analyseren en alle bestanden inventariseren |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F0-02 |  | `js/DeleteRow.js` verwijderen (leeg bestand) |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F0-03 |  | `js/schemaGlobal.js` verwijderen (verouderd) |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F0-04 |  | Alle dubbele functies in kaart brengen |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F0-05 |  | Kapotte bestanden identificeren |  |  | Feature |  | 🟡 Medium | ✅ Done |

## Fase 1 — Structuur & centrale modules

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|------------|-----------|--------|
| F1-01 |  | `idGenerator.js` herbouwen als centrale module (v2.0.0) |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F1-02 |  | `utils.js` aanmaken met `safe()`, `formatDate()`, `parseBirthday()` |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F1-03 |  | Lokale `safe()` verwijderen uit alle bestanden |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F1-04 |  | `computeRelaties()` uit `manage.js` → centrale `relatieEngine.js` |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F1-05 |  | `LiveSearch.js` volledig in IIFE wikkelen (bugfix safe already declared) |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F1-06 |  | `utils.js` als eerste script toevoegen aan alle pagina's |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F1-07 |  | `relatieEngine.js` toevoegen aan `manage.html` (ontbrak) |  |  | Feature |  | 🟡 Medium | ✅ Done |

## Fase 2 — Kapotte bestanden repareren

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|------------|-----------|--------|
| F2-01 |  | `export.js` herschrijven als centrale module met CSV + JSON |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F2-02 |  | `export.html` repareren: `storage.js` + `schema.js` laden |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F2-03 |  | `export.html` uitbreiden met JSON-knop |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F2-04 |  | `storage.html` exportcode vervangen door centrale `export.js` |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F2-05 |  | Export JSON/CSV knoppen verwijderen uit `storage.html` |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F2-06 |  | `storage.js`: `migrate()` niet meer bij elke `get()` |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F2-07 |  | `storage.js`: `migrate()` geeft `null` bij ongeldig record |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F2-08 |  | `storage.js`: `console.log` bij laden verwijderd |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F2-09 |  | `js/LSD.js` dubbele `DOMContentLoaded` |  |  | Feature |  | 🟡 Medium | ❌ Cancelled |

## Fase 3 — Kernfeatures verbeteren

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|------------|-----------|--------|
| F3-43 | 3B | Zoekresultaten highlighten |  |  | Feature |  | 🔴 High | ❌ Cancelled |
| F3-44 | 3B | Zoeken op meerdere velden tegelijk |  |  | Feature |  | 🔴 High | ✅ Done |
| F3-45 | 3B | Popup-stijlen verplaatsen naar `style.css` |  |  | Feature |  | 🟡 Medium | 📋 Open |
| F3-46 | 3B | Keyboard navigatie in zoekpopup |  |  | Feature |  | 🟡 Medium | 📋 Open |
| F3-47 | 3B | Zoekgeschiedenis |  |  | Feature |  | 🟢 Low | 📋 Open |
| F3-48 | 3C | Meerdere partners ondersteunen |  |  | Feature |  | 🔴 High | ✅ Done |
| F3-49 | 3C | Relatie toevoegen vanuit `manage.html` |  |  | Feature |  | 🔴 High | 📋 Open |
| F3-50 | 3C | Grootouders en kleinkinderen tonen in view.html |  |  | Feature |  | 🟡 Medium | 📋 Open |
| F3-51 | 3C | Halfbroers/halfzussen correct onderscheiden |  |  | Feature |  | 🟡 Medium | 📋 Open |
| F3-52 | 3C | Relatie-labels vertalen |  |  | Feature |  | 🟢 Low | 📋 Open |
| F3-53 | 3D | Verbindingslijnen tekenen (SVG of CSS) |  |  | Feature |  | 🔴 High | 🔮 Future |
| F3-54 | 3D | Foto/avatar toevoegen aan persoon-node |  |  | Feature |  | 🔴 High | 🔮 Future |
| F3-55 | 3D | Zoom en pan op de stamboomweergave |  |  | Feature |  | 🟡 Medium | 🔮 Future |
| F3-56 | 3D | Uitklappen/inklappen van takken |  |  | Feature |  | 🟢 Low | 🔮 Future |
| F3-57 | 3E | Overlijdensdatum tonen op tijdlijn |  |  | Feature |  | 🔴 High | ✅ Done |
| F3-58 | 3E | Levensspanne als balk weergeven |  |  | Feature |  | 🟡 Medium | 🔮 Future |
| F3-59 | 3E | Schaalbare tijdas |  |  | Feature |  | 🟡 Medium | 🔮 Future |
| F3-60 | 3E | Historische gebeurtenissen toevoegen |  |  | Feature |  | 🟢 Low | 🔮 Future |
| F3-61 | 3F | `import.js` herschrijven met inline commentaar |  |  | Feature |  | 🔴 High | ✅ Done |
| F3-62 | 3F | Import validatie: dubbele ID's detecteren |  |  | Feature |  | 🔴 High | ✅ Done |
| F3-63 | 3F | Import preview tonen vóór opslaan |  |  | Feature |  | 🟡 Medium | 📋 Open |
| F3-64 | 3F | GEDCOM-formaat importeren |  |  | Feature |  | 🟡 Medium | 📋 Open |
| F3-68 | 3H | `stamboom/stats.html` JS verplaatsen naar apart `stats.js` |  |  | Feature |  | 🟡 Medium | 📋 Open |
| F3-69 | 3H | `home/print.html` implementeren |  |  | Feature |  | 🟡 Medium | 📋 Open |
| F3-70 | 3H | `schema.js` herschrijven met inline commentaar |  |  | Feature |  | 🟢 Low | 📋 Open |

## Fase 8 — Internationalisatie (i18n)

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|------------|-----------|--------|
| F8-01 t/m F8-16 |  | Core i18n module, common/home/create/manage/auth locales |  |  | Feature |  | 🟢 Low | ✅ Done |
| F8-17 |  | Automatische namespace detectie op basis van URL |  |  | Feature |  | 🟢 Low | 🔮 Future |
| F8-18 |  | Missing key logging activeren in development |  |  | Feature |  | 🟢 Low | 🔮 Future |
| F8-19 |  | `handleiding-nl.html` bijwerken met i18n uitleg |  |  | Feature |  | 🟢 Low | ❌ Cancelled |
| F8-20 t/m F8-55 |  | Start/Stamboom/Bronnen/Gemeenschap/Develop/Abonnementen i18n |  |  | Feature |  | 🟢 Low | ✅ Done |
| F8-56 |  | Import-parser aanpassen: rij 2 lezen als technische header (schema.js) |  |  | Feature |  | 🔴 High | ✅ Done |
| F8-57 t/m F8-62 |  | template.html taalwissel + abonnementen namespaces + supabaseAnalyse key |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F8-15 |  | `lang-link` handlers verwijderen uit `topbar.js` (TD-09) |  |  | Feature |  | 🟢 Low | ✅ Done |

## Fase 9 — Bronnen (genealogisch onderzoek)

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|------------|-----------|--------|
| F9-01 |  | Ontwerp bronnen-datamodel (Supabase tabel `bronnen`) |  |  | Feature |  | 🔴 High | 📋 Open |
| F9-02 |  | `stamboom/bronnen.html` aanmaken — overzicht en beheer |  |  | Feature |  | 🔴 High | 📋 Open |
| F9-03 |  | `js/bronnen.js` aanmaken — CRUD voor bronnen |  |  | Feature |  | 🔴 High | 📋 Open |
| F9-04 |  | Bron koppelen aan persoon in `manage.html` |  |  | Feature |  | 🟡 Medium | 📋 Open |
| F9-05 |  | Bronnen tonen in `view.html` per persoon |  |  | Feature |  | 🟡 Medium | 📋 Open |
| F9-06 |  | Brontypen: boek, archief, website, mondelinge overlevering |  |  | Feature |  | 🟡 Medium | 📋 Open |
| F9-07 |  | `locales/{nl,en,es}/bronnen.json` aanmaken |  |  | Feature |  | 🟡 Medium | 📋 Open |
| F9-08 |  | Extern archieflink valideren (URL check) |  |  | Feature |  | 🟢 Low | 📋 Open |
| F9-09 |  | Bron exporteren als onderdeel van GEDCOM |  |  | Feature |  | 🟢 Low | 📋 Open |

## Fase 10 — Admin toegangsbeveiliging — AdminGuard.protect(role) via centrale adminGuard.js

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|------------|-----------|--------|
| F10-01 |  | `admin/accountbeheer.html` — admin-check + uitlog-redirect |  |  | Feature |  | 🔴 High | ✅ Done |
| F10-02 |  | `admin/analytics.html` — admin-check + uitlog-redirect |  |  | Feature |  | 🔴 High | ✅ Done |
| F10-03 |  | `admin/analyse.html` — admin-check + uitlog-redirect |  |  | Feature |  | 🔴 High | ✅ Done |
| F10-04 |  | `admin/supabase-analyse.html` — inline check vervangen door `adminGuard.js` |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F10-05 |  | `js/adminGuard.js` — centrale herbruikbare guard module |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F10-06 |  | `develop/blank.html` — developer-only toegang via `adminGuard.js` |  |  | Feature |  | 🟢 Low | ✅ Done |
| F10-07 |  | `develop/sandbox.html` — developer-only toegang via `adminGuard.js` |  |  | Feature |  | 🟢 Low | ✅ Done |
| F10-08 |  | `develop/standaardpagina.html` — developer-only toegang via `adminGuard.js` |  |  | Feature |  | 🟢 Low | ✅ Done |

## Fase A — Account & donaties

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|------------|-----------|--------|
| FA-01 t/m FA-22 |  | Account, auth, Ko-fi, admin, bevestigingsmail |  |  | Feature |  | 🟡 Medium | ✅ Done |

## Fase A+ — Cloud backup

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|------------|-----------|--------|
| FA+-01 t/m FA+-10 |  | Cloud sync, tiers, rollen, beveiliging |  |  | Feature |  | 🟡 Medium | ✅ Done |

## Fase 5 — Cloud & accounts

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|------------|-----------|--------|
| F5-01 t/m F5-08 |  | Supabase, accounts, sync, delen, versiegeschiedenis |  |  | Feature |  | 🟡 Medium | ✅ Done |
| F5-09 |  | Promotiecodes voor cloud toegang |  |  | Feature |  | 🟡 Medium | 🔮 Future |
| F5-10 |  | Abonnementen en betaaltiers verder uitwerken |  |  | Feature |  | 🟡 Medium | 📋 Open |
| F5-11 |  | Ko-fi webhook integratie voor donateur-badge |  |  | Feature |  | 🟡 Medium | 📋 Open |

## Fase 6 — Rolmodel implementatie

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|------------|-----------|--------|
| F6-01 t/m F6-20 |  | Rolmodel, demo database, upgrade flow, versiebeheer, handleiding |  |  | Feature |  | 🟡 Medium | ✅ Done |

## Fase 7 — Businessmodel & betaling

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|------------|-----------|--------|
| F7-01 t/m F7-06 |  | Stripe, Ko-fi, prijsstelling |  |  | Feature |  | 🟡 Medium | 🔮 Future |

## Beveiliging

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|------------|-----------|--------|
| SEC-01 |  | `admin_users` view droppen — lekte auth.users via publieke API |  |  | Feature |  | 🔴 High | ✅ Done |
| SEC-02 |  | RLS inschakelen op alle publieke tabellen (6 tabellen) |  |  | Feature |  | 🔴 High | ✅ Done |
| SEC-03 |  | Anon-rechten intrekken + authenticated grants minimaliseren |  |  | Feature |  | 🔴 High | ✅ Done |
| SEC-04 |  | Editor-rol schrijfrecht op `stambomen` via `stamboom_gedeeld.rol` |  |  | Feature |  | 🟡 Medium | ✅ Done |

## Analytics

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|------------|-----------|--------|
| AN-01 t/m AN-40 |  | trackPage() alle pagina's + dashboard |  |  | Feature |  | 🟡 Medium | ✅ Done |
| AN-21 |  | `stamboom/account.html` — tracking toevoegen |  |  | Feature |  | 🟡 Medium | ❌ Cancelled |

## Technische schuld

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|------------|-----------|--------|
| TD-01 |  | `js/Sandbox.js` — testbestand in repo |  |  | Feature |  | 🟡 Medium | 📋 Open |
| TD-02 |  | `js/script.js` — doet alleen console.log |  |  | Feature |  | 🟡 Medium | 📋 Open |
| TD-03 |  | `js/LSD.js` — dubbele DOMContentLoaded |  |  | Feature |  | 🟡 Medium | 📋 Open |
| TD-04 |  | `Layout/*.html` via fetch() — werkt niet op file:// |  |  | Feature |  | 🟡 Medium | 📋 Open |
| TD-05 |  | Popup-stijlen in LiveSearch.js hardcoded inline |  |  | Feature |  | 🟡 Medium | 📋 Open |
| TD-07 |  | Resend zonder eigen domein — mail alleen naar Resend-account |  |  | Feature |  | 🟡 Medium | 📋 Open |
| TD-08 |  | async/await mismatch — call-sites van storage.add() controleren |  |  | Feature |  | 🟡 Medium | 📋 Open |
| TD-09 |  | `lang-link` handlers in `topbar.js` vervangen door i18n.js |  |  | Feature |  | 🟡 Medium | ✅ Done |
| TD-11 |  | Import-parser leest rij 1 als header — moet rij 2 lezen na template.html meertalig |  |  | Feature |  | 🟡 Medium | ✅ Done |

## Bugfixes — Uitgevoerde sessies

| ID | Tags | Taak | Omschrijving | AI suggestie | Type | Toegewezen | Prioriteit | Status |
|----|------|------|--------------|-------------|------|------------|-----------|--------|
| BF-62 | 34 | `import.js` v2.2.0 — legacy CSV (19 kolommen) werd niet herkend | Sessie 34 - 2026-05-29 |  | Bug |  | 🟡 Medium | ✅ Done |
| BF-61 | 33 | `supabase-analyse.html` — inline check vervangen door AdminGuard.protect() | Sessie 33 - 2026-05-29 |  | Bug |  | 🟡 Medium | ✅ Done |
| BF-60 | 32 | `supabase-analyse.html` — Storage-secties toonden geen data | Sessie 32 - 2026-05-28 |  | Bug |  | 🟡 Medium | ✅ Done |
| BF-57 | 31 | Admin/developer menu verborgen na security-fix — recursieve RLS op profiles | Sessie 31 - 2026-05-26 |  | Bug |  | 🟡 Medium | ✅ Done |
| BF-58 | 31 | `accountbeheer.html` — admin_users view ontbrak na security-fix | Sessie 31 - 2026-05-26 |  | Bug |  | 🟡 Medium | ✅ Done |
| BF-59 | 31 | `admin_users` view — permission denied for table users | Sessie 31 - 2026-05-26 |  | Bug |  | 🟡 Medium | ✅ Done |
| BF-56 | 30 | Race condition — i18n keys toonden als key-naam op abonnementen-pagina's | Sessie 30 - 2026-05-25 |  | Bug |  | 🟡 Medium | ✅ Done |
| BF-53 | 29 | Supabase: auth_users_exposed — admin_users view gedropt | Sessie 29 - 2026-05-22 |  | Bug |  | 🟡 Medium | ✅ Done |
| BF-54 | 29 | Supabase: rls_disabled_in_public — RLS op 6 tabellen ingeschakeld | Sessie 29 - 2026-05-22 |  | Bug |  | 🟡 Medium | ✅ Done |
| BF-55 | 29 | Supabase: sensitive_columns_exposed — anon REVOKED, grants minimaal | Sessie 29 - 2026-05-22 |  | Bug |  | 🟡 Medium | ✅ Done |
| BF-52 | 28 | `bronnen/template.html` — tabelheaders bleven NL na taalwissel naar EN/ES | Sessie 28 - 2026-05-20 |  | Bug |  | 🟡 Medium | ✅ Done |
