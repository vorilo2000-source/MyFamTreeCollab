# MyFamTreeCollab — DECISIONS.md
## Bijgewerkt: 2026-05-25

> Architecture Decision Records (ADR) — permanente ontwerpbeslissingen voor het project.
> Doel: toekomstige sessies, bijdragers en Claude weten WHY iets zo is, niet alleen WAT.
>
> Status: ✅ Actief · ⚠️ Herzien · ❌ Vervallen

---

## ADR-001 — Admin is geen publiek account type

**Status:** ✅ Actief
**Datum:** 2026-05-25

### Context
De vergelijkingstabellen op `abonnementen/overzicht.html`, `prijzen.html` en `vergelijk.html`
toonden oorspronkelijk vier kolomhoofden: Niet ingelogd / Basis / Owner / Admin.
Admin is echter een intern platform-rol voor beheerders, niet een tier die een bezoeker
kan kiezen, aanvragen of kopen.

### Beslissing
Admin verschijnt **niet** in publiek-gerichte pagina's: overzicht, prijzen, vergelijken,
voordelen, handleiding of enige andere klantgerichte pagina.

Admin-documentatie hoort in `admin/` of `develop/` — niet in `abonnementen/`.

### Consequenties
- Vergelijkingstabellen tonen maximaal drie kolomhoofden: Niet ingelogd / Basis / Owner
- Nieuwe publieke pagina's in `abonnementen/` houden zich aan deze regel
- Admin-functionaliteit wordt gedocumenteerd in `admin/accountbeheer.html` of een nieuw `admin/handleiding.html`
- `profiles.tier = 'admin'` bestaat wél in de database — dit ADR gaat alleen over publieke communicatie

---

## ADR-002 — Vanilla JS, geen frameworks

**Status:** ✅ Actief
**Datum:** 2026-05-10 (oorsprong project)

### Context
Bij de projectstart is gekozen voor een stack zonder build-tools of frameworks.
Het project draait op GitHub Pages (statisch) en moet zonder lokale ontwikkelomgeving
bewerkbaar blijven.

### Beslissing
De stack is en blijft: **Vanilla HTML + CSS + JavaScript**.
Geen React, Vue, Angular, Svelte, TypeScript, Webpack, Vite of andere build-tools.
Externe libraries zijn toegestaan via CDN (i18next, Supabase SDK) — mits ze via
een `<script src>` tag te laden zijn zonder compilatiestap.

### Consequenties
- Alle code is direct leesbaar en uitvoerbaar zonder tooling
- Geen `package.json`, geen `node_modules`, geen build-stap voor de frontend
- Modules communiceren via `window.*` exports (zie Project.md — Globale exports)
- Herdefiniëren van een globale `window.*` export in een ander bestand is verboden

---

## ADR-003 — Privacy first: data lokaal tenzij gebruiker kiest voor cloud

**Status:** ✅ Actief
**Datum:** 2026-05-10 (oorsprong project)

### Context
Kernbelofte van het product aan gebruikers: jouw data gaat nergens naartoe tenzij jij
dat expliciet kiest. Dit onderscheidt MyFamTreeCollab van Ancestry, MyHeritage en
andere tools waarbij data standaard in de cloud zit.

### Beslissing
- Stamboomdata wordt standaard opgeslagen in `localStorage` (lokaal in de browser)
- Cloud sync is **opt-in** — alleen voor Owner accounts, nooit automatisch voor guest
- De app werkt volledig zonder internetverbinding voor de basisfunctionaliteit
- Marketingcommunicatie benoemt dit altijd als eerste USP

### Consequenties
- `StamboomStorage` (storage.js) schrijft standaard naar localStorage
- `CloudSync` (cloudSync.js) wordt alleen geactiveerd bij ingelogde Owner accounts
- Guest accounts krijgen nooit automatisch cloud sync, ook niet als ze inloggen
- Privacypagina (`Docs/privacy.html`) moet altijd actueel zijn en dit bevestigen

---

## ADR-004 — Geen betaalde account vereist voor basisfunctionaliteit

**Status:** ✅ Actief
**Datum:** 2026-05-10 (oorsprong project)

