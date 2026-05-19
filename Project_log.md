MyFamTreeCollab — Project Log
## Bijgewerkt: 2026-05-19

> Chronologisch overzicht van alle sessies en wijzigingen.

---

## Sessie 27 — i18n uitrollen op bronnen, gemeenschap en develop pagina's

**Datum:** 2026-05-19
**Doel:** i18n namespace uitrollen op alle sub-pagina's van bronnen, gemeenschap en develop. Per pagina een aparte namespace JSON (nl/en/es). Handleiding meertalig via aparte HTML-bestanden per taal met redirect-handler.

---

### Uitgevoerde acties

#### Patroon gecorrigeerd t.o.v. eerdere sessie
- Fout hersteld: alle keys zaten aanvankelijk in één `bronnen.json` — opgesplitst naar losse namespace per pagina (bijv. `artikelen.json`, `extern.json` etc.)
- Namespace separator correct: `pagina:key` (dubbele punt), niet `pagina.key`

#### bronnen/ — i18n uitgerold
- `bronnen/artikelen.html` v0.2.0 → v0.3.0: i18n + namespace `artikelen`
- `bronnen/extern.html` v0.2.0 → v0.3.0: i18n + namespace `extern`
- `bronnen/instructies.html` v0.2.0 → v0.3.0: i18n + namespace `instructies`
- `bronnen/handleiding.html` verwijderd → vervangen door drie taalversies:
  - `bronnen/handleiding-nl.html` v2.4.0: NL handleiding + redirect-handler
  - `bronnen/handleiding-en.html` v2.4.0: EN volledige vertaling + redirect-handler
  - `bronnen/handleiding-es.html` v2.4.0: ES volledige vertaling + redirect-handler
  - `bronnen/handleiding.html` v2.4.1: redirect-bestand naar handleiding-nl.html (404-fix)
- `bronnen/template.html` v2.1.0 → v2.2.0: i18n + namespace `template` + meertalige tabel (vertaalde kolomnamen rij 1, NL technische namen rij 2) + meertalige CSV-download

#### gemeenschap/ — i18n uitgerold + bugs gefixed
- `gemeenschap/contact.html` v0.2.0 → v0.3.0
- `gemeenschap/discussies.html` v0.2.0 → v0.3.0
- `gemeenschap/evenement.html` v0.2.0 → v0.3.0
- `gemeenschap/forum.html` v0.2.0 → v0.3.0 — ook `trackPage("evenement")` → `trackPage('forum')` gecorrigeerd
- `gemeenschap/groepen.html` v0.2.0 → v0.3.0

Gemeenschap-bugs gefixed in alle pagina's:
- Dubbele Supabase/utils/auth script-blokken verwijderd
- Losse fetch-blokken bovenaan body verwijderd
- `id="Navbar-placeholder"` → `id="navbar-placeholder"`
- Favicon paden gecorrigeerd naar `/MyFamTreeCollab/img/`
- Kapotte `</script>s` verwijderd (contact.html)

#### develop/ — i18n uitgerold + bugs gefixed
- `develop/blank.html` v0.2.0 → v0.3.0 — content gecorrigeerd (was copy-paste artikelen)
- `develop/maintenance.html` v0.2.0 → v0.3.0 — countdown-tekst via i18n met interpolatie
- `develop/sandbox.html` v1.1.0 → v0.3.0 — dubbel bestand samengevoegd, kapotte HTML hersteld
- `develop/standaardpagina.html` v1.2.0 → v1.3.0

Develop-bugs gefixed in alle pagina's:
- eruda debug-script verwijderd
- Dubbele script-blokken verwijderd
- `trackPage("evenement")` gecorrigeerd naar correcte paginanaam
- Kapotte bestandsheaders gecorrigeerd (`<!============` → `<!--`)

#### Navbar bijgewerkt
- `Layout/Navbar.html` v1.1.0 → v1.2.0: `handleiding.html` → `handleiding-nl.html`, kapotte `</ a>` tag gecorrigeerd

