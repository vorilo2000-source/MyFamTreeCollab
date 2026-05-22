# MyFamTreeCollab — Project Log
## Bijgewerkt: 2026-05-22

> Chronologisch overzicht van alle sessies en wijzigingen.

---

## Sessie 29 — Supabase beveiligingsfixes (KRITIEK)

**Datum:** 2026-05-22
**Doel:** Drie kritieke beveiligingsmeldingen van Supabase verhelpen.

---

### Aanleiding

Supabase e-mail met drie kritieke meldingen voor project `oihzuwlcgyyeuhghjahp`:
- `auth_users_exposed` — view lekt gebruikersdata via publieke API
- `rls_disabled_in_public` — tabellen zonder Row Level Security
- `sensitive_columns_exposed` — gevoelige kolommen publiek toegankelijk

---

### Analyse

Via `schema_discovery.sql` en `find_all_views.sql` het werkelijke schema in kaart gebracht.

**Werkelijke tabellen:** `profiles`, `user_profiles`, `stambomen`, `stamboom_gedeeld`, `collab_messages`, `page_visits`

**Views (geen RLS mogelijk):**
- `admin_users` — `profiles JOIN auth.users` zonder enige toegangsbeperking → iedereen zag alle emails en auth-data
- `admin_page_visits` — `page_visits WHERE is_admin=true` → correct geschreven, maar lek via de onbeveiligde basistabel

---

### Uitgevoerde acties

| Actie | Detail |
|-------|--------|
| `DROP VIEW public.admin_users` | View lekte email + auth-data van alle gebruikers zonder toegangscheck |
| `admin_page_visits` behouden | WHERE-clause was correct; basistabel-RLS maakt hem nu veilig |
| RLS ingeschakeld op 6 tabellen | `profiles`, `user_profiles`, `stambomen`, `stamboom_gedeeld`, `collab_messages`, `page_visits` |
| Owner-policies toegevoegd | `auth.uid()` check op alle tabellen — users zien alleen eigen data |
| Admin-policies toegevoegd | `is_admin = true` in `profiles` geeft leestoegang tot `page_visits` en alle profielen |
| `REVOKE ALL FROM anon` | Op alle 6 tabellen — anonieme API-calls geblokkeerd |
| Minimale grants `authenticated` | Per tabel alleen de benodigde operaties |

---

### Verificatie

```
tabel             | rls_enabled
------------------|------------
collab_messages   | true
page_visits       | true
profiles          | true
stambomen         | true
stamboom_gedeeld  | true
user_profiles     | true
```

Supabase Security Advisor na uitvoering: **geen meldingen**.

---

### Gewijzigde bestanden

| Bestand | Wijziging |
|---------|-----------|
| `fix_definitief_v2.sql` | Uitgevoerd in Supabase SQL Editor |
| `BACKLOG.md` | Fase Beveiliging toegevoegd, SEC-01/02/03 ✅, TD-10 ✅ |
| `PROJECT_LOG.md` | Sessie 29 toegevoegd |

---

### Bugfixes

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-53 | `auth_users_exposed` — `admin_users` view gedropt | ✅ Opgelost |
| BF-54 | `rls_disabled_in_public` — RLS op 6 tabellen ingeschakeld | ✅ Opgelost |
| BF-55 | `sensitive_columns_exposed` — anon REVOKED, grants minimaal | ✅ Opgelost |

---

### Open na sessie 29

| ID | Taak |
|----|------|
| SEC-04 | Editor-rol schrijfrecht op `stambomen` via `stamboom_gedeeld.rol` |
| F8-15 | `lang-link` handlers verwijderen uit `topbar.js` |
| F8-19 | `handleiding-nl.html` bijwerken met i18n uitleg |
| F8-56 | Import-parser aanpassen: rij 2 lezen als technische header |
| F9-01 t/m F9-09 | Bronnen-module implementeren |
| TD-06 | `home/import-en.html` laadt import.js zonder schema.js + storage.js |
| TD-11 | Import-parser leest rij 1 als header |

---

## Sessie 28 — Bugfix: tabelheaders vertalen bij taalwissel (template.html)

**Datum:** 2026-05-20
**Doel:** Tabelheaders in `bronnen/template.html` vertalen bij taalwissel naar EN/ES.

---

### Probleemanalyse

De tabelheaders in `bronnen/template.html` bleven NL na taalwissel naar EN of ES. De rest van de pagina vertaalde correct via `data-i18n` attributen en `updateContent()`. De tabel werd echter volledig dynamisch opgebouwd via JavaScript met `i18nModule.t()` — zonder `data-i18n` attributen. Hierdoor werd de tabel niet meegenomen door `updateContent()` na een taalwissel.

De aanname in het sessie 28-document dat de CSV twee headerrijen genereerde was onjuist — de template genereerde al twee rijen correct, maar de tabelweergave in de browser bleef NL.

