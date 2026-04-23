# BACKLOG.md — MyFamTreeCollab
## Bijgewerkt: 2026-04-23

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

### 3A — Facelift alle pagina's ✅ AFGEROND

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F3-29 | 🟡 Middel | `home/export.html` facelift (v2.1.0) | ✅ Gedaan |
| F3-30 | 🟡 Middel | `home/create.html` facelift (v2.0.0) | ✅ Gedaan |
| F3-31 | 🟡 Middel | `home/import.html` facelift (v2.0.0) | ✅ Gedaan |
| F3-32 | 🟡 Middel | `home/about.html` facelift (v2.0.0) | ✅ Gedaan |
| F3-33 | 🟡 Middel | `home/print.html` facelift (v2.0.0) | ✅ Gedaan |
| F3-34 | 🟡 Middel | `stamboom/stats.html` facelift (v2.0.0) | ✅ Gedaan |
| F3-35 | 🟡 Middel | `stamboom/view.html` facelift (v2.0.0) | ✅ Gedaan |
| F3-36 | 🟡 Middel | `stamboom/timeline.html` facelift (v2.0.0) | ✅ Gedaan |
| F3-37 | 🟡 Middel | `stamboom/storage.html` facelift (v2.0.0) | ✅ Gedaan |
| F3-38 | 🟡 Middel | `index.html` facelift (v2.0.0) | ✅ Gedaan |
| F3-39 | 🟡 Middel | `bronnen/template.html` facelift (v2.0.0) | ✅ Gedaan |
| F3-40 | 🟡 Middel | `stamboom/manage.html` facelift (v2.0.0) | ✅ Gedaan |
| F3-41 | 🟡 Middel | `css/Tree.css` opgeschoond (v2.0.0) | ✅ Gedaan |
| F3-42 | 🟡 Middel | Alle versienummers gestandaardiseerd naar v2.0.0 | ✅ Gedaan |

### 3B — Zoekfunctie

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F3-43 | 🔴 Hoog | Zoekresultaten highlighten (zoekterm vetgedrukt in resultaat) | ❌ Geannuleerd |
| F3-44 | 🔴 Hoog | Zoeken op meerdere velden tegelijk (voornaam + achternaam) | ✅ Gedaan |
| F3-45 | 🟡 Middel | Popup-stijlen verplaatsen van inline JS naar `style.css` | 📋 Open |
| F3-46 | 🟡 Middel | Keyboard navigatie in zoekpopup (pijltoetsen + Enter) | 📋 Open |
| F3-47 | 🟢 Laag | Zoekgeschiedenis (recent gezochte personen) | 📋 Open |

### 3C — Relaties

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F3-48 | 🔴 Hoog | Meerdere partners ondersteunen (PartnerID als array met `\|`) | 📋 Open |
| F3-49 | 🔴 Hoog | Relatie toevoegen vanuit `manage.html` (dropdown + zoekbalk) | 📋 Open |
| F3-50 | 🟡 Middel | Grootouders en kleinkinderen tonen in view.html | 📋 Open |
| F3-51 | 🟡 Middel | Halfbroers/halfzussen correct onderscheiden | 📋 Open |
| F3-52 | 🟢 Laag | Relatie-labels vertalen (VHoofdID → Vader, MHoofdID → Moeder) | 📋 Open |

### 3D — Stamboomvisualisatie (view.html)

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F3-53 | 🔴 Hoog | Verbindingslijnen tekenen tussen nodes (SVG of CSS) | 🔮 Toekomst |
| F3-54 | 🔴 Hoog | Foto/avatar toevoegen aan persoon-node | 🔮 Toekomst |
| F3-55 | 🟡 Middel | Zoom en pan op de stamboomweergave | 🔮 Toekomst |
| F3-56 | 🟢 Laag | Uitklappen/inklappen van takken | 🔮 Toekomst |