#### Nieuwe locale bestanden aangemaakt (nl/en/es)
- `locales/*/artikelen.json`
- `locales/*/extern.json`
- `locales/*/instructies.json`
- `locales/*/template.json` — inclusief `velden.*` vertaalmap voor kolomnamen
- `locales/*/contact.json`
- `locales/*/discussies.json`
- `locales/*/evenement.json`
- `locales/*/forum.json`
- `locales/*/groepen.json`
- `locales/*/blank.json`
- `locales/*/maintenance.json` — inclusief countdown interpolatie
- `locales/*/sandbox.json`
- `locales/*/standaardpagina.json`

---

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `bronnen/artikelen.html` | v0.2.0 | v0.3.0 | i18n + namespace artikelen |
| `bronnen/extern.html` | v0.2.0 | v0.3.0 | i18n + namespace extern |
| `bronnen/instructies.html` | v0.2.0 | v0.3.0 | i18n + namespace instructies |
| `bronnen/handleiding.html` | v2.3.0 | v2.4.1 | redirect naar handleiding-nl.html |
| `bronnen/handleiding-nl.html` | — | v2.4.0 | Nieuw — NL handleiding + redirect-handler |
| `bronnen/handleiding-en.html` | — | v2.4.0 | Nieuw — EN volledige vertaling |
| `bronnen/handleiding-es.html` | — | v2.4.0 | Nieuw — ES volledige vertaling |
| `bronnen/template.html` | v2.1.0 | v2.2.0 | i18n + meertalige tabel + CSV-download |
| `gemeenschap/contact.html` | v0.2.0 | v0.3.0 | i18n + bugs gefixed |
| `gemeenschap/discussies.html` | v0.2.0 | v0.3.0 | i18n + bugs gefixed |
| `gemeenschap/evenement.html` | v0.2.0 | v0.3.0 | i18n + bugs gefixed |
| `gemeenschap/forum.html` | v0.2.0 | v0.3.0 | i18n + trackPage gecorrigeerd |
| `gemeenschap/groepen.html` | v0.2.0 | v0.3.0 | i18n + bugs gefixed |
| `develop/blank.html` | v0.2.0 | v0.3.0 | i18n + content gecorrigeerd |
| `develop/maintenance.html` | v0.2.0 | v0.3.0 | i18n + countdown via i18n |
| `develop/sandbox.html` | v1.1.0 | v0.3.0 | i18n + dubbel bestand samengevoegd |
| `develop/standaardpagina.html` | v1.2.0 | v1.3.0 | i18n + bugs gefixed |
| `Layout/Navbar.html` | v1.1.0 | v1.2.0 | handleiding link + kapotte tag fix |
| `locales/nl/artikelen.json` | — | v1.0.0 | Nieuw |
| `locales/en/artikelen.json` | — | v1.0.0 | Nieuw |
| `locales/es/artikelen.json` | — | v1.0.0 | Nieuw |
| `locales/nl/extern.json` | — | v1.0.0 | Nieuw |
| `locales/en/extern.json` | — | v1.0.0 | Nieuw |
| `locales/es/extern.json` | — | v1.0.0 | Nieuw |
| `locales/nl/instructies.json` | — | v1.0.0 | Nieuw |
| `locales/en/instructies.json` | — | v1.0.0 | Nieuw |
| `locales/es/instructies.json` | — | v1.0.0 | Nieuw |
| `locales/nl/template.json` | — | v1.0.0 | Nieuw |
| `locales/en/template.json` | — | v1.0.0 | Nieuw |
| `locales/es/template.json` | — | v1.0.0 | Nieuw |
| `locales/nl/contact.json` | — | v1.0.0 | Nieuw |
| `locales/en/contact.json` | — | v1.0.0 | Nieuw |
| `locales/es/contact.json` | — | v1.0.0 | Nieuw |
| `locales/nl/discussies.json` | — | v1.0.0 | Nieuw |
| `locales/en/discussies.json` | — | v1.0.0 | Nieuw |
| `locales/es/discussies.json` | — | v1.0.0 | Nieuw |
| `locales/nl/evenement.json` | — | v1.0.0 | Nieuw |
| `locales/en/evenement.json` | — | v1.0.0 | Nieuw |
| `locales/es/evenement.json` | — | v1.0.0 | Nieuw |
| `locales/nl/forum.json` | — | v1.0.0 | Nieuw |
| `locales/en/forum.json` | — | v1.0.0 | Nieuw |
| `locales/es/forum.json` | — | v1.0.0 | Nieuw |
| `locales/nl/groepen.json` | — | v1.0.0 | Nieuw |
| `locales/en/groepen.json` | — | v1.0.0 | Nieuw |
| `locales/es/groepen.json` | — | v1.0.0 | Nieuw |
| `locales/nl/blank.json` | — | v1.0.0 | Nieuw |
| `locales/en/blank.json` | — | v1.0.0 | Nieuw |
| `locales/es/blank.json` | — | v1.0.0 | Nieuw |
| `locales/nl/maintenance.json` | — | v1.0.0 | Nieuw |
| `locales/en/maintenance.json` | — | v1.0.0 | Nieuw |
| `locales/es/maintenance.json` | — | v1.0.0 | Nieuw |
| `locales/nl/sandbox.json` | — | v1.0.0 | Nieuw |
| `locales/en/sandbox.json` | — | v1.0.0 | Nieuw |
| `locales/es/sandbox.json` | — | v1.0.0 | Nieuw |
| `locales/nl/standaardpagina.json` | — | v1.0.0 | Nieuw |
| `locales/en/standaardpagina.json` | — | v1.0.0 | Nieuw |
| `locales/es/standaardpagina.json` | — | v1.0.0 | Nieuw |

