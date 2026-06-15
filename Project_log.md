# MyFamTreeCollab — Project Log

## Sessie 40 — Admin toolset: modal-standaardisatie, planner & agenda-uitbreiding

**Datum:** 10-06-2026
**Versie:** projectlog.html v2.2.0, marketing.html v4.2.0, backlog.html v5.4.0, js/agendaStore.js v1.1.0, admin/agenda.html v1.1.0

### Uitgevoerd
- CLAUDE.md uitgebreid met "Standaard Modal" sectie: vaste velden, agenda-checkbox patroon, textarea-groottes per veldlabel, volledige markdown/HTML toolbar-specificatie (B I H1 H2 H3 lijst tabel code link br hr preview), status-badge CSS+JS mapping — bron van waarheid voor alle admin-pagina's
- admin/projectlog.html v2.0.0 → v2.2.0:
  - v2.0.0: volledige herschrijving viewer → editor (board/lijst, modal, MD import/export, AgendaStore.sync())
  - v2.1.0: textarea's vergroot, toolbar uitgebreid (H1-H3, link, `<br>`, `<hr>`, preview)
  - v2.2.0: Uitgevoerd/Niet uitgevoerd/Notities samengevoegd tot 1 Omschrijving-veld (markdown+HTML, volledige toolbar), agenda checkbox toegevoegd, datum → datetime-local, datamodel naar description+gepubliceerd
- admin/marketing.html v4.0.0 → v4.2.0:
  - v4.0.0: kalender/KPI tabs verwijderd (centraal via agenda.html), agenda checkbox, status badges
  - v4.1.0: bugfix _mapStatus/_mapPrio (kapotte unicode-escapes, MD-import faalde), kernboodschap dynamisch uit marketing.md (`> Kernboodschap:` regel, bewerkbaar via projectinfo-paneel)
  - v4.2.0: "Verwacht resultaat" veld + kolom volledig verwijderd, start/einddatum → datetime-local
- admin/backlog.html v5.3.2 → v5.4.0: 🔑 API key + AI suggestie volledig verwijderd (UI, data, MD), start/einddatum → datetime-local, omschrijving volledige toolbar + preview, agenda checkbox + "In agenda" stat, MD-export Agenda-kolom (backward compatible met oude 11-kolom bestanden)
- js/agendaStore.js v1.0.0 → v1.1.0: bron 'projectlog' toegevoegd (pl_items, kleur amber), `requiresPublish`-filter zodat backlog/marketing/projectlog alleen met `gepubliceerd==='ja'` in agenda verschijnen, datetime-local velden gesplitst naar startdate/starttime + enddate/endtime
- admin/agenda.html v1.0.0 → v1.1.0: nieuwe Planner-weergave (horizontale Gantt-achtige tijdlijn), periode-toggle Maand/Kwartaal/Jaar, rijen gegroepeerd per bron, statusicoon vóór titel in rij-labels en balken, navigatie volgt actieve periode
- MARKETING.md herstructureerd: `> Kernboodschap:` regel toegevoegd, versie lowercase, `[KALENDER]`/`[KPI]` secties verwijderd (niet meer gebruikt sinds v4.0.0)
- BACKLOG.md bijgewerkt: F10-020 t/m F10-025 toegevoegd, TD-012 (gedeelde modal-component — toekomstig, lage prioriteit)

### Niet uitgevoerd (verschoven naar sessie 41)
- handleiding-nl.html bijwerken — file-per-file aanpak afgesproken, volgt apart
- admin/release-notes.html nieuw (Prioriteit 2, uit sessie 39)
- admin/roadmap.html nieuw (Prioriteit 3, uit sessie 39)

### Belangrijke les
- Copilot corrumpeert HTML-tags in JS template strings/innerHTML. Regel vastgelegd in CLAUDE.md: grote bestanden met innerHTML/template strings altijd als download leveren, nooit via Copilot-instructie. Emoji's in JS-strings die in HTML terechtkomen: HTML entities gebruiken (bv. 📅 → `&#x1F4C5;`).

### Versie-overzicht

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `admin/projectlog.html` | v1.1.0 | v2.2.0 | Editor-herschrijving + omschrijving-veld + agenda checkbox + datetime-local |
| `admin/marketing.html` | v4.0.0 | v4.2.0 | Kalender/KPI weg, kernboodschap dynamisch, resultaat-veld weg, datetime-local |
| `admin/backlog.html` | v5.3.2 | v5.4.0 | API key/AI weg, datetime-local, omschrijving toolbar, agenda checkbox |
| `js/agendaStore.js` | v1.0.0 | v1.1.0 | Bron projectlog, requiresPublish-filter, datetime-splitsing |
| `admin/agenda.html` | v1.0.0 | v1.1.0 | Planner-weergave (Maand/Kwartaal/Jaar), statusicoon |
| `MARKETING.md` | — | v1.0.0 | Kernboodschap-regel, kalender/KPI secties verwijderd |
| `CLAUDE.md` | — | — | Standaard Modal-sectie toegevoegd |
| `BACKLOG.md` | v1.1.4 | v1.1.5 | F10-020 t/m F10-025, TD-012 toegevoegd |