### 3E — Tijdlijn (timeline.html)

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F3-57 | 🔴 Hoog | Overlijdensdatum tonen op tijdlijn | ✅ Gedaan |
| F3-58 | 🟡 Middel | Levensspanne als balk weergeven (geboorte → overlijden) | 🔮 Toekomst |
| F3-59 | 🟡 Middel | Schaalbare tijdas (zoom in op bepaalde periode) | 🔮 Toekomst |
| F3-60 | 🟢 Laag | Historische gebeurtenissen toevoegen aan tijdlijn | 🔮 Toekomst |

### 3F — Import / export

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F3-61 | 🔴 Hoog | `import.js` herschrijven met inline commentaar (v2.0.0) | 📋 Open |
| F3-62 | 🔴 Hoog | Import validatie: dubbele ID's detecteren en melden | 📋 Open |
| F3-63 | 🟡 Middel | Import preview tonen vóór opslaan | 📋 Open |
| F3-64 | 🟡 Middel | GEDCOM-formaat importeren (standaard stamboomformaat) | 📋 Open |

### 3G — Engelse versies

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F3-65 | 🔴 Hoog | `stamboom/manage-en.html` repareren en facelift | 🔮 Toekomst |
| F3-66 | 🔴 Hoog | `home/export-en.html` synchroniseren met `export.html` | 🔮 Toekomst |
| F3-67 | 🔴 Hoog | `home/import-en.html` repareren: mist schema.js + storage.js | 🔮 Toekomst |

### 3H — Overige

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F3-68 | 🟡 Middel | `stamboom/stats.html` JS verplaatsen naar apart `stats.js` | 📋 Open |
| F3-69 | 🟡 Middel | `home/print.html` implementeren (printweergave stamboom) | 📋 Open |
| F3-70 | 🟢 Laag | `schema.js` herschrijven met inline commentaar (v2.0.0) | 📋 Open |

---

## Fase A — Account & donaties ✅ AFGEROND

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| FA-01 | 🔴 Hoog | Supabase project aanmaken + API-key configureren | ✅ Gedaan |
| FA-02 | 🔴 Hoog | `js/auth.js` aanmaken: registreren, inloggen, uitloggen (v2.3.0) | ✅ Gedaan |
| FA-03 | 🔴 Hoog | Login modal via `js/topbar.js`: popup met tabs inloggen/registreren (v2.0.3) | ✅ Gedaan |
| FA-04 | 🔴 Hoog | TopBar uitbreiden: gebruikersnaam + uitlogknop via `topbar.js` | ✅ Gedaan |
| FA-05 | 🟡 Middel | Sessie bewaren na pagina-refresh (Supabase session) | ✅ Gedaan |
| FA-06 | 🟡 Middel | Ko-fi donatie knop in TopBar en Footer | ✅ Gedaan |
| FA-07 | 🔴 Hoog | Wachtwoord vergeten flow: `home/reset.html` + `js/reset.js` (v1.0.0) | ✅ Gedaan |
| FA-08 | 🔴 Hoog | SMTP instellen via Gmail App Password | ✅ Gedaan |
| FA-09 | 🟡 Middel | Supabase redirect URL instellen naar live GitHub Pages site | ✅ Gedaan |
| FA-10 | 🟡 Middel | Supabase profiles tabel aanmaken met username + avatar_id + RLS | ✅ Gedaan |
| FA-11 | 🟢 Laag | Donateurs-badge (toekomstig — na Ko-fi webhook integratie) | 🔮 Toekomst |
| FA-12 | 🟡 Middel | E-mail templates huisstijl (alle 5 templates) | ✅ Gedaan |
| FA-13 | 🔴 Hoog | Admin dropdown verbergen voor niet-admins | ✅ Gedaan |
| FA-14 | 🟡 Middel | Admin beheerpagina in `develop/admin/` — gebruikers en tiers beheren via website | 📋 Open |

---