---

### Nog open na sessie 27

| ID | Taak |
|----|------|
| F8-15 | `lang-link` handlers verwijderen uit `topbar.js` (TD-09) |
| F8-19 | `Handleiding.html` bijwerken met i18n uitleg (nu handleiding-nl.html) |
| F9-01 t/m F9-09 | Bronnen-module implementeren (genealogisch onderzoek) |
| TD-06 | `home/import-en.html` laadt import.js zonder schema.js + storage.js |
| Nieuw | Import-parser aanpassen: rij 2 lezen als technische header (template.html meertalig) |

---

## Sessie 26 — i18n uitrollen op Stamboom-menu pagina's + auth namespace

**Datum:** 2026-05-15
**Doel:** i18next namespace setup uitrollen op alle pagina's onder het Stamboom-menu. Auth namespace aanmaken voor login modal, reset en confirm flow.

---

### Uitgevoerde acties

#### Stamboom-menu pagina's gerefactord
- `stamboom/stats.html` v2.1.0 → v2.2.1: i18n + stats namespace + DOMContentLoaded/timing bugfix
- `stamboom/collab.html` v2.3.0 → v2.4.0: i18n + collab namespace
- `stamboom/storage.html` v2.8.0 → v2.9.0: i18n + storage namespace
- `stamboom/view.html` v2.1.0 → v2.2.0: i18n + view namespace
- `stamboom/timeline.html` v2.3.0 → v2.4.0: i18n + timeline namespace
- `stamboom/manage.html` v2.4.0 → v2.5.0: i18n + manage namespace

#### JS bestanden bijgewerkt
- `js/collab.js` v2.3.0 → v2.4.0: STATUS_CONFIG labels via i18n, rolLabel() via i18n, alle strings vertaald
- `js/view.js` v1.6.4 → v1.6.5: 2 hardcoded strings via i18nModule.t(), ES5 conform
- `js/timeline.js` v2.3.5 → v2.4.0: genLabel() via i18n, tooltip-velden via i18n, placeholders via i18n
- `js/manage.js` v2.4.0 → v2.5.0: relatieLabel() helper via i18n, alle alerts/confirms vertaald

