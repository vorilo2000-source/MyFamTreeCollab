# MyFamTreeCollab — Project.md
## Bijgewerkt: 2026-05-07

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
utils.js          ← altijd EERSTE
schema.js
idGenerator.js    ← alleen op pagina's met formulier (create, manage)
storage.js
auth.js           ← vereist Supabase SDK vóór dit script
LiveSearch.js
relatieEngine.js  ← vóór view.js / manage.js / timeline.js
cloudSync.js      ← na auth.js
versionControl.js ← na cloudSync.js (optioneel, non-fatal als afwezig)
siteAnalytics.js  ← na auth.js (tier beschikbaar)
topbar.js         ← geïnjecteerd ná TopBar HTML (garandeert #top-auth in DOM)
[pagina].js       ← altijd LAATSTE
```

### Globale exports (window.*) — nooit lokaal herdefiniëren

| Export | Bron | Versie |
|---|---|---|
| `window.ftSafe`, `window.ftFormatDate`, `window.ftParseBirthday` | utils.js | — |
| `window.genereerCode` | idGenerator.js | — |
| `window.StamboomSchema` | schema.js | — |
| `window.StamboomStorage` | storage.js | v2.2.0 |
| `window.AuthModule` | auth.js | v2.5.1 |
| `window.CloudSync` | cloudSync.js | v2.2.1 |
| `window.VersionControl` | versionControl.js | v1.1.0 |
| `window.RelatieEngine.computeRelaties` | relatieEngine.js | — |
| `window.liveSearch`, `window.initLiveSearch` | LiveSearch.js | — |
| `window.ExportModule.exportCSV`, `window.ExportModule.exportJSON` | export.js | — |
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
| TD-07 | Resend SMTP zonder eigen domein — ingebouwde Supabase mail actief (3/uur limiet) | 🟡 Middel |
| TD-08 | async/await mismatch — alle call-sites van storage.add() controleren | 🟡 Middel |
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
