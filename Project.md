# MyFamTreeCollab — Project.md
## Bijgewerkt: 2026-05-12

---

## Projectvisie
MyFamTreeCollab is een **commerciële heritage & genealogie webapplicatie** waarbij
de gebruiker altijd volledige controle houdt over zijn eigen data.

### Kernprincipes
- **Privacy first** — data blijft standaard lokaal in de browser (localStorage)
- **Geen betaalde account vereist** voor basisfunctionaliteit
- **Open standaarden** — export naar CSV, JSON én GEDCOM (standaard stamboomformaat)

### Huidige scope (MVP — lokale versie)
- Stamboomdata aanmaken, bewerken en beheren in de browser
- Visualiseren: stamboomweergave, tijdlijn, statistieken
- Exporteren: CSV, JSON (GEDCOM gepland — F3-23)
- Importeren: CSV/TXT (GEDCOM import gepland — F3-23)
- Data support: lokaal & cloud

### Uitbreidingen (actief)
- ☁️ Cloud opslag per gebruiker (meerdere stambomen)
- 👤 Gebruikersaccounts met tiersysteem (guest / owner / admin)
- 📜 Versiegeschiedenis per stamboom
- 👥 Samenwerken met anderen (viewer / editor rechten per stamboom)
- 🔗 Delen van stambomen met leesrechten
- 🌍 Meertalig (NL / EN / ES) via i18next

### Toekomstige uitbreidingen (Fase 7+)
- 💳 Stripe betalingen voor owner-tier
- 🔍 Genealogisch onderzoek (bronnen, archieven)

---

## Technische informatie

**Live:** https://vorilo2000-source.github.io/MyFamTreeCollab/index.html
**Broncode:** https://github.com/vorilo2000-source/MyFamTreeCollab
**Stack:** Vanilla HTML + CSS + JavaScript — geen frameworks
**Backend:** Supabase (auth + cloud opslag)
**Cloud:** https://supabase.com/dashboard/org/kvaizqetplltywdpwefz

### Verplichte laadvolgorde in HTML

```
i18next CDN (3 scripts)   ← altijd EERSTE in <head> op i18n-pagina's
js/i18n.js                ← na i18next CDN scripts
utils.js                  ← altijd eerste in <body>
schema.js
idGenerator.js            ← alleen op pagina's met formulier (create, manage)
storage.js
auth.js                   ← vereist Supabase SDK vóór dit script
LiveSearch.js
relatieEngine.js          ← vóór view.js / manage.js / timeline.js
cloudSync.js              ← na auth.js
versionControl.js         ← na cloudSync.js (optioneel, non-fatal als afwezig)
siteAnalytics.js          ← na auth.js (tier beschikbaar)
i18nModule.init()         ← in <script> blok, laadt TopBar/Navbar/Footer via onComponentLoaded()
topbar.js                 ← geïnjecteerd ná TopBar HTML (garandeert #top-auth in DOM)
[pagina].js               ← altijd LAATSTE
```

### i18n architectuur

| Onderdeel | Waarde |
|---|---|
| Library | i18next v23 + i18next-http-backend + i18next-browser-languagedetector |
| Namespace separator | `:` (dubbele punt) — bijv. `common:nav.home` |
| Locales pad | `/MyFamTreeCollab/locales/{{lng}}/{{ns}}.json` |
| Talen | nl (default), en, es |
| Taalvoorkeur opslag | `localStorage` key: `mftc_language` |
| Preloaded namespace | `common` — altijd beschikbaar op alle pagina's |
| Lazy namespaces | Per pagina via `i18nModule.loadNamespace('naam')` |

### Kritische i18n regels

```
✅ data-i18n="create:form.name"    ← dubbele punt als separator
❌ data-i18n="create.form.name"    ← punt werkt NIET

✅ <span>MyFamTreeCollab</span>    ← merknaam altijd hardcoded
❌ <span data-i18n="common:meta.appName"></span>

✅ i18nModule.onComponentLoaded()  ← altijd na fetch van TopBar/Navbar/Footer
❌ element.innerHTML = html        ← nooit direct injecteren
```

### Globale exports (window.*) — nooit lokaal herdefiniëren