#### Auth namespace aangemaakt
- `js/auth.js` v2.5.1 → v2.5.2: _errMsg() via i18nModule.t() met fallback
- `js/topbar.js` v2.3.0 → v2.3.2: _injectModal() met data-i18n attributen, _translateModal() voor gerichte vertaling, openModal() laadt auth namespace
- `home/confirm.html` v1.2.0 → v1.3.0: i18n + auth namespace
- `home/reset.html` v1.0.0 → v1.1.0: i18n + auth namespace + data-i18n attributen
- `js/reset.js` v1.0.0 → v1.1.0: alle strings via i18nModule.t()

#### Nieuwe namespace JSON bestanden (nl/en/es)
- `locales/*/stats.json` — 9 keys (kpi labels, families)
- `locales/*/collab.json` — 47 keys (status, modal, tree, search, message, diff, error, rol)
- `locales/*/storage.json` — 75 keys (tabs, cloud, shared, modal, confirm, status, error, share)
- `locales/*/view.json` — 7 keys (welcome, search, siblings, tree)
- `locales/*/timeline.json` — 34 keys (gen labels, rel labels, tooltip, placeholder)
- `locales/*/manage.json` — 26 keys (btn, rel, action, placeholder, confirm, alert)
- `locales/*/auth.json` — 73 keys (modal, tabs, login, register, forgot, topbar, dropdown, error, confirm, reset)

#### Bugfixes tijdens sessie
- stats.html: namespace niet ge-await'ed + KPI DOM-timing → loadNamespace via promise-keten + readyState check
- topbar.js: _injectModal() gebruikte _t() calls op moment dat auth namespace nog niet geladen was → omgebouwd naar data-i18n attributen + _translateModal() voor gerichte DOM-scan
- topbar.js: loadNamespace('auth') in init() veroorzaakte updateContent() op hele DOM → verplaatst naar openModal()
- storage.html: tabs samenvoegen onderzocht → niet zinvol (fundamenteel andere data)

#### Onderzoek
- Tabs in storage.html (Mijn data + Cloud stambomen) onderzocht op samenvoegen → besloten: niet samenvoegen. Fundamenteel andere data, andere interactie, andere bron (localStorage vs Supabase).

