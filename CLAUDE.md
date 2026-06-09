# MyFamTreeCollab — Claude instructies

## Project
Commerciële heritage & genealogie webapplicatie.
**Live:** https://vorilo2000-source.github.io/MyFamTreeCollab/index.html
**Broncode:** https://github.com/vorilo2000-source/MyFamTreeCollab
**Stack:** Vanilla HTML + CSS + JavaScript — geen frameworks
**Cloud:** Supabase

### Kernprincipes
- Privacy first — data blijft standaard lokaal in de browser
- Geen betaalde account vereist voor basisfunctionaliteit
- Open standaarden — export naar CSV, JSON én GEDCOM

---

## Werkwijze per sessie
1. Gebruiker geeft aan wat er gedaan moet worden
2. Claude checkt backlog en huidige bestandsstatus **voor** hij bouwt
3. Claude vraagt toestemming **voor** hij begint
4. Claude vraagt bij twijfel — doet nooit meer dan gevraagd
5. Einde sessie: Claude levert gewijzigde bestanden + PROJECT_LOG.md entry + BACKLOG.md update

---

## Taal & stijl
- Communicatie: **Nederlands**
- Code & commentaar: **Engels**
- Stijl: direct en technisch, geen overbodige uitleg tenzij gevraagd
- Inline commentaar op **elke** coderegel
- Versienummering: verhoog bij elke wijziging (v1.0.0 voor nieuwe bestanden)

---

## Definitie of Done
Een taak is klaar als:
- [ ] Code werkt zoals bedoeld (getest in browser, geen console-errors)
- [ ] Inline commentaar op elke coderegel
- [ ] Bestandsheader bijgewerkt met nieuw versienummer
- [ ] PROJECT_LOG.md bijgewerkt met sessie-entry
- [ ] BACKLOG.md bijgewerkt: taak op ✅ Gedaan
- [ ] Handleiding.html bijgewerkt indien van toepassing

---

## Technische standaarden

### Laadvolgorde (admin pagina's)
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../js/utils.js"></script>
<script src="../js/auth.js"></script>
<script src="/MyFamTreeCollab/js/adminGuard.js"></script>
<script src="/MyFamTreeCollab/js/siteAnalytics.js"></script>
<script src="../js/agendaStore.js"></script>
<!-- TopBar fetch → topbar.js → AdminGuard.protect('admin') → Module.init() -->
```

### localStorage prefixes
| Prefix | Pagina |
|--------|--------|
| `bl_*` | backlog.html |
| `mk_*` | marketing.html |
| `pl_*` | projectlog.html |
| `rn_*` | release-notes.html |
| `rm_*` | roadmap.html |
| `ag_*` | agenda.html |

### AdminGuard patroon
```javascript
// Tier !== 'admin' → #accessDenied zichtbaar, #page-content verborgen
// Tier === 'admin' → #page-content zichtbaar, onAuthChange listener actief
// Bij SIGNED_OUT → redirect naar index.html
AdminGuard.protect('admin');
```

### AgendaStore patroon
```javascript
// Na elke _save() aanroepen zodat agenda.html actueel blijft
AgendaStore.sync();
```

---

## Admin toolset (huidige versies)
| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `admin/backlog.html` | v5.3.0 | Backlog manager |
| `admin/marketing.html` | v3.0.0 | Marketing & communicatieplan |
| `admin/agenda.html` | v1.1.0 | Centrale agenda |
| `admin/projectlog.html` | v1.0.0 | Project log viewer |
| `js/agendaStore.js` | v1.0.0 | Centrale agenda brug |

---

## Backlog & logging
- **BACKLOG.md** — alle openstaande en afgeronde taken per fase
- **PROJECT_LOG.md** — chronologisch overzicht van alle sessies
- Nieuwe backlog items krijgen ID volgens patroon: `[fase][type]-[volgnummer]`
- Auto ID format: `[1e letter fase][1e letter type]-[3-cijferig volgnummer]`

---

## Fase-overzicht
| Fase | Omschrijving |
|------|-------------|
| F0 | Audit & opschoning |
| F1 | Structuur & centrale modules |
| F2 | Kapotte bestanden repareren |
| F3 | UX — forms, filtering, sorting |
| F5 | Cloud & accounts (Supabase) |
| F6 | Rolmodel implementatie |
| F7 | Businessmodel & betaling |
| F8 | Internationalisatie (i18n) |
| F9 | Bronnen (genealogisch onderzoek) |
| F10 | Admin toegangsbeveiliging & tools  |
| FA | Account & donaties |
| SEC | Beveiliging |
| TD | Technische schuld |
| SB | Supabase, action, task & backlog |
| IS | Instructies, beschrijving van instructies voor uitvoering van taken |
