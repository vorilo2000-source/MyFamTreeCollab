# MyFamTreeCollab — Project Log
## Bijgewerkt: 2026-06-01

> Chronologisch overzicht van alle sessies en wijzigingen.

---

## Sessie 36 — Kleurschema synchroniseren + colorHelper.js

**Datum:** 2026-06-01

### Doel
Consistente kleurcodering over manage, view en timeline via één centrale bron van waarheid.

### colorHelper.js — nieuw bestand (v1.0.0)
- `BASE_COLORS` object — gespiegeld van RelationColors.css
- `lightenColor(hex, percent)` — kleur X% lichter maken richting wit
- `getRelationColor(relatie, index)` — kleur op basis van relatie + volgorde-index
- `applyRelationColor(element, relatie, index)` — inline stijl op DOM element

### RelationColors.css — v1.0.2 → v1.1.0
- `--color-vader`: `#e8f5e9` → `#C49A6C` (bruin — synchroon met colorHelper.js)
- `--color-moeder`: `#e8f5e9` → `#7ccc86` (groen — synchroon met colorHelper.js)
- `--color-PHKindID`: `#bbdefb` → `#e5f2ff` (synchroon met colorHelper.js)

### Tree.css — v2.1.0 → v2.2.0
- Eigen `:root` variabelen verwijderd — kleuren komen nu uit RelationColors.css
- CSS klassen bijgewerkt: `kind1/kind2/kind3` vervangen door `KindID/HKindID/MHKindID/PHKindID`
- RelationColors.css vóór Tree.css geladen in alle pagina's

### manage.js — v2.7.0 → v2.8.0
- Kleurgradiënt op `td` cellen gezet i.p.v. `tr` — CSS specificiteitsconflict opgelost
- `Array.from(tr.cells).forEach()` na COLUMNS-loop — alle cellen bestaan dan al
- Inline commentaar op elke coderegel toegevoegd

### manage.html — v2.6.1 → v2.7.0
- `tr.VHoofdID` en `tr.MHoofdID` aparte CSS regels — waren samengevoegd waardoor beide bruin kleurden
- RelationColors.css vóór Tree.css geladen

### view.js — v1.7.0 → v1.8.0
- `createTreeNode()` krijgt `index` parameter mee
- `ColorHelper.applyRelationColor()` toegepast voor index 1 en hoger
- Partners, vaders, moeders krijgen oplopende index

### timeline.js — v2.5.0 → v2.7.0
- v2.6.0: `colorIndex` parameter aan `addRow()` toegevoegd
- v2.7.0: `COLOR` object relatie-kleuren vervangen door `ColorHelper.BASE_COLORS` via `getBaseColor()`
- Canvas-specifieke kleuren (tick, barText, connLine etc.) blijven hardcoded in `COLOR`
- `needsDarkText()` drempelwaarde: 160 → 128 voor correcte tekstkleur op lichte balkjes
- `drawBarLabel()`: altijd `COLOR.barTextDark` (zwart) voor leesbaarheid op lichte nodes

### Handleiding — kleurensectie toegevoegd
- Nieuwe sectie 5 "Kleurcodering" in NL, EN en ES
- Kleurstalen als inline `<span>` met achtergrondkleur
- Tabel met alle relatiekleuren + omschrijving
- Rijen voor 2e/3e vader, moeder, partner (20% lichter per stap)
- Inhoudsopgave bijgewerkt in alle drie talen

### Versie-overzicht

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `js/colorHelper.js` | — | v1.0.0 | Nieuw — centrale kleurberekening |
| `css/RelationColors.css` | v1.0.2 | v1.1.0 | Vader bruin, moeder groen, PHKindID licht blauw |
| `css/Tree.css` | v2.1.0 | v2.2.0 | Eigen variabelen verwijderd, gebruikt RelationColors.css |
| `js/manage.js` | v2.7.0 | v2.8.0 | Kleurgradiënt op td cellen, inline commentaar |
| `stamboom/manage.html` | v2.6.1 | v2.7.0 | VHoofdID/MHoofdID aparte CSS regels |
| `js/view.js` | v1.7.0 | v1.8.0 | index parameter in createTreeNode() |
| `js/timeline.js` | v2.5.0 | v2.7.0 | BASE_COLORS via ColorHelper, zwarte tekst |
| `bronnen/handleiding-nl.html` | v2.5.0 | v2.6.0 | Sectie 5 kleurcodering toegevoegd |
| `bronnen/handleiding-en.html` | v2.5.0 | v2.6.0 | Sectie 5 colour coding toegevoegd |
| `bronnen/handleiding-es.html` | v2.5.0 | v2.6.0 | Sectie 5 código de colores toegevoegd |

---

## Sessie 35 — F3-62 Import validatie + F3-48 Meerdere partners/ouders

**Datum:** 2026-05-30

### F3-62 — Import validatie: dubbele ID's detecteren
- `js/import.js` v2.2.0 → v2.3.0
- Duplicate check via Set van bestaande IDs
- Modal met 4 keuzes: Overslaan / Overschrijven / Toch alles / Annuleren
- Geen HTML aanpassingen nodig — modal dynamisch gebouwd