| Export | Bron | Versie |
|---|---|---|
| `window.i18nModule` | i18n.js | v1.0.0 |
| `window.ftSafe`, `window.ftFormatDate`, `window.ftParseBirthday` | utils.js | — |
| `window.genereerCode` | idGenerator.js | — |
| `window.StamboomSchema` | schema.js | — |
| `window.StamboomStorage` | storage.js | v2.2.0 |
| `window.AuthModule` | auth.js | v2.5.1 |
| `window.CloudSync` | cloudSync.js | v2.2.1 |
| `window.VersionControl` | versionControl.js | v1.1.0 |
| `window.RelatieEngine.computeRelaties` | relatieEngine.js | — |
| `window.liveSearch`, `window.initLiveSearch` | LiveSearch.js | — |
| `window.ExportModule.exportCSV`, `window.ExportModule.exportJSON` | export.js | v2.1.0 |
| `window.TopBarAuth` | topbar.js | v2.3.0 |
| `window.SiteAnalytics` | siteAnalytics.js | v2.6.0 |
| `window.DemoModule` | demo.js | v1.2.1 |

---

## Rolmodel

### Account types (opgeslagen in `profiles.tier`)

| Tier | Omschrijving |
|---|---|
| `guest` | Standaard na registratie — basisfunctionaliteit |
| `owner` | Betaalde gebruiker — cloud opslag, meerdere stambomen |
| `admin` | Beheerder — volledige toegang |

### Stamboom-rechten (opgeslagen in `stamboom_gedeeld.rol`)

| Recht | Omschrijving |
|---|---|
| `viewer` | Leesrechten op een specifieke stamboom |
| `editor` | Schrijfrechten op een specifieke stamboom |

> `viewer` en `editor` zijn **geen** account types — ze staan in `stamboom_gedeeld`, niet in `profiles.tier`.

---

## Supabase tabellen

### `profiles`
| kolom | type | opmerking |
|---|---|---|
| id | uuid (PK) | FK → auth.users |
| username | text | — |
| avatar_id | text | — |
| tier | text | guest / owner / admin |
| is_admin | boolean | — |
| is_premium | boolean | — |
| tier_until | timestamptz | vervaldatum tier |
| email | text | gespiegeld vanuit auth.users |

### `stambomen`
| kolom | type |
|---|---|
| id | uuid (PK) |
| user_id | uuid (FK → auth.users) |
| naam | text |
| data | jsonb |
| updated_at | timestamptz |

### `stamboom_gedeeld`
| kolom | type | opmerking |
|---|---|---|
| id | uuid (PK) | — |
| stamboom_id | uuid (FK → stambomen) | — |
| eigenaar_id | uuid (FK → auth.users) | wie heeft gedeeld |
| viewer_id | uuid (FK → auth.users) | wie heeft toegang |
| rol | text | viewer / editor |
| gedeeld_op | timestamptz | — |

### `collab_messages`
| kolom | type |
|---|---|
| id | uuid (PK) |
| stamboom_id | uuid |
| persoon_id | text |
| user_id | uuid |
| bericht | text |
| status | text |
| aangemaakt_op | timestamptz |

### `page_visits`
| kolom | type | opmerking |
|---|---|---|
| id | uuid (PK) | — |
| page | text | pagina naam |
| tier | text | account type of null |
| email | text | nullable |
| bezocht_op | timestamptz | — |

---

## Supabase Edge Functions

| Naam | Versie | Doel |
|---|---|---|
| `dynamic-responder` | v1.2.0 | Notificatiemail naar admin + bevestigingsmail naar account bij bevestiging |

### Secrets
| Naam | Waarde |
|---|---|
| `RESEND_API_KEY` | Resend API key — ingesteld in Supabase dashboard |

---

## Gewijzigde bestanden sessie 2026-05-12

| Bestand | Van | Naar | Wijziging |
|---|---|---|---|
| `Layout/Navbar.html` | v1.0.0 | v1.1.0 | data-i18n op alle nav-items |
| `Layout/Footer.html` | v1.5 | v1.6.0 | footer.supportVia vertaalbaar |
| `locales/*/common.json` | v1.0.0 | v1.1.0 | nav.sub.*, footer.supportVia, trailing comma fix, meta.appName verwijderd |
| `locales/*/about.json` | — | v1.0.0 | Nieuw |
| `locales/*/print.json` | — | v1.0.0 | Nieuw |
| `locales/*/import.json` | — | v1.0.0 | Nieuw |
| `locales/*/export.json` | — | v1.0.0 | Nieuw |
| `locales/*/create.json` | — | v1.0.0 | Nieuw |
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

---

## Gewijzigde bestanden sessie 2026-05-10

