# BACKLOG.md — MyFamTreeCollab
## Bijgewerkt: 2026-05-15

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
| F8-01 | 🔴 Hoog | `js/i18n.js` v1.0.0 — core module aanmaken | ✅ Gedaan |
| F8-02 | 🔴 Hoog | `locales/{nl,en,es}/common.json` aanmaken | ✅ Gedaan |
| F8-03 | 🔴 Hoog | `locales/{nl,en,es}/home.json` aanmaken | ✅ Gedaan |
| F8-04 | 🔴 Hoog | `index.html` refactoren met `data-i18n` | ✅ Gedaan |
| F8-05 | 🔴 Hoog | `Layout/TopBar.html` — language switcher `<select>` | ✅ Gedaan |
| F8-06 | 🔴 Hoog | `Layout/Navbar.html` — `data-i18n="common:nav.*"` | ✅ Gedaan |
| F8-07 | 🔴 Hoog | `Layout/Footer.html` — `data-i18n="common:footer.supportVia"` | ✅ Gedaan |
| F8-08 | 🔴 Hoog | `locales/{nl,en,es}/create.json` aanmaken | ✅ Gedaan |
| F8-09 | 🔴 Hoog | `locales/{nl,en,es}/manage.json` aanmaken | ✅ Gedaan |
| F8-10 | 🔴 Hoog | `locales/{nl,en,es}/auth.json` aanmaken | ✅ Gedaan |
| F8-11 | 🟡 Middel | `home/create.html` refactoren met `data-i18n` | ✅ Gedaan |
| F8-12 | 🟡 Middel | `home/about.html` refactoren met `data-i18n` | ✅ Gedaan |
| F8-13 | 🟡 Middel | `stamboom/manage.html` refactoren met `data-i18n` | ✅ Gedaan |
| F8-14 | 🟡 Middel | `home/confirm.html` refactoren met `data-i18n` | ✅ Gedaan |
| F8-15 | 🟢 Laag | `lang-link` handlers verwijderen uit `topbar.js` (TD-09) | 📋 Open |
| F8-16 | 🟢 Laag | `common.meta.appName` opruimen uit `common.json` | ✅ Gedaan |
| F8-17 | 🟢 Laag | Automatische namespace detectie op basis van URL | 🔮 Toekomst |
| F8-18 | 🟢 Laag | Missing key logging activeren in development | 🔮 Toekomst |
| F8-19 | 🟢 Laag | `Handleiding.html` bijwerken met i18n uitleg | 📋 Open |
| F8-20 | 🟡 Middel | `home/import.html` refactoren met `data-i18n` + custom file input | ✅ Gedaan |
| F8-21 | 🟡 Middel | `home/export.html` refactoren met `data-i18n` | ✅ Gedaan |
| F8-22 | 🟡 Middel | `home/print.html` refactoren met `data-i18n` | ✅ Gedaan |
| F8-23 | 🟡 Middel | `locales/{nl,en,es}/about.json` aanmaken | ✅ Gedaan |
| F8-24 | 🟡 Middel | `locales/{nl,en,es}/print.json` aanmaken | ✅ Gedaan |
| F8-25 | 🟡 Middel | `locales/{nl,en,es}/import.json` aanmaken | ✅ Gedaan |
| F8-26 | 🟡 Middel | `locales/{nl,en,es}/export.json` aanmaken | ✅ Gedaan |
| F8-27 | 🟡 Middel | `js/import.js` statusmeldingen i18n | ✅ Gedaan |
| F8-28 | 🟡 Middel | `js/export.js` statusmeldingen i18n | ✅ Gedaan |
| F8-29 | 🟡 Middel | `js/create.js` statusmeldingen i18n | ✅ Gedaan |
| F8-30 | 🟡 Middel | `Docs/disclaimer.html` drietalig EN/NL/ES | ✅ Gedaan |
| F8-31 | 🟡 Middel | `Docs/privacy.html` drietalig EN/NL/ES | ✅ Gedaan |
| F8-32 | 🟡 Middel | `Docs/terms.html` drietalig EN/NL/ES | ✅ Gedaan |
| F8-33 | 🔴 Hoog | `stamboom/stats.html` refactoren met `data-i18n` | ✅ Gedaan |
| F8-34 | 🔴 Hoog | `stamboom/collab.html` + `js/collab.js` i18n | ✅ Gedaan |
| F8-35 | 🔴 Hoog | `stamboom/storage.html` refactoren met `data-i18n` | ✅ Gedaan |
| F8-36 | 🔴 Hoog | `stamboom/view.html` + `js/view.js` i18n | ✅ Gedaan |
| F8-37 | 🔴 Hoog | `stamboom/timeline.html` + `js/timeline.js` i18n | ✅ Gedaan |
| F8-38 | 🔴 Hoog | `js/auth.js` foutmeldingen via i18n | ✅ Gedaan |
| F8-39 | 🔴 Hoog | `js/topbar.js` modal via data-i18n | ✅ Gedaan |
| F8-40 | 🔴 Hoog | `home/reset.html` + `js/reset.js` i18n | ✅ Gedaan |

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

## Bugfixes

### Sessie 2026-05-15

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-41 | stats.html: KPI labels toonden raw keys — namespace niet ge-await'ed + DOM-timing | ✅ Opgelost |
| BF-42 | topbar.js: modal toonde raw keys — _injectModal() gebruikte _t() vóór namespace geladen was | ✅ Opgelost |
| BF-43 | topbar.js: loadNamespace('auth') in init() veroorzaakte updateContent() op hele DOM → pagina-keys overschreven | ✅ Opgelost |

### Sessie 2026-05-12

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-39 | Navbar toonde `nav.sub.*` als tekst — trailing comma in `common.json` + ontbrekende keys | ✅ Opgelost |
| BF-40 | Taalwissel werkte niet op Navbar — zelfde oorzaak als BF-39 | ✅ Opgelost |

### Sessie 2026-05-10

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-36 | i18n keys toonden letterlijk — dot i.p.v. colon als namespace separator | ✅ Opgelost |
| BF-37 | Taalwissel resette switcher | ✅ Opgelost |
| BF-38 | Namespace niet herladen na taalwissel | ✅ Opgelost |

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
| TD-06 | `home/import-en.html` laadt import.js zonder schema.js + storage.js | 🔴 Hoog |
| TD-07 | Resend zonder eigen domein — mail alleen naar Resend-account | 🟡 Middel |
| TD-08 | async/await mismatch — call-sites van storage.add() controleren | 🟡 Middel |
| TD-09 | `lang-link` handlers in `topbar.js` — vervangen door i18n.js, handlers verwijderen | 🟡 Middel |
| TD-10 | `page_visits` RLS uitgeschakeld — beveiligd via view | 🟡 Middel |
