# MyFamTreeCollab — Project Log
## Bijgewerkt: 2026-05-26

> Chronologisch overzicht van alle sessies en wijzigingen.

---

## Sessie 31 — Bugfix: admin/developer menu verdwenen na Supabase security-fix

**Datum:** 2026-05-26
**Doel:** Admin- en developer-navigatiemenu herstellen na uitvoering van Supabase security-fix (sessie 29).

---

### Aanleiding

Na de security-fix van sessie 29 waren de `Administrator` en `Developer` dropdowns in de navigatie niet meer zichtbaar voor de admin-gebruiker (Vorilo). De pagina's zelf bestonden nog, maar de menu-items bleven verborgen (`style="display:none;"`).

---

### Analyse

De oorzaak lag in drie samenhangende problemen:

**Probleem 1 — Recursieve RLS-policy op `profiles`:**
De security-fix had nieuwe RLS-policies aangemaakt zonder de oude te verwijderen. De policy `profiles: admin leest alles` bevatte een subquery op dezelfde tabel:
```sql
EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
```
Dit veroorzaakte infinite recursion, waardoor `getProfile()` in `auth.js` faalde en `_showAdminDropdown(false)` werd aangeroepen.

**Probleem 2 — `admin_users` view verwijderd:**
De security-fix had `DROP VIEW public.admin_users` uitgevoerd (sessie 29). `accountbeheer.js` deed een query op deze view → `PGRST205: Could not find table 'public.admin_users'`.

**Probleem 3 — View joinde op `auth.users`:**
De herstelde `admin_users` view deed een `LEFT JOIN auth.users` — de `authenticated` rol heeft geen toegang tot `auth.users` → `42501: permission denied for table users`.

---

### Uitgevoerde acties

#### Fix 1 — RLS-policies `profiles` herschreven

Alle bestaande policies verwijderd via `DO $$` loop, daarna `SECURITY DEFINER` hulpfunctie aangemaakt:

```sql
CREATE OR REPLACE FUNCTION public.is_admin_check()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT coalesce((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
$$;
```

Nieuwe schone policies aangemaakt zonder recursie:

| Policy | Operatie | Conditie |
|--------|----------|----------|
| `profiel: eigen rij lezen` | SELECT | `auth.uid() = id` |
| `profiel: admin leest alles` | SELECT | `public.is_admin_check()` |
| `profiel: tier leesbaar voor uitnodigen` | SELECT | `auth.uid() IS NOT NULL` |
| `profiel: eigen rij aanmaken` | INSERT | `auth.uid() = id` |
| `profiel: eigen rij bijwerken` | UPDATE | `auth.uid() = id` |
| `profiel: admin bijwerkt alles` | UPDATE | `public.is_admin_check()` |

#### Fix 2 — `email_confirmed_at` naar `profiles` verplaatst

Kolom toegevoegd aan `profiles` zodat join op `auth.users` niet meer nodig is:

```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_confirmed_at timestamp with time zone;
```

Synchronisatiefunctie + trigger aangemaakt:
- `public.sync_email_confirmed_at()` — eenmalige backfill via SECURITY DEFINER
- `public.trg_sync_email_confirmed_at()` — trigger op `auth.users.email_confirmed_at` UPDATE

#### Fix 3 — `admin_users` view hersteld zonder `auth.users` join

```sql
CREATE VIEW public.admin_users WITH (security_invoker = true) AS
SELECT id, username, email, tier, is_admin, is_premium, created_at, tier_until, email_confirmed_at
FROM public.profiles;

GRANT SELECT ON public.admin_users TO authenticated;
REVOKE SELECT ON public.admin_users FROM anon;
```

---

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `js/topbar.js` | v2.3.1 | v2.3.2 | `_showAdminDropdown()` herschreven van `setInterval`-poll naar `MutationObserver` — race condition fix |
| `develop/standaardpagina.html` | v1.3.0 | v1.4.0 | `loadScript()` helper toegevoegd — `topbar.js` via Promise geladen zodat Navbar-fetch pas start na volledige uitvoering |