### F3-48 — Meerdere partners, vaders en moeders
- `js/manage.js` v2.5.1 → v2.6.1: multi-ID widget (buildMultiIDCell / buildMultiIDRow / readMultiIDCell)
- `stamboom/manage.html` v2.5.0 → v2.6.0: window.ManageTable.buildHeader() na loadNamespace
- `js/view.js` v1.6.5 → v1.7.0: findMultiple() helper, alle directe findPerson() calls vervangen
- `js/timeline.js` v2.4.0 → v2.5.0: findMultiple() helper, collectAncestorLevel en nakomelingen bijgewerkt
- `js/relatieEngine.js` v2.4.0 → v2.5.0: parsePartners() + includes() voor alle VaderID/MoederID/PartnerID checks

### Handleiding
- `bronnen/handleiding-nl.html` v2.4.0 → v2.5.0: sectie 4 en 11 bijgewerkt
- `bronnen/handleiding-en.html` v2.4.0 → v2.5.0: sectie 4 en 11 bijgewerkt
- `bronnen/handleiding-es.html` v2.4.0 → v2.5.0: sectie 4 en 11 bijgewerkt

### Versie-overzicht

| Bestand | Van | Naar |
|---------|-----|------|
| `js/import.js` | v2.2.0 | v2.3.0 |
| `js/manage.js` | v2.5.1 | v2.6.1 |
| `stamboom/manage.html` | v2.5.0 | v2.6.0 |
| `js/view.js` | v1.6.5 | v1.7.0 |
| `js/timeline.js` | v2.4.0 | v2.5.0 |
| `js/relatieEngine.js` | v2.4.0 | v2.5.0 |
| `bronnen/handleiding-nl.html` | v2.4.0 | v2.5.0 |
| `bronnen/handleiding-en.html` | v2.4.0 | v2.5.0 |
| `bronnen/handleiding-es.html` | v2.4.0 | v2.5.0 |

---

## Sessie 34
- import.js v2.1.0 → v2.2.0: TD-11/F8-56 legacy CSV-detectie via schema.normalizeHeader()
- AN-21: stamboom/account.html bestaat niet → ❌ Geannuleerd
- TD-09: lang-link handlers al verwijderd → ✅ Gedaan
- SEC-04: editor UPDATE policy op stambomen bestond al, cloudSync.js correct
  Dubbele RLS policies opgeruimd: 4 policies verwijderd op stambomen + stamboom_gedeeld
- BACKLOG.md bijgewerkt

---

## Sessie 33 — TD-11/F8-56 + AN-21 + TD-09 opgeschoond
- import.js v2.1.0 → v2.2.0: legacy CSV-detectie via schema.normalizeHeader()
- AN-21: stamboom/account.html bestaat niet → ❌ Geannuleerd
- TD-09: lang-link handlers al verwijderd in eerdere sessie → ✅ Gedaan
- Parser gebruikt nu schema.normalizeHeader() voor headertype-detectie
- Legacy CSV (19 kolommen) correct herkend en gemigreerd via schema.fromCSV()
- Velden buiten schema.fields (Huwelijksdatum, Huwelijksplaats, etc.) worden genegeerd
- Events-structuur besproken: aparte tabel, GEDCOM-compatibel, fase 4

---

## Sessie 32 — Supabase analyse pagina + admin toegangsbeveiliging (voorbereiding)

**Datum:** 2026-05-28

admin/supabase-analyse.html nieuw (v3.2.0), Navbar.html v1.3.0, locales common.json bijgewerkt.

---

## Sessie 31 — Bugfix: admin/developer menu verdwenen na Supabase security-fix

**Datum:** 2026-05-26

BF-57/58/59 opgelost. RLS policies herschreven, admin_users view hersteld zonder auth.users join.

---

## Sessie 30 — i18n uitgerold op abonnementen-pagina's

**Datum:** 2026-05-25

BF-56 race condition opgelost. Namespaces overzicht/prijzen/vergelijk/voordelen aangemaakt.

---

## Sessie 29 — Supabase beveiligingsfixes (KRITIEK)

**Datum:** 2026-05-22

RLS ingeschakeld op 6 tabellen, admin_users view gedropt, anon-rechten ingetrokken.

---

## Sessie 28 — Bugfix: tabelheaders vertalen bij taalwissel (template.html)

**Datum:** 2026-05-20

bronnen/template.html v2.2.0 → v2.3.0: bouwTabel() functie + languageChanged listener.

---

## Sessie 27 — i18n uitrollen op bronnen, gemeenschap en develop pagina's

**Datum:** 2026-05-19

i18n namespace uitgerold op bronnen/, gemeenschap/, develop/. Handleiding meertalig. Navbar v1.2.0.

---

## Sessie 26 — i18n uitrollen op Stamboom-menu pagina's + auth namespace

**Datum:** 2026-05-15

stamboom/*.html gerefactord, auth namespace aangemaakt, topbar modal via i18n.

---

## Sessie 25 — i18n uitrollen op Start-menu pagina's + docs vertaling

**Datum:** 2026-05-12

Navbar, Footer, about, print, import, export, create gerefactord. Docs drietalig.

---

## Sessie 24 — i18next meertalige architectuur (index.html)

**Datum:** 2026-05-10

js/i18n.js v1.0.0 aangemaakt. locales/{nl,en,es}/{common,home}.json aangemaakt.

---

## Sessies 1–24 — Zie eerdere PROJECT_LOG.md entries