---

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `stamboom/stats.html` | v2.1.0 | v2.2.1 | i18n + timing bugfix |
| `stamboom/collab.html` | v2.3.0 | v2.4.0 | i18n geïntegreerd |
| `js/collab.js` | v2.3.0 | v2.4.0 | i18n strings |
| `stamboom/storage.html` | v2.8.0 | v2.9.0 | i18n geïntegreerd |
| `stamboom/view.html` | v2.1.0 | v2.2.0 | i18n geïntegreerd |
| `js/view.js` | v1.6.4 | v1.6.5 | i18n strings |
| `stamboom/timeline.html` | v2.3.0 | v2.4.0 | i18n geïntegreerd |
| `js/timeline.js` | v2.3.5 | v2.4.0 | i18n strings |
| `stamboom/manage.html` | v2.4.0 | v2.5.0 | i18n geïntegreerd |
| `js/manage.js` | v2.4.0 | v2.5.0 | i18n strings |
| `js/auth.js` | v2.5.1 | v2.5.2 | _errMsg() via i18n |
| `js/topbar.js` | v2.3.0 | v2.3.2 | data-i18n modal + _translateModal() |
| `home/confirm.html` | v1.2.0 | v1.3.0 | i18n geïntegreerd |
| `home/reset.html` | v1.0.0 | v1.1.0 | i18n geïntegreerd |
| `js/reset.js` | v1.0.0 | v1.1.0 | i18n strings |
| `locales/nl/stats.json` | — | v1.0.0 | Nieuw |
| `locales/en/stats.json` | — | v1.0.0 | Nieuw |
| `locales/es/stats.json` | — | v1.0.0 | Nieuw |
| `locales/nl/collab.json` | — | v1.0.0 | Nieuw |
| `locales/en/collab.json` | — | v1.0.0 | Nieuw |
| `locales/es/collab.json` | — | v1.0.0 | Nieuw |
| `locales/nl/storage.json` | — | v1.0.0 | Nieuw |
| `locales/en/storage.json` | — | v1.0.0 | Nieuw |
| `locales/es/storage.json` | — | v1.0.0 | Nieuw |
| `locales/nl/view.json` | — | v1.0.0 | Nieuw |
| `locales/en/view.json` | — | v1.0.0 | Nieuw |
| `locales/es/view.json` | — | v1.0.0 | Nieuw |
| `locales/nl/timeline.json` | — | v1.0.0 | Nieuw |
| `locales/en/timeline.json` | — | v1.0.0 | Nieuw |
| `locales/es/timeline.json` | — | v1.0.0 | Nieuw |
| `locales/nl/manage.json` | — | v1.0.0 | Nieuw |
| `locales/en/manage.json` | — | v1.0.0 | Nieuw |
| `locales/es/manage.json` | — | v1.0.0 | Nieuw |
| `locales/nl/auth.json` | — | v1.0.0 | Nieuw |
| `locales/en/auth.json` | — | v1.0.0 | Nieuw |
| `locales/es/auth.json` | — | v1.0.0 | Nieuw |

### Nog open na sessie 26

| ID | Taak |
|----|------|
| F8-15 | `lang-link` handlers verwijderen uit `topbar.js` (TD-09) |
| F8-19 | `Handleiding.html` bijwerken met i18n uitleg |
| Nieuw | Bronnen-module implementeren (genealogisch onderzoek) |

---

## Sessie 25 — i18n uitrollen op Start-menu pagina's + docs vertaling

**Datum:** 2026-05-12
**Doel:** i18next namespace setup uitrollen op alle pagina's onder het Start-menu. Navbar en Footer meertalig maken. Docs vertalen naar Engels en drietalig opzetten.

### Uitgevoerde acties

#### Navbar & Footer
- `Layout/Navbar.html` v1.0.0 → v1.1.0: alle menu-titels en submenu-items voorzien van `data-i18n="common:nav.*"` en `common:nav.sub.*"`, ▼ pijlen in losse `<span>`, 🚧 emoji's hardcoded
- `Layout/Footer.html` v1.5 → v1.6.0: "Steun via" vertaalbaar via `data-i18n="common:footer.supportVia"`, "Ko-fi" merknaam hardcoded

#### common.json uitgebreid (nl/en/es)
- `nav.start`, `nav.stamboom`, `nav.developer` toegevoegd
- Volledig `nav.sub.*` blok toegevoegd (24 keys)
- `footer.supportVia` toegevoegd
- `meta.appName` verwijderd (merknaam nooit vertalen)
- Trailing comma bugfix in alle drie talen

#### Pagina's gerefactord
- `home/about.html` v2.2.0 → v2.3.0: i18n init + `loadNamespace('about')` + alle tekst via `data-i18n="about:*"`
- `home/print.html` v2.1.0 → v2.2.0: idem met `loadNamespace('print')`
- `home/import.html` v2.1.0 → v2.3.0: idem + custom file input (native input verborgen, eigen knop + bestandsnaam span)
- `home/export.html` v2.2.0 → v2.3.0: idem met `loadNamespace('export')`
- `home/create.html` v2.1.0 → v2.2.0: idem + placeholders via `data-i18n="[placeholder]..."` + select opties vertaald

