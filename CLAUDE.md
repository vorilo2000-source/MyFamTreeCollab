# MyFamTreeCollab — Claude instructies

## Projectvisie
MyFamTreeCollab is een **commerciële heritage & genealogie webapplicatie** waarbij
de gebruiker altijd volledige controle houdt over zijn eigen data.

### Kernprincipes
- **Privacy first** — data blijft standaard lokaal in de browser
- **Geen betaalde account vereist** voor basisfunctionaliteit
- **Open standaarden** — export naar CSV, JSON én GEDCOM

### Uitbreidingen
- 👥 Samenwerken met anderen aan dezelfde stamboom
- 🔗 Delen van stambomen (met leesrechten)
- 📜 Versiebeheer per persoon

### Toekomstige uitbreidingen
- 🔍 Genealogisch onderzoek (bronnen, archieven, verwijzingen)

---

## Technische informatie
**Live:** https://vorilo2000-source.github.io/MyFamTreeCollab/index.html
**Broncode:** https://github.com/vorilo2000-source/MyFamTreeCollab
**Stack:** Vanilla HTML + CSS + JavaScript — geen frameworks
**Cloud:** Supabase — https://supabase.com/dashboard/org/kvaizqetplltywdpwefz

---

## Marketing & Communicatie
**Kernboodschap:** "Bouw en beheer je stamboom gratis, zonder account, zonder dat je data ergens naartoe gaat."
**Actieve kanalen:** Facebook · Reddit (r/genealogy, r/belgium) · Product Hunt
**Huidig plan:** zie `MARKETING.md` — fasering, contentkalender, KPI's en lanceringstemplates

Bij een sessie met marketing-impact checkt Claude ook de actieve fase in `MARKETING.md` en levert een bijgewerkte statuskolom.

---

## Werkwijze per sessie
1. Gebruiker geeft aan wat er gedaan moet worden (of vraagt wat de volgende prioriteit is)
2. Claude checkt backlog, huidige bestandsstatus én actieve marketingfase (indien relevant)
3. Claude vraagt toestemming **voor** hij begint
4. Claude doet **nooit meer dan gevraagd** — stop en vraag bij twijfel
5. Einde van sessie: Claude levert
   - Gewijzigde bestanden
   - Sessie-entry voor `PROJECT_LOG.md`
   - Bijgewerkte: `BACKLOG.md`, `handleiding-nl.html` en `PROJECT.md`
   - *(indien marketing-impact)* Bijgewerkte statuskolom in `MARKETING.md`

---

## Werkwijze Claude Code
Alle code-wijzigingen via Claude Code for VS Code.

**Op computer:**
1. Open project in VS Code
2. Geef opdracht in Claude Code chat
3. Claude Code leest/schrijft bestanden direct
4. Test in browser
5. `git add .` + `git commit -m "beschrijving"` + `git push`

**Op iPad:**
1. Bestand aanpassen via claude.ai
2. Bestand downloaden
3. Bestand vervangen in clone map op computer
4. `git add .` + `git commit -m "beschrijving"` + `git push`

---

## Werkwijze HTML bestanden via Copilot

### Probleem
Copilot verwijdert HTML-tags uit JavaScript template strings en inline HTML.
Voorbeeld: `html += '<div class="card">'` wordt `html += ''` na Copilot bewerking.

### Regel: grote HTML bestanden nooit via Copilot instructie
- Kleine fixes (< 10 regels): Copilot instructie is OK
- Volledige bestanden of JS met inline HTML: altijd als download via claude.ai, dan handmatig vervangen

### Werkwijze voor volledige bestandsvervanging
1. Claude levert het bestand als download via claude.ai
2. Bestand downloaden
3. Bestaand bestand in repo vervangen (niet kopiëren/plakken — altijd bestand vervangen)
4. `git add .` + `git commit -m "beschrijving"` + `git push`

### Copilot instructies: do's en don'ts
**Wel via Copilot:**
- Versienummer in header aanpassen
- Eén regel zoeken en vervangen (tekst zonder HTML-tags)
- CSS variabelen toevoegen
- Script-tags toevoegen aan laadvolgorde

**Nooit via Copilot:**
- JavaScript met innerHTML of template strings die HTML bevatten
- Volledige bestandsvervanging
- Functies die HTML genereren (_cardHTML, _listHTML, _renderBody, etc.)
- Emoji's in code (gebruik HTML entities: &#x1F4C2; i.p.v. 📂)

---

## Taal & stijl
- Communicatie: **Nederlands**
- Code & commentaar: **Engels**
- Stijl: direct en technisch, geen overbodige uitleg tenzij gevraagd
- Inline commentaar op **elke** coderegel
- Versienummering: verhoog bij elke wijziging (`v1.0.0` voor nieuwe bestanden)

---

## Definitie of Done
Een taak is klaar als:
- [ ] Code werkt zoals bedoeld (getest in browser, geen console-errors)
- [ ] Inline commentaar op elke coderegel
- [ ] Bestandsheader bijgewerkt met nieuw versienummer
- [ ] `PROJECT.md` bijgewerkt
- [ ] `PROJECT_LOG.md` bijgewerkt met sessie-entry
- [ ] `BACKLOG.md` bijgewerkt: taak op ✅ Gedaan
- [ ] `handleiding-nl.html` bijgewerkt indien van toepassing
- [ ] *(indien marketing-impact)* Statuskolom bijgewerkt in `MARKETING.md`

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
| `admin/backlog.html` | v5.3.1 | Backlog manager |
| `admin/marketing.html` | v3.0.0 | Marketing & communicatieplan |
| `admin/agenda.html` | v1.1.0 | Centrale agenda |
| `admin/projectlog.html` | v1.0.0 | Project log viewer |
| `js/agendaStore.js` | v1.0.0 | Centrale agenda brug |

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
| F10 | Admin toegangsbeveiliging |
| FA | Account & donaties |
| SEC | Beveiliging |
| TD | Technische schuld |
| IS | Instructies & beschrijvingen |