## Fase A+ — Cloud backup ✅ AFGEROND

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| FA+-01 | 🔴 Hoog | Supabase tabel `stambomen` aanmaken (user_id, data JSON, updated_at) | ✅ Gedaan |
| FA+-02 | 🔴 Hoog | `js/cloudSync.js` aanmaken: `saveToCloud()`, `loadFromCloud()`, `getCloudMeta()` | ✅ Gedaan |
| FA+-03 | 🔴 Hoog | `stamboom/storage.html` tabbladen: Mijn data + Cloud backup | ✅ Gedaan |
| FA+-04 | 🔴 Hoog | Gratis limiet bewaken: max 100 personen lokaal voor free tier | ✅ Gedaan |
| FA+-05 | 🟡 Middel | "Laad vanuit cloud" knop op `storage.html` | ✅ Gedaan |
| FA+-06 | 🟡 Middel | Conflictmelding tonen als cloud-versie nieuwer is dan lokale versie | ✅ Gedaan |
| FA+-07 | 🟡 Middel | `home/account.html` aanmaken | 🔮 Toekomst |
| FA+-08 | 🟢 Laag | Timestamp tonen van laatste cloud-backup op `storage.html` | ✅ Gedaan |
| FA+-09 | 🔴 Hoog | Tier/rollen systeem: is_admin, is_premium, tier, tier_until in profiles | ✅ Gedaan |
| FA+-10 | 🔴 Hoog | Cloud toegang alleen voor premium/admin — gratis gebruikers zien upgrade melding | ✅ Gedaan |

---

## Fase 4 — Nieuwe features

### 4A — Persoonsbeheer

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F4-01 | 🔴 Hoog | Persoon verwijderen vanuit `manage.html` | ✅ Gedaan |
| F4-02 | 🔴 Hoog | Persoon dupliceren als startpunt voor vergelijkbaar record | 🔮 Toekomst |
| F4-03 | 🟡 Middel | Foto uploaden en koppelen aan persoon (base64 in localStorage) | 🔮 Toekomst |
| F4-04 | 🟡 Middel | Notities/opmerkingen uitbreiden (rijke tekst) | 🔮 Toekomst |

### 4B — Zoeken & filteren

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F4-05 | 🟡 Middel | Geavanceerd zoeken: filteren op geboortejaar, geslacht, relatie | ✅ Gedaan |
| F4-06 | 🟡 Middel | Personen sorteren op achternaam, geboortedatum | 📋 Open |
| F4-07 | 🟢 Laag | Zoeken over meerdere stambomen tegelijk | 📋 Open |

### 4C — Statistieken

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F4-08 | 🟡 Middel | Grafiek: verdeling geboortejaren per decennium | 📋 Open |
| F4-09 | 🟡 Middel | Grafiek: verhouding M/V/X in de stamboom | 📋 Open |
| F4-10 | 🟢 Laag | Oudste en jongste persoon highlighten | 📋 Open |
| F4-11 | 🟢 Laag | Gemiddelde leeftijd berekenen | 📋 Open |

### 4D — UX verbeteringen

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F4-12 | 🟡 Middel | Donkere modus ondersteuning (CSS variabelen) | 📋 Open |
| F4-13 | 🟡 Middel | Mobielvriendelijke weergave voor manage en view | 📋 Open |
| F4-14 | 🟡 Middel | Ongedaan maken (undo) bij verwijderen of wijzigen | 📋 Open |
| F4-15 | 🟢 Laag | Toetsenbordsnelkoppelingen voor veelgebruikte acties | 📋 Open |

---

## Fase 5 — Cloud & accounts ✅ AFGEROND

| ID | Taak | Status |
|----|------|--------|
| F5-01 | Backend: Supabase ✅ gekozen en opgezet | ✅ Gedaan |
| F5-02 | Gebruikersaccounts: registreren, inloggen, uitloggen | ✅ Gedaan |
| F5-03 | Data sync tussen apparaten | ✅ Gedaan |
| F5-04 | Stamboom delen met andere gebruikers (viewer + editor rollen) | ✅ Gedaan |
| F5-05 | Samenwerkingsmodus: berichtenboard per persoon (collab.html) | ✅ Gedaan |
| F5-06 | Versiebeheer per persoon (wijzigingshistorie) | ✅ Gedaan |
| F5-07 | Meerdere stambomen per gebruiker in cloud | ✅ Gedaan |
| F5-08 | account.html — overzicht stambomen, backups, profiel | ✅ Gedaan |
| F5-09 | Promotiecodes voor cloud toegang | 🔮 Toekomst |
| F5-10 | Abonnementen en betaaltiers verder uitwerken | → Fase 7 |
| F5-11 | Ko-fi webhook integratie voor donateur-badge | → Fase 7 |