### Context
Betaalmuren bij de eerste gebruik zijn de grootste drempel voor adoptie in de
genealogie-hobbyistmarkt. Concurrenten (Ancestry, MyHeritage) vereisen betaling
voor vrijwel alle functies.

### Beslissing
De volgende functies zijn en blijven gratis voor guest accounts:
- Stamboom aanmaken en beheren (tot max. 60 personen lokaal en 600 personen in de cloud)
- Tijdlijn en statistieken bekijken
- Export naar CSV en JSON
- Meertalige interface (NL/EN/ES)

Cloud backup, onbeperkt personen, delen en samenwerken vereisen een Owner account
(donatie ~€6 per 6 maanden, 1 stamboom en €10 per jaar, 3 stambomen) bij toevoegen van amdere functionaliteiten als events en files wordt de donatie herzien in een cafetariea model.

### Consequenties
- Feature-gating mag nooit basisfunctionaliteit blokkeren voor guest accounts
- De 60-personenlimiet voor guest is een zachte limiet — implementatie wordt in een
  latere fase geautomatiseerd
- Betaling-integratie (Stripe/Ko-fi) raakt nooit de guest-functionaliteit

---

## ADR-005 — Viewer en Editor zijn stamboom-rechten, geen account types

**Status:** ✅ Actief
**Datum:** 2026-05-15 (sessie 26, herhaaldelijk verwarring)

### Context
In vroege versies werden Viewer en Editor behandeld als account types naast guest/owner/admin.
Dit leidde tot verwarring in de UI, de vergelijkingstabellen en de database.
Viewer en Editor zijn rechten die een Owner toekent aan een specifieke stamboom —
ze zijn niet gekoppeld aan een account tier.

### Beslissing
- `viewer` en `editor` staan in `stamboom_gedeeld.rol` — **niet** in `profiles.tier`
- Vergelijkingstabellen en account-overzichten tonen **nooit** Viewer of Editor als kolom
- In de UI worden ze altijd benoemd als "stamboom-rechten", niet als "rollen" of "account types"
- Een guest-gebruiker kán Viewer of Editor zijn op een specifieke stamboom

### Consequenties
- `profiles.tier` bevat alleen: `null` / `guest` / `owner` / `admin`
- `stamboom_gedeeld.rol` bevat: `viewer` / `editor`
- Documentatie en handleidingen maken dit onderscheid expliciet
- Nieuwe features die rechten toekennen schrijven altijd naar `stamboom_gedeeld`, nooit naar `profiles.tier`

---

## ADR-006 — i18n namespace separator is dubbele punt (`:`), niet punt

**Status:** ✅ Actief
**Datum:** 2026-05-10 (BF-36 — kostbare bug bij eerste implementatie)

### Context
Bij de eerste i18n implementatie werd punt (`.`) gebruikt als namespace separator:
`data-i18n="home.hero.title"`. i18next interpreteert dit als een sleutel in de
`defaultNS` (`common`) met pad `home.hero.title` — niet als namespace `home`.
Dit veroorzaakte dat alle pagina-specifieke keys onvertaald bleven.

### Beslissing
Namespace separator is altijd **dubbele punt** (`:`):
```
✅ data-i18n="home:hero.title"
❌ data-i18n="home.hero.title"
```

Punten worden alleen gebruikt als key-pad separator binnen een namespace.

### Consequenties
- Alle `data-i18n` attributen in het project gebruiken `namespace:pad.naar.key`
- `i18n.js` is geconfigureerd zonder expliciete `nsSeparator` override — de i18next default (`:`) is correct
- Code reviews controleren altijd op punt-als-separator als nieuwe `data-i18n` attributen worden toegevoegd

---

## ADR-007 — Pagina-specifieke JS als apart bestand, niet inline