| Bestand | Van | Naar | Wijziging |
|---|---|---|---|
| `js/i18n.js` | — | v1.0.0 | Nieuw — core i18n module |
| `index.html` | v2.2.1 | v2.3.1 | data-i18n, CDN naar head, onComponentLoaded |
| `Layout/TopBar.html` | v0.4 | v0.5 | language switcher select, merknaam hardcoded |
| `locales/nl/common.json` | — | v1.0.0 | Nieuw |
| `locales/en/common.json` | — | v1.0.0 | Nieuw |
| `locales/es/common.json` | — | v1.0.0 | Nieuw |
| `locales/nl/home.json` | — | v1.0.0 | Nieuw |
| `locales/en/home.json` | — | v1.0.0 | Nieuw |
| `locales/es/home.json` | — | v1.0.0 | Nieuw |

---

## Gewijzigde bestanden sessie 2026-05-09

| Bestand | Van | Naar | Wijziging |
|---|---|---|---|
| `js/accountbeheer.js` | v1.2.0 | v1.3.0 | confirmUser(), renderTable() confirm-knop, email_confirmed_at laden |
| `home/confirm.html` | v1.0.0 | v1.2.0 | notifyAdmin() toegevoegd, Authorization header verwijderd |

---

## Gewijzigde bestanden sessie 2026-05-07

| Bestand | Van | Naar | Wijziging |
|---|---|---|---|
| `js/auth.js` | v2.5.0 | v2.5.1 | SUPABASE_ANON → sb_publishable_ formaat |
| `home/confirm.html` | — | v1.0.0 | Nieuw — verwerkt token_hash, succes/fout, redirect |
| `admin/accountbeheer.html` | v2.2.0 | v2.3.0 | Stat-cards en filter: viewer/editor → guest |
| `js/accountbeheer.js` | v1.1.0 | v1.2.0 | statGuest, dropdown guest/owner/admin |

---

## Technische schuld

| ID | Omschrijving | Ernst |
|----|-------------|-------|
| TD-01 | `js/Sandbox.js` — testbestand staat nog in de repo | 🟢 Laag |
| TD-02 | `js/script.js` — doet alleen console.log, geladen op 9 pagina's | 🟡 Middel |
| TD-03 | `js/LSD.js` — dubbele DOMContentLoaded event listener | 🟢 Laag |
| TD-04 | `Layout/*.html` via fetch() — werkt niet op file:// protocol | 🟡 Middel |
| TD-05 | Popup-stijlen in LiveSearch.js zijn hardcoded inline CSS | 🟢 Laag |
| TD-06 | `home/import-en.html` laadt import.js zonder schema.js en storage.js | 🔴 Hoog |
| TD-07 | Resend zonder eigen domein — `onboarding@resend.dev`, mail alleen naar Resend-account | 🟡 Middel |
| TD-08 | async/await mismatch — alle call-sites van storage.add() controleren | 🟡 Middel |
| TD-09 | `lang-link` handlers in `topbar.js` — vervangen door i18n.js, handlers verwijderen | 🟡 Middel |
| TD-10 | `page_visits` RLS uitgeschakeld — tijdelijke oplossing, beveiligd via view | 🟡 Middel |

---

## Definitie of Done

Een taak is klaar als:
- [ ] Code werkt zoals bedoeld (getest in browser, geen console-errors)
- [ ] Inline commentaar op elke coderegel
- [ ] Bestandsheader bijgewerkt met nieuw versienummer
- [ ] Project.md bijgewerkt
- [ ] PROJECT_LOG.md bijgewerkt met sessie-entry
- [ ] BACKLOG.md bijgewerkt: taak op ✅ Gedaan
- [ ] Handleiding.html bijgewerkt

---

## Werkwijze per sessie

1. Gebruiker geeft aan wat er gedaan moet worden (of vraagt wat de volgende prioriteit is)
2. Claude checkt backlog en huidige bestandsstatus
3. Code wordt geschreven/aangepast met volledig inline commentaar
4. Einde van sessie: Claude levert
   - Gewijzigde bestanden
   - Sessie-entry voor Project_log.md
   - Bijgewerkte: BACKLOG.md, Handleiding.html en Project.md

---

## Taal & stijl

- Communicatie: **Nederlands**
- Code & commentaar: **Engels**
- Stijl: direct en technisch, geen overbodige uitleg tenzij gevraagd
- Versienummering: gewijzigde bestanden krijgen verhoogd versienummer