---

## Fase 6 — Rolmodel implementatie 🔄 HUIDIG

> Herziening van het tier-systeem naar een vereenvoudigd rolmodel.
> Rollen: gast (geen account) · viewer · editor · owner · admin
> Volledig besluitvormingsdocument in PROJECT_LOG.md Sessie 14.
>
> **Volgorde verplicht:** F6-01 en F6-02 (Supabase migratie) ALTIJD eerst uitvoeren
> voordat andere F6-taken worden opgepakt.

### 6A — Supabase & auth (eerst uitvoeren)

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F6-01 | 🔴 Hoog | Supabase: tier constraint aanpassen naar `viewer`, `editor`, `owner`, `admin` | ✅ Gedaan |
| F6-02 | 🔴 Hoog | Supabase: bestaande accounts migreren naar nieuw tier-model | ✅ Gedaan |
| F6-03 | 🔴 Hoog | `js/auth.js` — `getTier()` mapping aanpassen naar nieuw rolmodel | 📋 Open |
| F6-04 | 🔴 Hoog | `js/cloudSync.js` — `CLOUD_TIERS` → `['owner', 'admin']`, gast limiet → 60 personen | 📋 Open |
| F6-05 | 🔴 Hoog | `js/shareModule.js` — tier-check: alleen `owner` mag uitnodigen | 📋 Open |
| F6-06 | 🔴 Hoog | `js/accessGuard.js` — rolnamen aanpassen aan nieuw model | 📋 Open |
| F6-07 | 🟡 Middel | `js/storage.js` — persoonslimiet gast aanpassen van 100 naar 60 | 📋 Open |

### 6B — Demo database

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F6-08 | 🔴 Hoog | `js/demo.js` aanmaken — hardcoded fictieve demo stamboom, laadt bij gast-sessie, reset per sessie | 📋 Open |
| F6-09 | 🟡 Middel | Demo stamboom inhoud samenstellen (fictieve familie, gevarieerde data, meerdere generaties) | 📋 Open |
| F6-10 | 🟡 Middel | Demo-melding tonen voor gast: "Je werkt met een demo stamboom — maak een account aan om op te slaan" | 📋 Open |

### 6C — Upgrade flow & UI

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F6-11 | 🔴 Hoog | Lokale data overnemen bij upgrade gast → owner (upload naar cloud bij eerste opwaardering) | 📋 Open |
| F6-12 | 🟡 Middel | UI: upgrade-prompt tonen voor gast/viewer/editor op cloud-functies | 📋 Open |
| F6-13 | 🟡 Middel | Tekstaanpassing uitnodiging `storage.html`: "Uitnodiging verstuurd" → "[email] toegevoegd als [rol]" | 📋 Open |

### 6D — Versiebeheer aanpassen

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F6-14 | 🟡 Middel | Versielimiet aanpassen van 20 naar 5 per stamboom in `versionControl.js` | 📋 Open |
| F6-15 | 🟡 Middel | Versies terugzetten alleen beschikbaar voor owner en admin | 📋 Open |

### 6E — Handleiding & UI teksten

| ID | Prioriteit | Taak | Status |
|----|-----------|------|--------|
| F6-16 | 🟡 Middel | `bronnen/handleiding.html` — rolbeschrijvingen herschrijven naar nieuw model | ✅ Gedaan |
| F6-17 | 🟢 Laag | `abonnementen/overzicht.html` bijwerken naar nieuwe rollen | 📋 Open |

---

## Fase 7 — Businessmodel & betaling 🔮 TOEKOMST