**Status:** ✅ Actief
**Datum:** 2026-05-25 (BF-56 — race condition abonnementen-pagina's)

### Context
Bij de eerste implementatie van i18n op pagina's zonder eigen `.js` bestand werd
`loadNamespace()` inline aangeroepen in een `<script>` blok. `i18nModule.init()`
roept intern `updateContent()` aan vóór `loadNamespace()` klaar is — op dat moment
zijn pagina-specifieke keys nog niet geladen, waardoor i18next de key-naam zelf
teruggeeft als fallback (bijv. `tabel.title`).

### Beslissing
Elke pagina met een eigen namespace krijgt een apart `[pagina].js` bestand in `js/`.
Het inline script-blok roept **alleen** `i18nModule.init()` aan en injecteert daarna
dynamisch het pagina-JS bestand:

```javascript
i18nModule.init().then(function() {
    var s = document.createElement('script');
    s.src = '../js/[pagina].js';
    document.body.appendChild(s);
});
```

Het pagina-JS bestand roept `loadNamespace()` aan — nu is i18next volledig klaar.

### Consequenties
- Elke pagina met `data-i18n="namespace:..."` attributen heeft een bijbehorend `js/[pagina].js`
- Laadvolgorde in `Project.md` toont `[pagina].js` altijd als laatste
- `loadNamespace()` wordt **nooit** inline in een `<script>` blok aangeroepen
- Elementen met HTML-opmaak in vertalingen (`<strong>`, `<a>`, `<code>`) krijgen een `id`
  en worden vertaald via `_translateHTML(id, key)` in het pagina-JS bestand

---

## ADR-008 — DB-waarden worden nooit vertaald in de UI

**Status:** ✅ Actief
**Datum:** 2026-05-25

### Context
Waarden die letterlijk in de database staan (`tier: null`, `guest`, `owner`, `admin`,
`viewer`, `editor`) worden op sommige pagina's getoond als technische referentie
(bijv. de `tier-badge` in vergelijkingstabellen). Deze waarden mogen nooit vertaald
worden — ze zijn technische identifiers, geen gebruikerstekst.

### Beslissing
- `tier-badge` elementen tonen altijd de letterlijke DB-waarde: `null`, `guest`, `owner`, `admin`
- Deze elementen krijgen **geen** `data-i18n` attribuut
- Gebruiksvriendelijke namen ("Basis account", "Owner account") worden wél vertaald
  en staan in aparte elementen naast de badge

### Consequenties
- `<span class="th-tier tier-guest">guest</span>` is correct — hardcoded, nooit vertaald
- De leesbare naam ernaast (`<span data-i18n="overzicht:accountTypes.guest.naam">`) wél
- Backend-code die op `profiles.tier` vergelijkt gebruikt altijd de Engelse literals

---

## ADR-009 — Merknaam altijd hardcoded, nooit via i18n

**Status:** ✅ Actief
**Datum:** 2026-05-10

### Context
Bij de eerste i18n opzet was `MyFamTreeCollab` opgenomen in `common.json` als
`meta.appName`. Dit werd verwijderd (F8-16) omdat merknamen niet vertaald worden
en via i18n laden onnodige complexiteit toevoegt.

### Beslissing
`MyFamTreeCollab` staat altijd hardcoded in HTML. Nooit via `data-i18n` of `i18next.t()`.

```html
✅ <span>MyFamTreeCollab</span>
❌ <span data-i18n="common:meta.appName"></span>
```

### Consequenties
- `common.json` bevat geen `meta.appName` of vergelijkbare sleutel
- Zoek-en-vervang bij rebranding gaat direct in HTML — geen JSON-update nodig

---

## ADR-010 — Meertaligheid via i18n namespaces, niet via aparte HTML-bestanden per taal

**Status:** ✅ Actief
**Datum:** 2026-05-19 (sessie 27 — patroon vastgelegd na verwijderen `-en` bestanden)

### Context
Vóór i18n bestonden er aparte bestanden per taal: `import.html`, `import-en.html`,
`import-es.html`. Dit leidde tot dubbele onderhoudslast: elke wijziging moest in
drie bestanden doorgevoerd worden. TD-06 (`import-en.html` laadt verkeerde scripts)
is een direct gevolg.

**Uitzondering:** `bronnen/handleiding-nl.html`, `-en.html`, `-es.html` bestaan nog
als aparte bestanden omdat de handleiding te complex is voor inline i18n. Dit is een
bewuste uitzondering, geen patroon om te volgen.

### Beslissing
- Eén HTML-bestand per pagina, meertaligheid via `locales/{nl,en,es}/[namespace].json`
- Aparte `-en` / `-es` HTML-bestanden worden niet meer aangemaakt
- Bestaande `-en` bestanden zijn verwijderd (sessie 30)
- De handleiding-uitzondering blijft bestaan maar wordt niet uitgebreid

### Consequenties
- Nieuwe pagina's krijgen één HTML-bestand + drie JSON-bestanden (nl/en/es)
- Verwijzing naar `-en` of `-es` bestanden in links of scripts is een bug
- `Navbar.html` linkt naar `handleiding-nl.html` (redirect-bestand) — niet aanpassen
  tenzij de handleiding wordt omgezet naar het standaard i18n-patroon

---

## ADR-011 — Open standaarden voor data-export

**Status:** ✅ Actief
**Datum:** 2026-05-10 (oorsprong project)

### Context
Vendor lock-in is een kernbezwaar van gebruikers tegen bestaande genealogie-tools.
De belofte "jij bent eigenaar van je data" is leeg als data niet exporteerbaar is
in een formaat dat andere tools begrijpen.

### Beslissing
Export naar open standaarden is een kernfeature die altijd beschikbaar blijft
voor alle account types (inclusief guest):
- **CSV** — tabelformaat, universeel leesbaar
- **JSON** — volledig datamodel, inclusief relaties
- **GEDCOM** — standaard genealogieformaat (gepland — F3-64)

Exportfunctionaliteit wordt nooit achter een betaalmuur gezet.

### Consequenties
- `ExportModule.exportCSV()` en `ExportModule.exportJSON()` blijven beschikbaar voor guest
- GEDCOM-import/-export (F3-64, F9-09) volgt hetzelfde principe — gratis voor iedereen
- Nieuwe exportformaten worden standaard gratis aangeboden tenzij er een expliciete
  beslissing is om hiervan af te wijken (nieuw ADR vereist)

---

## ADR-012 — RLS verplicht op alle publieke Supabase tabellen

**Status:** ✅ Actief
**Datum:** 2026-05-22 (sessie 29 — SEC-01/02/03)

### Context
Drie kritieke beveiligingsmeldingen van Supabase toonden aan dat tabellen zonder
Row Level Security (RLS) volledig toegankelijk zijn via de publieke API met de
anonieme sleutel. Dit lekte gebruikersdata aan iedereen met de API-URL.

### Beslissing
- RLS is ingeschakeld op **alle** tabellen in het `public` schema
- Anonieme toegang (`anon` role) is volledig geblokkeerd via `REVOKE ALL FROM anon`
- Authenticated gebruikers krijgen alleen minimale grants per tabel
- Views kunnen geen RLS hebben — basistabel-RLS beveiligt de view indirect
- Nieuwe tabellen krijgen bij aanmaak direct RLS + owner-policy

### Consequenties
- Nieuwe Supabase tabel = altijd direct `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Minimaal één policy per tabel: `auth.uid() = user_id` voor eigenaarscheck
- Admin-toegang via `is_admin = true` in `profiles`, nooit via aparte Supabase rol
- `anon` API-calls vanuit de frontend zijn verboden — altijd ingelogd of geen data

---

## ADR-013 — Marketingstrategie is volledig organisch

**Status:** ✅ Actief
**Datum:** 2026-05-26 (marketing & communicatieplan v1.0)

### Context
Budget voor betaalde advertenties is nul. De doelgroep (genealogie-hobbyisten,
families) is actief in bestaande communities (Facebook-groepen, Reddit, forums).
Betaalde advertenties in deze niche hebben een lage ROI vergeleken met organische
aanwezigheid en word-of-mouth.

### Beslissing
- Geen betaalde advertenties (Google Ads, Facebook Ads, etc.)
- Strategie: eerst waarde leveren in communities, dan promoten
- Kanalen: Facebook genealogie-groepen (NL/BE), Reddit (r/genealogy, r/belgium), Product Hunt
- Lancering: week 5 van het marketingplan, op meerdere kanalen tegelijk
- KPI's worden bijgehouden via Supabase siteAnalytics + platform-eigen inzichten

### Consequenties
- Geen advertentiebudget nodig in financiële planning
- Groei is trager maar duurzamer — gebruikers komen via echte aanbevelingen
- Content moet eerst informatief zijn, promotie is secundair
- Marketingplan (`Marketing.md`) wordt bijgehouden naast `BACKLOG.md`