#### JS bestanden bijgewerkt
- `js/import.js` v2.0.3 → v2.1.0: alle statusmeldingen via `i18nModule.t('import:status.*')`, custom file input logica
- `js/export.js` v2.0.0 → v2.1.0: alle statusmeldingen via `i18nModule.t('export:status.*')`, bestandsnaam via `{{filename}}`
- `js/create.js` v1.2.0 → v1.3.0: alle statusmeldingen via `i18nModule.t('create:status.*')`, limiet via `{{count}}`/`{{max}}`

#### Nieuwe namespace JSON bestanden (nl/en/es)
- `locales/*/about.json` — hero, sections (6), buttons
- `locales/*/print.json` — page, content, buttons
- `locales/*/import.json` — page, welcome, form, file, info, status
- `locales/*/export.json` — page, welcome, csv, json, status
- `locales/*/create.json` — page, welcome, form (14 keys), preview, manage, status

#### Docs vertaling
- `Docs/disclaimer.html` v1.0.0 → v1.2.0: drietalig (EN/NL/ES), sticky taalnavigatie, eigen ← Back per sectie
- `Docs/privacy.html` v1.0.0 → v1.2.0: idem
- `Docs/terms.html` v1.0.0 → v1.2.0: idem

#### Bugfix — Navbar keys niet vertaald
- Oorzaak: `common.json` op GitHub miste `nav.sub.*` keys + trailing comma maakte JSON ongeldig
- Oplossing: drie nieuwe `common.json` bestanden geleverd zonder trailing comma, met volledige `nav.sub.*`

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `Layout/Navbar.html` | v1.0.0 | v1.1.0 | data-i18n op alle nav-items |
| `Layout/Footer.html` | v1.5 | v1.6.0 | supportVia vertaalbaar |
| `locales/nl/common.json` | v1.0.0 | v1.1.0 | nav.sub.*, footer.supportVia, trailing comma fix, meta.appName verwijderd |
| `locales/en/common.json` | v1.0.0 | v1.1.0 | idem |
| `locales/es/common.json` | v1.0.0 | v1.1.0 | idem |
| `locales/nl/about.json` | — | v1.0.0 | Nieuw |
| `locales/en/about.json` | — | v1.0.0 | Nieuw |
| `locales/es/about.json` | — | v1.0.0 | Nieuw |
| `locales/nl/print.json` | — | v1.0.0 | Nieuw |
| `locales/en/print.json` | — | v1.0.0 | Nieuw |
| `locales/es/print.json` | — | v1.0.0 | Nieuw |
| `locales/nl/import.json` | — | v1.0.0 | Nieuw |
| `locales/en/import.json` | — | v1.0.0 | Nieuw |
| `locales/es/import.json` | — | v1.0.0 | Nieuw |
| `locales/nl/export.json` | — | v1.0.0 | Nieuw |
| `locales/en/export.json` | — | v1.0.0 | Nieuw |
| `locales/es/export.json` | — | v1.0.0 | Nieuw |
| `locales/nl/create.json` | — | v1.0.0 | Nieuw |
| `locales/en/create.json` | — | v1.0.0 | Nieuw |
| `locales/es/create.json` | — | v1.0.0 | Nieuw |
| `home/about.html` | v2.2.0 | v2.3.0 | i18n geïntegreerd |
| `home/print.html` | v2.1.0 | v2.2.0 | i18n geïntegreerd |
| `home/import.html` | v2.1.0 | v2.3.0 | i18n + custom file input |
| `home/export.html` | v2.2.0 | v2.3.0 | i18n geïntegreerd |
| `home/create.html` | v2.1.0 | v2.2.0 | i18n geïntegreerd |
| `js/import.js` | v2.0.3 | v2.1.0 | i18n statusmeldingen + custom file input |
| `js/export.js` | v2.0.0 | v2.1.0 | i18n statusmeldingen |
| `js/create.js` | v1.2.0 | v1.3.0 | i18n statusmeldingen |
| `Docs/disclaimer.html` | v1.0.0 | v1.2.0 | Drietalig EN/NL/ES |
| `Docs/privacy.html` | v1.0.0 | v1.2.0 | Drietalig EN/NL/ES |
| `Docs/terms.html` | v1.0.0 | v1.2.0 | Drietalig EN/NL/ES |