| ID | Taak | Status |
|----|------|--------|
| F7-01 | Stripe integratie voor owner-donatie (~€5 per 6 maanden) | 🔮 Toekomst |
| F7-02 | Supabase webhook: Stripe betaling → tier automatisch naar `owner` | 🔮 Toekomst |
| F7-03 | Bedrijfsoprichting & belastingstructuur | 🔮 Toekomst |
| F7-04 | Ko-fi behouden als vrijwillige steunknop (niet als toegangspoort) | 🔮 Toekomst |
| F7-05 | Prijsstelling definitief vaststellen (owner-donatie bedrag en periode) | 🔮 Toekomst |
| F7-06 | Owner-limiet verhogen op basis van inkomsten en Supabase kosten | 🔮 Toekomst |

---

## Bugfixes sessie 2026-04-19

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-01 | Supabase Site URL verkeerd — bevestigingsmail wees naar 404 | ✅ Opgelost |
| BF-02 | create.js — confirmBtn async/await mismatch, eerste persoon niet opgeslagen | ✅ Opgelost |
| BF-03 | history.js — CloudSync.listStambomen() result object niet unwrapped | ✅ Opgelost |
| BF-04 | history.html — Supabase SDK + auth.js ontbraken in laadvolgorde | ✅ Opgelost |
| BF-05 | topbar.js — localStorage niet gewist bij uit/inloggen | ✅ Opgelost |
| BF-06 | topbar.js — SIGNED_IN bij token refresh wiste cloud-geladen data | ✅ Opgelost |
| BF-07 | storage.html — renderTable() niet aangeroepen na cloud laden | ✅ Opgelost |
| BF-08 | cloudSync.js — dubbele .eq('id', userId) bug in saveToCloud() | ✅ Opgelost |

## Bugfixes sessie 2026-04-20/21

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-09 | cloudSync.js v2.1.2 — loadFromCloud() blokkeerde viewers/editors door user_id filter | ✅ Opgelost |
| BF-10 | cloudSync.js v2.1.2 — saveToCloud() blokkeerde editor-opslag door user_id filter op update | ✅ Opgelost |
| BF-11 | shareModule.js v1.0.1 — listSharedWith() toonde "Onbekend" door ontbrekende profiles fallback | ✅ Opgelost |
| BF-12 | Supabase RLS — profiles select policy te strikt voor tier-leestoegang bij uitnodigen | ✅ Opgelost |

## Bugfixes sessie 2026-04-23

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-13 | Bevestigingsmail redirect naar root GitHub Pages i.p.v. /MyFamTreeCollab/ — opgelost via `{{ .SiteURL }}/#{{ .TokenHash }}&type=signup` in Confirm signup template | ✅ Opgelost |
| BF-14 | topbar.js — developDropdown niet zichtbaar voor admin | ✅ Opgelost |

---

## Verbeteringen

| ID | Omschrijving | Status |
|----|-------------|--------|
| VB-01 | topbar.js v2.2.0 — gebruikersmenu dropdown (Account / Versiegeschiedenis / Uitloggen) | ✅ Gedaan |
| VB-02 | storage.html v2.5.0 — wissel modal bij laden andere stamboom (3 knoppen) | ✅ Gedaan |
| VB-03 | topbar.js v2.2.2 — developDropdown zichtbaar voor admin naast adminDropdown | ✅ Gedaan |

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
| TD-07 | SMTP via Gmail App Password — niet ideaal voor productie, eigen domein nodig | 🟡 Middel |
| TD-08 | async/await mismatch — alle call-sites van storage.add() controleren buiten create.js | 🟡 Middel |
| TD-09 | Tier-constraint Supabase nog op oud model — blokkerende vereiste voor Fase 6 | ✅ Opgelost in Sessie 15 |

---

## Definition of Done

Een taak is **klaar** als:
- [ ] De code werkt zoals bedoeld
- [ ] Inline commentaar aanwezig op elke coderegel
- [ ] Bestandsheader bijgewerkt met versienummer (v2.0.0+)
- [ ] `PROJECT_LOG.md` bijgewerkt
- [ ] `BACKLOG.md` bijgewerkt: taak op ✅ Gedaan
- [ ] Getest in de browser (geen console-errors)