> Opmerking: `topbar.js` v2.3.2 en `standaardpagina.html` v1.4.0 lossen een aparte race condition op die bij trage i18n-initialisatie kan optreden. De RLS-fix was de primaire oplossing voor het admin-menu probleem.

---

### Database wijzigingen

| Object | Type | Wijziging |
|--------|------|-----------|
| `public.is_admin_check()` | Functie | Nieuw aangemaakt — SECURITY DEFINER, geen recursie |
| `public.profiles` | Tabel | Kolom `email_confirmed_at` toegevoegd |
| `public.sync_email_confirmed_at()` | Functie | Nieuw — eenmalige backfill vanuit `auth.users` |
| `public.trg_sync_email_confirmed_at()` | Trigger-functie | Nieuw — auto-sync bij update `auth.users` |
| `sync_confirmed_at` | Trigger | Nieuw — op `auth.users` AFTER UPDATE OF `email_confirmed_at` |
| `public.admin_users` | View | Hersteld — `security_invoker=true`, geen `auth.users` join |
| RLS policies `profiles` | Policies | Alle oude verwijderd, 6 nieuwe aangemaakt via `is_admin_check()` |

---

### Bugfixes

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-57 | Admin/developer menu verborgen na security-fix — recursieve RLS op `profiles` veroorzaakte `getProfile()` fout. Opgelost via `SECURITY DEFINER` functie `is_admin_check()`. | ✅ Opgelost |
| BF-58 | `accountbeheer.html` — `admin_users` view ontbrak na security-fix. View hersteld zonder `auth.users` join. | ✅ Opgelost |
| BF-59 | `admin_users` view — `permission denied for table users`. `email_confirmed_at` naar `profiles` verplaatst via trigger. | ✅ Opgelost |

---

### Open na sessie 31

| ID | Taak |
|----|------|
| SEC-04 | Editor-rol schrijfrecht op `stambomen` via `stamboom_gedeeld.rol` |
| F8-15 | `lang-link` handlers verwijderen uit `topbar.js` (TD-09) |
| F8-19 | `handleiding-nl.html` bijwerken met i18n uitleg |
| F8-56 | Import-parser aanpassen: rij 2 lezen als technische header (schema.js) |
| F9-01 t/m F9-09 | Bronnen-module implementeren (genealogisch onderzoek) |
| TD-06 | `home/import-en.html` laadt import.js zonder schema.js + storage.js |
| TD-11 | Import-parser leest rij 1 als header |
| AN-21 | `stamboom/account.html` — tracking toevoegen |

---

## Sessie 30 — i18n uitgerold op abonnementen-pagina's

**Datum:** 2026-05-25
**Doel:** Namespaces `overzicht` / `prijzen` / `vergelijk` / `voordelen` implementeren (nl/en/es). Race condition bugfix voor alle abonnementen-pagina's.

---

### Aanleiding

Vervolg op sessie 27–28 (i18n bronnen/gemeenschap/develop). De vier pagina's onder `abonnementen/` hadden nog geen i18n. Daarnaast werd tijdens implementatie een structurele bug ontdekt die alle i18n-pagina's zonder eigen `.js` bestand treft.

---

### Bugfix — Race condition (BF-56)

**Symptoom:** Keys toonden als key-naam (bijv. `tabel.title`, `donatie.periodiek_per`) in alle talen.

**Rootcause:** `i18nModule.init()` roept intern `updateContent()` aan vóór `loadNamespace()` klaar is. Op dat moment is de pagina-namespace nog niet geladen → i18next geeft de key-naam terug als fallback. Pagina's zónder eigen `.js` bestand (inline `loadNamespace()` in script-blok) leden hier het meest onder.