---

## Sessie 39 — Setup Claude Code & backlog.html fixes

**Datum:** 09-06-2026
**Versie:** backlog.html v5.3.2, CLAUDE.md v1.0.0

### Uitgevoerd
- CLAUDE.md aangemaakt: samenvoeging van ProjectInstructieAI.md en nieuwe Claude Code instructies
- ProjectInstructieAI.md kan verwijderd worden
- GitHub Codespaces getest op iPad — beperkt bruikbaar
- GitHub Copilot in VS Code getest als Claude Code alternatief — werkt goed
- Werkwijze iPad/computer gedocumenteerd: BACKLOG.md ID-002 en ID-003 toegevoegd
- backlog.html v5.3.1: _parseMD fase-parser fix (## Bijgewerkt en ## [SECTIE] overgeslagen)
- backlog.html v5.3.2: _parseMD versie-parser uitgebreid met unicode middelpunt (·)

### Niet uitgevoerd (verschoven naar sessie 40)
- admin/projectlog.html bugfix (Prioriteit 1)
- admin/release-notes.html nieuw (Prioriteit 2)
- admin/roadmap.html nieuw (Prioriteit 3)

### Tools & werkwijze
- Nieuwe werkwijze vastgelegd: Copilot in VS Code op computer, claude.ai op iPad
- git push via VS Code terminal

## Bijgewerkt: 2026-06-08

> Chronologisch overzicht van alle sessies en wijzigingen.

---

## Sessie 38 — Centrale Agenda + Backlog cleanup

**Datum:** 2026-06-08

### Doel
Centrale agenda als single source of truth voor alle admin modules.
Backlog ontdoen van kalender/KPI tabs. .ics import/export.

### js/agendaStore.js — v1.0.0 (nieuw)
- register() — module registreert zichzelf met mapping config
- sync() — herberekent ag_cache uit bl_items, mk_items, rm_items, rn_items
- getAll() — combineert ag_cache + ag_events (standalone)
- Schrijft nooit terug naar bronpagina's
- Kleurcodering per bron: backlog blauw, marketing paars, roadmap oranje, releasenotes groen

### admin/agenda.html — v1.1.0 (nieuw)
- Maand/week/dag weergave
- Kleurcodering per bron, filter op bron + status + zoekterm
- Status volgt bronpagina's — 🔄 Sync knop
- Standalone events: titel, start/eind datum+tijd, locatie, deelnemers, status, herhaling, tags
- Herhaling: dagelijks/wekelijks/tweewekelijks/maandelijks/jaarlijks
- .ics export per item en bulk (maand)
- .ics import: parser voor Google Calendar/Outlook/Apple Calendar
  DTSTART/DTEND, TZID, RRULE, ATTENDEE, STATUS, UID
- Conflict modal bij zelfde UID: Overslaan / Overschrijven /
  Alle overslaan / Alle overschrijven / Annuleren

### admin/backlog.html — v5.2.0 → v5.3.0
- Kalender tab verwijderd
- KPI tab verwijderd
- Tabs volledig verwijderd — directe backlog weergave
- agendaStore.js geladen in laadvolgorde
- AgendaStore.sync() na elke _save() en bij init()
- Stat-card "In agenda" toont items met startdatum
- 📅 indicator op kaarten/tabel voor items met startdatum
- "📅 Naar agenda" knop in toolbar

### Versie-overzicht

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `js/agendaStore.js` | — | v1.0.0 | Nieuw |
| `admin/agenda.html` | — | v1.1.0 | Nieuw |
| `admin/backlog.html` | v5.2.0 | v5.3.0 | Tabs verwijderd, AgendaStore sync |

---

## Sessie 37 — Admin toolset: Backlog, Project Log, Marketing

**Datum:** 2026-06-04 t/m 2026-06-07

### Doel
Volledig werkende admin toolset: backlog manager, project log viewer en marketing & communicatieplan — consistent met de bestaande admin look & feel.

### admin/backlog.html — v5.1.0
- Vanilla JS, geen framework
- Laadvolgorde identiek aan analytics.html
- Board- en lijstweergave met sticky kolomheaders en scrollbare container
- Alleen actieve statuskolommen tonen (gefilterd via statusfilter pills)
- Multi-select filters voor status, prioriteit, type en tags
- Fasefilter als pills met tooltip (beschrijving uit MD fase-header na `—`)
- Auto ID: [1e letter fase][1e letter type]-[3-cijferig volgnummer]
- ID inline aanpasbaar (tabel + modal)
- Projectnaam + versie + datum in header, bewerkbaar
- Projectnaam uit eerste regel van MD bij laden
- MD én CSV laden via 📂 knop
- MD én CSV exporteren met bestandsnaam = projectnaam-versie
- AI suggestie via Anthropic API (gebruiker voert eigen sleutel in)
- Data wissen knop: verwijdert alle `bl_*` localStorage sleutels
- Lege velden blijven leeg (geen X-vervanging in weergave/export)
- Toegangsbeveiliging via AdminGuard.protect('admin')
- Geen automatisch laden via fetch — gebruiker kiest bestand via 📂

### admin/projectlog.html — v1.0.0 (nieuw)
- Laadt PROJECT_LOG.md via 📂 knop
- Sessies als uitklapbare kaarten met groene bovenlijn
- Zoeken in titels én inhoud
- Alles uitklappen / inklappen
- Log bewaard in localStorage (bl_log)
- Log wissen knop
- Zelfde laadvolgorde en look & feel als backlog.html

### admin/marketing.html — v3.0.0 (nieuw)
- Standaard dataformaat: marketing.md met secties [TAKEN][KALENDER][KPI][KANALEN][TEMPLATES]
- Taken: start/einddatum + gepubliceerd checkbox
- Kalender: maand/week/dag weergave, taken + aparte kalender-events
- KPI's: bewerkbaar via modal, werkelijke cijfers opslaan
- Kanalen: bewerkbaar via modal
- Templates: bewerkbaar via modal, markdown preview, kopieerknop
- Markdown editor in alle forms: bold, cursief, lijst, tabel, code toolbar
- Import/export als één marketing.md
- localStorage prefix: mk_* (geen conflict met bl_*)
- Zelfde board/lijst/filters structuur als backlog.html

### Navbar.html — v1.4.0
- Backlog, Project Log en Marketing links toegevoegd aan Administrator dropdown

### BACKLOG.md — v1.0.0 (opgeschoond)
- WINOTS en DP9ZZF rijen verwijderd
- F8-57 t/m F8-62 hersteld als normale rij
- Fase 10 beschrijving naar fase-header als tooltip
- Bugfixes sectie hernoemd, type gecorrigeerd naar Bug

### Standaard dataformaat vastgelegd
- Alle admin toolpagina's gebruiken hetzelfde MD-formaat
- Secties gemarkeerd met [SECTIENAAM]
- Kolommen gestandaardiseerd: ID | Titel | Type | Startdatum | Einddatum | Gepubliceerd | Prioriteit | Status | Toegewezen | Tags | Omschrijving | Resultaat
- localStorage prefixes: bl_* (backlog), mk_* (marketing), per nieuwe pagina eigen prefix

### Versie-overzicht

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `admin/backlog.html` | v4.0.0 | v5.1.0 | Board scroll, sticky headers, MD/CSV laden zonder fetch |
| `admin/projectlog.html` | — | v1.0.0 | Nieuw — project log viewer |
| `admin/marketing.html` | — | v3.0.0 | Nieuw — marketing & communicatieplan |
| `Layout/Navbar.html` | v1.3.0 | v1.4.0 | Backlog, Project Log, Marketing links |
| `BACKLOG.md` | — | v1.0.0 | Opgeschoond |
| `PROJECT_LOG.md` | v1.0.0 | v1.1.0 | Sessie 37 toegevoegd |

---


> Chronologisch overzicht van alle sessies en wijzigingen.

---

## Sessie 37 — Backlog Manager (admin/backlog.html)

**Datum:** 2026-06-04

### Doel
Volledig werkende backlog manager als adminpagina, consistent met de bestaande admin look & feel.

### admin/backlog.html — v5.1.0
- Vanilla JS, geen framework — consistent met rest van project
- Laadvolgorde identiek aan analytics.html: supabase → utils → auth → adminGuard → siteAnalytics → topbar → AdminGuard.protect()
- Board- en lijstweergave met sticky kolomheaders en scrollbare container
- Alleen actieve statuskolommen tonen in boardweergave (gefilterd via statusfilter pills)
- Multi-select filters voor status, prioriteit, type en tags via klikbare pills
- Fasefilter als pills met tooltip (beschrijving uit MD fase-header na `—`)
- Auto ID: [1e letter fase][1e letter type]-[3-cijferig volgnummer], inline aanpasbaar
- Projectnaam + versie + datum in header, bewerkbaar via inline paneel
- Projectnaam en versie worden ingelezen uit eerste regel van MD bij laden
- MD én CSV laden via 📂 knop (bestandsnaam vrij te kiezen)
- MD én CSV exporteren met bestandsnaam = projectnaam-versie.md/.csv
- AI suggestie via Anthropic API (gebruiker voert eigen sleutel in via UI)
- Data wissen knop: verwijdert alle `bl_*` localStorage sleutels
- Lege velden blijven leeg in UI en export (geen X-vervanging)
- Toegangsbeveiliging via AdminGuard.protect('admin')
- Aparte tab voor Project Log naast Backlog tab

### BACKLOG.md — v1.0.0 (opgeschoond)
- WINOTS en DP9ZZF rijen verwijderd
- F8-57 t/m F8-62 hersteld als normale rij
- Fase 10 beschrijving verplaatst naar fase-header als tooltip
- Bugfixes sectie hernoemd en type gecorrigeerd naar Bug
- Datumtypefout gecorrigeerd (2026-0529 → 2026-05-29)

### Versie-overzicht

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `admin/backlog.html` | — | v5.1.0 | Nieuw — backlog manager |
| `BACKLOG.md` | — | v1.0.0 | Opgeschoond en klaar voor backlog.html |
| `PROJECT_LOG.md` | v1.0.0 | v1.1.0 | Sessie 37 toegevoegd |

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

### F3-48 — Meerdere partners, vaders en moeders
- `js/manage.js` v2.5.1 → v2.6.1: multi-ID widget
- `stamboom/manage.html` v2.5.0 → v2.6.0
- `js/view.js` v1.6.5 → v1.7.0: findMultiple() helper
- `js/timeline.js` v2.4.0 → v2.5.0: findMultiple() helper
- `js/relatieEngine.js` v2.4.0 → v2.5.0: parsePartners()

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

## Sessie 34 — Import legacy CSV + SEC-04 + opschoning

**Datum:** 2026-05-29

- `import.js` v2.1.0 → v2.2.0: TD-11/F8-56 legacy CSV-detectie via schema.normalizeHeader()
- AN-21: stamboom/account.html bestaat niet → ❌ Geannuleerd
- TD-09: lang-link handlers al verwijderd → ✅ Gedaan
- SEC-04: editor UPDATE policy bestond al, dubbele RLS policies opgeruimd
- BACKLOG.md bijgewerkt

---

## Sessie 33 — TD-11/F8-56 + opschoning

**Datum:** 2026-05-29

- Parser gebruikt schema.normalizeHeader() voor headertype-detectie
- Legacy CSV (19 kolommen) correct herkend via schema.fromCSV()
- Events-structuur besproken: aparte tabel, GEDCOM-compatibel, fase 4

---

## Sessie 32 — Supabase analyse pagina

**Datum:** 2026-05-28

- `admin/supabase-analyse.html` nieuw (v3.2.0)
- Navbar.html v1.3.0
- locales common.json bijgewerkt

---

## Sessie 31 — Bugfix: admin/developer menu verdwenen

**Datum:** 2026-05-26

- BF-57/58/59 opgelost
- RLS policies herschreven
- admin_users view hersteld zonder auth.users join

---

## Sessie 30 — i18n abonnementen-pagina's

**Datum:** 2026-05-25

- BF-56 race condition opgelost
- Namespaces overzicht/prijzen/vergelijk/voordelen aangemaakt

---

## Sessie 29 — Supabase beveiligingsfixes (KRITIEK)

**Datum:** 2026-05-22

- RLS ingeschakeld op 6 tabellen
- admin_users view gedropt
- Anon-rechten ingetrokken

---

## Sessie 28 — Bugfix: tabelheaders vertalen

**Datum:** 2026-05-20

- `bronnen/template.html` v2.2.0 → v2.3.0: bouwTabel() + languageChanged listener

---

## Sessie 27 — i18n bronnen, gemeenschap, develop

**Datum:** 2026-05-19

- i18n namespace uitgerold op bronnen/, gemeenschap/, develop/
- Handleiding meertalig, Navbar v1.2.0

---

## Sessie 26 — i18n Stamboom-menu + auth namespace

**Datum:** 2026-05-15

- stamboom/*.html gerefactord
- auth namespace aangemaakt
- topbar modal via i18n

---

## Sessie 25 — i18n Start-menu + docs vertaling

**Datum:** 2026-05-12

- Navbar, Footer, about, print, import, export, create gerefactord
- Docs drietalig

---

## Sessie 24 — i18next meertalige architectuur

**Datum:** 2026-05-10

- `js/i18n.js` v1.0.0 aangemaakt
- `locales/{nl,en,es}/{common,home}.json` aangemaakt

---

## Sessies 1–23 — Zie eerdere PROJECT_LOG.md entries