**Rootcause:** `handleLanguageChange()` in `i18n.js` roept `updateContent()` aan na een taalwissel. Dit vertaalt alleen elementen met `data-i18n` attributen. De dynamisch gebouwde tabel heeft geen `data-i18n` attributen en werd daardoor niet opnieuw getekend.

---

### Oplossing

`bronnen/template.html` v2.2.0 → v2.3.0:

- Tabellogica geëxtraheerd naar herbruikbare functie `bouwTabel()`
- `bouwTabel()` wist `csvHeader` en `csvBody` voor hertekenen (geen duplicaten)
- `i18next.on('languageChanged', bouwTabel)` listener toegevoegd na pagina-init
- Tabel wordt nu opnieuw getekend bij elke taalwissel met de juiste vertalingen

---

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `bronnen/template.html` | v2.2.0 | v2.3.0 | `bouwTabel()` functie + `languageChanged` listener |

---

### Bugfixes

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-52 | `bronnen/template.html` — tabelheaders bleven NL na taalwissel naar EN/ES | ✅ Opgelost |

---

### Nog open na sessie 28

| ID | Taak |
|----|------|
| F8-15 | `lang-link` handlers verwijderen uit `topbar.js` (TD-09) |
| F8-19 | `Handleiding.html` bijwerken met i18n uitleg (nu handleiding-nl.html) |
| F8-56 | Import-parser aanpassen: rij 2 lezen als technische header (schema.js) |
| F9-01 t/m F9-09 | Bronnen-module implementeren (genealogisch onderzoek) |
| TD-06 | `home/import-en.html` laadt import.js zonder schema.js + storage.js |
| TD-11 | Import-parser leest rij 1 als header — moet rij 2 lezen na template.html meertalig |

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
- `locales/*/artikelen.json`, `locales/*/extern.json`, `locales/*/instructies.json`
- `locales/*/template.json` — inclusief `velden.*` vertaalmap voor kolomnamen
- `locales/*/contact.json`, `locales/*/discussies.json`, `locales/*/evenement.json`
- `locales/*/forum.json`, `locales/*/groepen.json`
- `locales/*/blank.json`, `locales/*/maintenance.json`, `locales/*/sandbox.json`, `locales/*/standaardpagina.json`

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
- `stamboom/stats.html` v2.1.0 → v2.2.1, `stamboom/collab.html` v2.3.0 → v2.4.0
- `stamboom/storage.html` v2.8.0 → v2.9.0, `stamboom/view.html` v2.1.0 → v2.2.0
- `stamboom/timeline.html` v2.3.0 → v2.4.0, `stamboom/manage.html` v2.4.0 → v2.5.0

#### JS bestanden bijgewerkt
- `js/collab.js`, `js/view.js`, `js/timeline.js`, `js/manage.js`, `js/auth.js`, `js/topbar.js`, `js/reset.js`

#### Auth namespace aangemaakt + bugfixes
- stats.html timing bugfix, topbar.js modal omgebouwd naar data-i18n + _translateModal()

#### Nieuwe namespace JSON (nl/en/es)
- `stats`, `collab`, `storage`, `view`, `timeline`, `manage`, `auth`

---

### Nog open na sessie 26

| ID | Taak |
|----|------|
| F8-15 | `lang-link` handlers verwijderen uit `topbar.js` (TD-09) |
| F8-19 | `Handleiding.html` bijwerken met i18n uitleg |

---

## Sessie 25 — i18n uitrollen op Start-menu pagina's + docs vertaling

**Datum:** 2026-05-12
**Doel:** i18next namespace setup uitrollen op alle pagina's onder het Start-menu. Navbar en Footer meertalig maken. Docs vertalen naar Engels en drietalig opzetten.

---

### Uitgevoerde acties

- Navbar, Footer, about, print, import, export, create gerefactord met data-i18n
- `js/import.js`, `js/export.js`, `js/create.js` statusmeldingen via i18n
- `Docs/disclaimer.html`, `privacy.html`, `terms.html` drietalig (EN/NL/ES)
- Bugfix: Navbar keys niet vertaald — trailing comma in common.json + ontbrekende nav.sub.* keys

---

## Sessie 24 — i18next meertalige architectuur (index.html)

**Datum:** 2026-05-10
**Doel:** Schaalbare i18n namespace setup implementeren op index.html. Nederlands, Engels en Spaans (LatAm).

---

### Uitgevoerde acties

- `js/i18n.js` v1.0.0 aangemaakt — core i18n module
- `locales/{nl,en,es}/{common,home}.json` aangemaakt
- `index.html` v2.2.1 → v2.3.1: data-i18n, CDN naar head, onComponentLoaded
- `Layout/TopBar.html` v0.4 → v0.5: language switcher select

---

## Sessies 1–24 — Zie eerdere PROJECT_LOG.md entries