**Oplossing:** Tweestaps-aanpak — zelfde patroon als `stats.js`, `collab.js`, `view.js` (sessie 26):
1. Inline script roept **alleen** `i18nModule.init()` aan
2. Na resolve wordt het pagina-specifieke `.js` bestand dynamisch geïnjecteerd
3. Dat bestand roept `loadNamespace()` aan — nu is i18next volledig klaar

---

### Uitgevoerde acties

#### abonnementen/ — i18n uitgerold

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `abonnementen/overzicht.html` | v2.3.0 | v2.4.0 | i18n + namespace `overzicht` + inject `overzicht.js` |
| `abonnementen/prijzen.html` | v2.4.0 | v2.5.0 | i18n + namespace `prijzen` + inject `prijzen.js` |
| `abonnementen/vergelijk.html` | v2.2.0 | v2.3.0 | i18n + namespace `vergelijk` + inject `vergelijk.js` |
| `abonnementen/voordelen.html` | v2.2.0 | v2.3.0 | i18n + namespace `voordelen` + inject `voordelen.js` |

#### JS bestanden aangemaakt

| Bestand | Versie | HTML-blokken via innerHTML |
|---------|--------|---------------------------|
| `js/overzicht.js` | v1.0.0 | `rechten-intro` (strong/code/em), `donatie-noot` (strong) |
| `js/prijzen.js` | v1.0.0 | `donatie-noot` (strong) |
| `js/vergelijk.js` | v1.0.0 | `info-blok` (strong, a) |
| `js/voordelen.js` | v1.0.0 | geen (alle tekst plain) |

#### Nieuwe locale bestanden aangemaakt (nl/en/es)

- `locales/*/overzicht.json` — page, hoe (4 stappen), accountTypes (3 kaarten), rechten (viewer/editor), donatie (3 opties + noot), cta
- `locales/*/prijzen.json` — page, tabel (kolomhoofden + 14 features + 4 waarden), donatie (3 kaarten + noot), faq (4 vragen), cta
- `locales/*/vergelijk.json` — page, info (innerHTML), tabel (kolomhoofden + 14 features + 4 waarden), cta
- `locales/*/voordelen.json` — page, grid (5 kaarten × titel + tekst + 3 features), cta

#### HTML-blokken met innerHTML

Elementen die HTML-opmaak bevatten (`<strong>`, `<code>`, `<em>`, `<a>`) kunnen niet via `data-i18n` vertaald worden — dat gebruikt `textContent` en strips opmaak. Oplossing: element krijgt een `id`, pagina-JS vult het via `_translateHTML(id, key)` met `innerHTML`. Listener op `languageChanged` hertaalt bij taalwissel.

---

### Gewijzigde bestanden

| Bestand | Van | Naar |
|---------|-----|------|
| `abonnementen/overzicht.html` | v2.3.0 | v2.4.0 |
| `abonnementen/prijzen.html` | v2.4.0 | v2.5.0 |
| `abonnementen/vergelijk.html` | v2.2.0 | v2.3.0 |
| `abonnementen/voordelen.html` | v2.2.0 | v2.3.0 |
| `js/overzicht.js` | — | v1.0.0 (nieuw) |
| `js/prijzen.js` | — | v1.0.0 (nieuw) |
| `js/vergelijk.js` | — | v1.0.0 (nieuw) |
| `js/voordelen.js` | — | v1.0.0 (nieuw) |
| `locales/{nl,en,es}/overzicht.json` | — | v1.0.0 (nieuw) |
| `locales/{nl,en,es}/prijzen.json` | — | v1.0.0 (nieuw) |
| `locales/{nl,en,es}/vergelijk.json` | — | v1.0.0 (nieuw) |
| `locales/{nl,en,es}/voordelen.json` | — | v1.0.0 (nieuw) |
| `BACKLOG.md` | — | F8-58/59/60/61 ✅, BF-56 ✅ toegevoegd |
| `PROJECT_LOG.md` | — | Sessie 30 toegevoegd |

---