### Verificatie
- Navbar vertaalt mee bij taalwissel ✅ (na upload common.json)
- Footer "Steun via" vertaalt mee ✅
- about/print/import/export/create laden correct in NL/EN/ES ✅
- Custom file input toont vertaalde tekst ✅
- Statusmeldingen in import.js/export.js/create.js vertaald ✅
- Docs drietalig met sticky taalnavigatie en eigen Back-link per sectie ✅

---

## Sessie 24 — i18next meertalige architectuur (index.html)

**Datum:** 2026-05-10
**Doel:** Schaalbare i18n namespace setup implementeren op index.html. Nederlands, Engels en Spaans (LatAm).

### Uitgevoerde acties

#### Architectuur
- Namespace structuur vastgesteld: `common`, `home`, `create`, `manage`, `auth`
- Key naming conventie: `namespace:section.element` (dubbele punt als separator)
- Locales mapstructuur aangemaakt: `/locales/{nl,en,es}/{common,home}.json`

#### Nieuwe bestanden
- `js/i18n.js` v1.0.0 — core i18n module: initialisatie, `updateContent()`, `loadNamespace()`, `buildLanguageSwitcher()`, `onComponentLoaded()`
- `locales/nl/common.json` — buttons, errors, loading, nav, footer
- `locales/en/common.json` — idem Engels
- `locales/es/common.json` — idem Spaans LatAm
- `locales/nl/home.json` — hero, demo, why, howItWorks, story, cta
- `locales/en/home.json` — idem Engels
- `locales/es/home.json` — idem Spaans LatAm

#### Gewijzigde bestanden
- `index.html` v2.2.1 → v2.3.1: alle hardcoded teksten vervangen door `data-i18n="namespace:key"`, i18next CDN naar `<head>`, componenten via `onComponentLoaded()`
- `Layout/TopBar.html` v0.4 → v0.5: `NL | EN` links vervangen door `<select id="languageSwitcher">`, merknaam hardcoded

#### Bugfixes tijdens sessie
- Keys toonden letterlijk → `home.hero.title` i.p.v. `home:hero.title` (dot vs colon)
- Taal wisselde niet → JSON bestanden stonden in verkeerde taalmappen
- Switcher reset na component injectie → `onComponentLoaded()` targeted check op `#languageSwitcher`
- Namespace niet herladen na taalwissel → `handleLanguageChange()` uitgebreid met `loadNamespaces()`

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `js/i18n.js` | — | v1.0.0 | Nieuw — core i18n module |
| `index.html` | v2.2.1 | v2.3.1 | data-i18n, CDN naar head, onComponentLoaded |
| `Layout/TopBar.html` | v0.4 | v0.5 | language switcher select, merknaam hardcoded |
| `locales/nl/common.json` | — | v1.0.0 | Nieuw |
| `locales/en/common.json` | — | v1.0.0 | Nieuw |
| `locales/es/common.json` | — | v1.0.0 | Nieuw |
| `locales/nl/home.json` | — | v1.0.0 | Nieuw |
| `locales/en/home.json` | — | v1.0.0 | Nieuw |
| `locales/es/home.json` | — | v1.0.0 | Nieuw |

### Verificatie
- i18next initialiseert correct ✅
- JSON bestanden laden via HTTP backend ✅
- `data-i18n` keys vertalen correct ✅
- Language switcher aanwezig in TopBar ✅
- Taalwissel werkt realtime ✅
- Taal blijft behouden na refresh (localStorage) ✅
- TopBar/Navbar/Footer vertalen na injectie ✅

---

## Sessies 1–24 — Zie eerdere PROJECT_LOG.md entries
