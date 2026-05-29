# MyFamTreeCollab — Project Log
## Bijgewerkt: 2026-05-29

> Chronologisch overzicht van alle sessies en wijzigingen.

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
**Doel:** Supabase analyse pagina bouwen en admin-paginabeveiliging voorbereiden.

---

### Uitgevoerde acties

#### admin/supabase-analyse.html — nieuw aangemaakt (v1.0.0 → v3.2.0)

Volledig nieuwe admin-pagina die live Supabase-data toont via de bestaande `AuthModule.getClient()` sessie (anon key, geen Service Role Key op de client).

**Secties:**
- Stat cards: Database grootte | Stambomen | Personen | Gebruikers
- Voortgangsbalk: database gebruik vs. 500 MB Free plan limiet
- Stambomen — overzicht per gebruiker (email, aantal bomen, personen, grootte, laatste update)
- Stambomen — detail per boom (naam, eigenaar, personen, JSONB-grootte, laatste update)
- Database — grootte per tabel (schema, tabel, totaal, data, indexen, rijen)

**Toegangscontrole:** `AuthModule.getTier()` — niet-admins zien een rood foutscherm, geen data wordt geladen.

**SQL-functies aangemaakt in Supabase (SECURITY DEFINER):**
- `get_table_sizes()` — tabelgroottes via `pg_catalog`
- `get_user_storage_summary()` — vervallen (app gebruikt geen Storage buckets)
- `get_tree_stats()` — stambomen + personen per gebruiker, joinet `auth.users` voor email

**Ontdekt:** app gebruikt geen Supabase Storage — stamboomdata zit als JSONB-array in `public.stambomen.data`. Storage-secties vervangen door stamboom-analyse.

#### Navbar.html — v1.2.0 → v1.3.0
- `supabase-analyse.html` toegevoegd aan Administrator dropdown
- `data-i18n="common:nav.sub.supabaseAnalyse"` toegevoegd

#### locales/common.json — alle 3 talen bijgewerkt
- NL: `nav.sub.supabaseAnalyse` → `"Supabase Analyse"`
- EN: `nav.sub.supabaseAnalyse` → `"Supabase Analysis"`
- ES: `nav.sub.supabaseAnalyse` → `"Análisis Supabase"`

---

### Versie-overzicht gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `admin/supabase-analyse.html` | — | v3.2.0 (nieuw) | Volledige Supabase analyse pagina |
| `Layout/Navbar.html` | v1.2.0 | v1.3.0 | Supabase Analyse link toegevoegd |
| `locales/nl/common.json` | — | supabaseAnalyse key toegevoegd |
| `locales/en/common.json` | — | supabaseAnalyse key toegevoegd |
| `locales/es/common.json` | — | supabaseAnalyse key toegevoegd |

---

### Supabase database wijzigingen

| Object | Type | Wijziging |
|--------|------|-----------|
| `get_table_sizes()` | Functie | Nieuw — SECURITY DEFINER, leest pg_catalog |
| `get_tree_stats()` | Functie | Nieuw — SECURITY DEFINER, joinet auth.users voor email |
| Beide functies | GRANT | `EXECUTE TO anon, authenticated` |

---

### Volgende sessie — Admin toegangsbeveiliging

Alle pagina's die alleen voor admins bedoeld zijn krijgen dezelfde beveiligingslaag als `supabase-analyse.html`:
- `AuthModule.getTier()` check bij laden
- Niet-admin → rood foutscherm, geen data geladen
- Admin logt uit → automatisch doorsturen naar home of loginscherm

**Betrokken pagina's:** `admin/accountbeheer.html`, `admin/analytics.html`, `admin/analyse.html`, `admin/supabase-analyse.html`

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

Kolom toegevoegd aan `profiles` zodat join op `auth.users` niet meer nodig is.

#### Fix 3 — `admin_users` view hersteld zonder `auth.users` join

```sql
CREATE VIEW public.admin_users WITH (security_invoker = true) AS
SELECT id, username, email, tier, is_admin, is_premium, created_at, tier_until, email_confirmed_at
FROM public.profiles;
```

---

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `js/topbar.js` | v2.3.1 | v2.3.2 | `_showAdminDropdown()` herschreven — race condition fix |
| `develop/standaardpagina.html` | v1.3.0 | v1.4.0 | `loadScript()` helper toegevoegd |

---

### Bugfixes

| ID | Omschrijving | Status |
|----|-------------|--------|
| BF-57 | Admin/developer menu verborgen na security-fix — recursieve RLS op `profiles` | ✅ Opgelost |
| BF-58 | `accountbeheer.html` — `admin_users` view ontbrak na security-fix | ✅ Opgelost |
| BF-59 | `admin_users` view — `permission denied for table users` | ✅ Opgelost |

---

## Sessie 30 — i18n uitgerold op abonnementen-pagina's

**Datum:** 2026-05-25
**Doel:** Namespaces `overzicht` / `prijzen` / `vergelijk` / `voordelen` implementeren (nl/en/es). Race condition bugfix voor alle abonnementen-pagina's.

---

### Bugfix — Race condition (BF-56)

`i18nModule.init()` roept intern `updateContent()` aan vóór `loadNamespace()` klaar is. Opgelost via tweestaps-aanpak: inline script roept alleen `i18nModule.init()` aan, daarna wordt het pagina-specifieke `.js` bestand dynamisch geïnjecteerd.

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

---

## Sessie 29 — Supabase beveiligingsfixes (KRITIEK)

**Datum:** 2026-05-22
**Doel:** Drie kritieke beveiligingsmeldingen van Supabase verhelpen.

RLS ingeschakeld op 6 tabellen, `admin_users` view gedropt, anon-rechten ingetrokken.

---

## Sessie 28 — Bugfix: tabelheaders vertalen bij taalwissel (template.html)

**Datum:** 2026-05-20

`bronnen/template.html` v2.2.0 → v2.3.0: `bouwTabel()` functie + `languageChanged` listener.

---

## Sessie 27 — i18n uitrollen op bronnen, gemeenschap en develop pagina's

**Datum:** 2026-05-19

i18n namespace uitgerold op bronnen/, gemeenschap/, develop/. Handleiding meertalig via aparte HTML-bestanden. Navbar v1.2.0.

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

`js/i18n.js` v1.0.0 aangemaakt. `locales/{nl,en,es}/{common,home}.json` aangemaakt.

---

## Sessies 1–24 — Zie eerdere PROJECT_LOG.md entries