### Bugfixes

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-56 | Race condition — i18n keys toonden als key-naam op abonnementen-pagina's. Init() roept updateContent() aan vóór loadNamespace() klaar is. Opgelost via dynamische JS-injectie na init() resolve. | ✅ Opgelost |

---

### Open na sessie 30

| ID | Taak |
|----|------|
| SEC-04 | Editor-rol schrijfrecht op `stambomen` via `stamboom_gedeeld.rol` |
| F8-15 | `lang-link` handlers verwijderen uit `topbar.js` (TD-09) |
| F8-19 | `handleiding-nl.html` bijwerken met i18n uitleg |
| F8-56 | Import-parser aanpassen: rij 2 lezen als technische header (schema.js) |
| F9-01 t/m F9-09 | Bronnen-module implementeren (genealogisch onderzoek) |
| TD-06 | `home/import-en.html` laadt import.js zonder schema.js + storage.js |
| TD-11 | Import-parser leest rij 1 als header |
| AN-21 | `stamboom/account.html` — tracking toevoegen |

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
- Fout hersteld: alle keys zaten aanvankelijk in één `bronnen.json` — opgesplitst naar losse namespace per pagina
- Namespace separator correct: `pagina:key` (dubbele punt), niet `pagina.key`

#### bronnen/ — i18n uitgerold
- `bronnen/artikelen.html` v0.2.0 → v0.3.0, `bronnen/extern.html` v0.2.0 → v0.3.0, `bronnen/instructies.html` v0.2.0 → v0.3.0
- `bronnen/handleiding.html` → drie taalversies (nl/en/es) + redirect-bestand (404-fix)
- `bronnen/template.html` v2.1.0 → v2.2.0: i18n + meertalige tabel + meertalige CSV-download

#### gemeenschap/ — i18n uitgerold + bugs gefixed
- contact, discussies, evenement, forum, groepen: v0.2.0 → v0.3.0 + dubbele scripts/blokken verwijderd

#### develop/ — i18n uitgerold + bugs gefixed
- blank, maintenance, sandbox, standaardpagina: versies bijgewerkt + eruda verwijderd

#### Navbar bijgewerkt
- `Layout/Navbar.html` v1.1.0 → v1.2.0: handleiding link + kapotte tag gecorrigeerd

---

## Sessie 26 — i18n uitrollen op Stamboom-menu pagina's + auth namespace

**Datum:** 2026-05-15
**Doel:** i18next namespace setup uitrollen op alle pagina's onder het Stamboom-menu. Auth namespace aanmaken voor login modal, reset en confirm flow.

---

### Uitgevoerde acties

- `stamboom/stats.html`, `collab.html`, `storage.html`, `view.html`, `timeline.html`, `manage.html` gerefactord
- `js/collab.js`, `js/view.js`, `js/timeline.js`, `js/manage.js`, `js/auth.js`, `js/topbar.js`, `js/reset.js` bijgewerkt
- Auth namespace aangemaakt + bugfixes stats.html timing + topbar modal

---

## Sessie 25 — i18n uitrollen op Start-menu pagina's + docs vertaling

**Datum:** 2026-05-12

- Navbar, Footer, about, print, import, export, create gerefactord met data-i18n
- `js/import.js`, `js/export.js`, `js/create.js` statusmeldingen via i18n
- `Docs/disclaimer.html`, `privacy.html`, `terms.html` drietalig (EN/NL/ES)

---

## Sessie 24 — i18next meertalige architectuur (index.html)

**Datum:** 2026-05-10

- `js/i18n.js` v1.0.0 aangemaakt — core i18n module
- `locales/{nl,en,es}/{common,home}.json` aangemaakt
- `index.html` v2.2.1 → v2.3.1: data-i18n, CDN naar head, onComponentLoaded
- `Layout/TopBar.html` v0.4 → v0.5: language switcher select

---

## Sessies 1–24 — Zie eerdere PROJECT_LOG.md entries
