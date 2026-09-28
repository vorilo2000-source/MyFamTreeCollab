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
**Kernboodschap:** komt uit `marketing.md` regel `> Kernboodschap: ...` (direct onder `> Versie:`) — niet hardcoded in HTML, bewerkbaar via projectinfo-paneel in marketing.html
**Actieve kanalen:** Facebook · Reddit (r/genealogy, r/belgium) · Product Hunt
**Huidig plan:** zie `MARKETING.md` — fasering, contentkalender en lanceringstemplates (kalender- en KPI-secties verwijderd in v4.0.0)

Bij een sessie met marketing-impact checkt Claude ook de actieve fase in `MARKETING.md` en levert een bijgewerkte statuskolom.

### marketing.md structuur
```
# MyFamTreeCollab — Marketing & Communicatieplan
## Bijgewerkt: DD-MM-YYYY

> Versie: vX.X.X · Project: MyFamTreeCollab · Horizon: 12 weken
> Kernboodschap: <tekst zonder aanhalingstekens>

---

## [TAKEN]
## Fase N — Naam
| ID | Titel | Type | Startdatum | Einddatum | Gepubliceerd | Prioriteit | Status | Toegewezen | Tags | Omschrijving | Resultaat |

## [KANALEN]
| Kanaal | Taal | Frequentie | Toon | Doel | Subreddits / Groepen | Notities |

## [TEMPLATES]
### Titel
tekst...
---
```
`[KALENDER]` en `[KPI]` secties worden bij import overgeslagen (niet meer gebruikt sinds v4.0.0).

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

## Werkwijze HTML bestanden

### Grote bestanden: altijd als download, nooit via Copilot instructie
Copilot verwijdert HTML-tags uit JavaScript template strings.

**Regel:** als een bestand meer dan ~10 regels JS met innerHTML of template strings bevat → Claude levert het als downloadbaar `.html` bestand. Jij vervangt het handmatig in de repo.

**Wel via Copilot (kleine fixes):**
- Versienummer in header aanpassen
- Één regel zoeken en vervangen (tekst zonder HTML-tags)
- CSS variabelen toevoegen
- Script-tags toevoegen aan laadvolgorde

**Nooit via Copilot:**
- JavaScript met innerHTML of template strings die HTML bevatten
- Functies die HTML genereren (`_cardHTML`, `_listHTML`, `_renderBody`, etc.)
- Volledige bestandsvervanging
- Emoji's in code (gebruik HTML entities: `&#x1F4C2;` i.p.v. `📂`)

### Emoji's in JS: altijd HTML entities
In JavaScript strings die in HTML terechtkomen, gebruik altijd HTML entities:
| Emoji | Entity |
|-------|--------|
| 📂 | `&#x1F4C2;` |
| 💾 | `&#x1F4BE;` |
| 📝 | `&#x1F4DD;` |
| 📅 | `&#x1F4C5;` |
| ✏️ | `&#x270F;&#xFE0F;` |
| 🗑 | `&#x1F5D1;` |
| ✕ | `&#x2715;` |
| ✅ | `&#x2705;` |
| ✓ | `&#x2713;` |
| — | `\u2014` of `&mdash;` |

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

## Standaard Modal — alle admin pagina's

Alle modals in backlog.html, marketing.html, projectlog.html, release-notes.html en roadmap.html volgen dit standaard patroon.

### Vaste velden (altijd aanwezig)
- **ID** — automatisch gegenereerd, aanpasbaar, met preview
- **Titel** — verplicht, kort tekstveld
- **Status** — select: Open / In Progress / Review / Done / Cancelled / Future — **bepaalt kleur van badge in kaart en lijst**
- **Prioriteit** — select: Critical / High / Medium / Low

### Agenda-koppeling (altijd zelfde label en uitleg)
```html
<!-- Agenda checkbox: alleen voor koppeling met agenda.html via AgendaStore -->
<label class="agenda-checkbox">
  <input type="checkbox" id="ft-pub"/>
  <span>📅 Publiceren in agenda</span>
  <span style="color:var(--text-muted);font-size:0.68rem;margin-left:4px">
    — zichtbaar in agenda.html via AgendaStore
  </span>
</label>
```
CSS klasse `.agenda-checkbox` (niet `.pub-checkbox`) — identiek in alle pagina's.

### Tekstvelden (textarea) — standaard grote weergave
Alle tekstvelden voor langere inhoud zijn groot en leesbaar:
- **min-height: 120px** (`.ta-sm`) voor korte velden (tags, versie, resultaat-kort)
- **min-height: 180px** (standaard) voor middellange velden
- **min-height: 240px** (`.ta-lg`) voor lange velden

**Concrete toewijzing per veldnaam** (geldt voor backlog, marketing, projectlog, release-notes, roadmap):
| Veldlabel | Klasse | min-height |
|-----------|--------|-----------|
| Omschrijving | `.ta-lg` | 240px |
| Beschrijving | `.ta-lg` | 240px |
| AI suggestie | standaard | 180px |
| Uitgevoerd | `.ta-lg` | 240px |
| Niet uitgevoerd | standaard | 180px |
| Notities / Versie-overzicht | `.ta-lg` | 240px |
| Resultaat (kort tekstveld) | `.ta-sm` of `<input>` | 120px |
| Tags / Week | `<input>` (geen textarea) | — |

```css
textarea.form-input {
  resize: vertical;
  min-height: 180px;       /* standaard */
  font-family: var(--font-sans);
  font-size: 0.9rem;
  line-height: 1.7;
}
textarea.form-input.ta-sm { min-height: 120px; }
textarea.form-input.ta-lg { min-height: 240px; }
```

### Markdown + HTML toolbar (standaard)
Elke textarea met langere inhoud krijgt een toolbar boven het veld.
Volgorde van knoppen: **B** · *I* · H1 · H2 · H3 · • Lijst · ⊞ Tabel · `</>` Code · 🔗 Link · `<br>` · `<hr>` · 👁 Preview

```html
<div class="md-toolbar">
  <button class="md-btn" data-md="bold"    title="Vet (Ctrl+B)">B</button>
  <button class="md-btn" data-md="italic"  title="Cursief">I</button>
  <button class="md-btn" data-md="h1"      title="Koptekst 1">H1</button>
  <button class="md-btn" data-md="h2"      title="Koptekst 2">H2</button>
  <button class="md-btn" data-md="h3"      title="Koptekst 3">H3</button>
  <button class="md-btn" data-md="list"    title="Lijst">&#x2022;</button>
  <button class="md-btn" data-md="table"   title="Tabel">&#x229E;</button>
  <button class="md-btn" data-md="code"    title="Code">&lt;/&gt;</button>
  <button class="md-btn" data-md="link"    title="Link">&#x1F517;</button>
  <button class="md-btn" data-md="br"      title="Regeleinde">&lt;br&gt;</button>
  <button class="md-btn" data-md="hr"      title="Horizontale lijn">&lt;hr&gt;</button>
  <button class="md-btn" data-md="preview" title="Preview">&#x1F441;</button>
</div>
```

JS handler voor alle toolbar knoppen (inclusief H1/H2/H3, link, br, hr, preview):
```javascript
// data-wrap="**|**"   -> omhult selectie (bold/italic/code)
// data-prefix="- "    -> prefix per geselecteerde regel (lijst, H1/H2/H3)
// data-table="1"      -> standaard tabel invoegen
// data-link="1"       -> selectie wordt [tekst](https://)
// data-insert="<br>\n"-> literal tekst invoegen op cursorpositie (<br>, <hr>)
// data-preview="1"    -> toggle MD-rendering in naastliggend .log-md element

document.querySelectorAll('.md-toolbar button').forEach(function(btn){
  btn.addEventListener('click', function(){
    var ta=document.getElementById(btn.dataset.target);
    var start=ta.selectionStart, end=ta.selectionEnd, val=ta.value;

    if(btn.dataset.preview){ /* toggle preview div, render via _mdToHtml */ return; }
    if(btn.dataset.link){ var sel=val.slice(start,end)||'tekst'; var ins='['+sel+'](https://)';
      ta.value=val.slice(0,start)+ins+val.slice(end); return; }
    if(btn.dataset.insert){ var lit=btn.dataset.insert.replace('\\n','\n');
      ta.value=val.slice(0,start)+lit+val.slice(end); return; }
    if(btn.dataset.wrap){ var p=btn.dataset.wrap.split('|');
      ta.value=val.slice(0,start)+p[0]+val.slice(start,end)+p[1]+val.slice(end); return; }
    if(btn.dataset.prefix){ var lines=val.slice(start,end).split('\n');
      ta.value=val.slice(0,start)+lines.map(function(l){return btn.dataset.prefix+l;}).join('\n')+val.slice(end); return; }
    if(btn.dataset.table){ var tbl='\n| Kolom 1 | Kolom 2 |\n|---------|----------|\n| Cel 1   | Cel 2   |\n';
      ta.value=val.slice(0,start)+tbl+val.slice(end); }
  });
});
```

`_mdToHtml`/`_inline` (preview-renderer) ondersteunt: `#`/`##`/`###` koppen, `-` lijsten, tabellen, `**bold**`, `*cursief*`, `` `code` ``, `<br>`, `<hr>`, `[tekst](url)`.

### Status badge kleuren (identiek in alle pagina's)
Status komt uit het `status` veld van het item. De badge-kleur volgt automatisch:

```css
/* Board/kaart badges */
.s-open       { background:rgba(96,165,250,0.2);  color:#60a5fa; border:1px solid #60a5fa; }
.s-inprogress { background:rgba(167,139,250,0.2); color:#a78bfa; border:1px solid #a78bfa; }
.s-review     { background:rgba(251,191,36,0.2);  color:#fbbf24; border:1px solid #fbbf24; }
.s-done       { background:rgba(0,212,170,0.2);   color:var(--accent); border:1px solid var(--accent); }
.s-cancelled  { background:rgba(255,255,255,0.06);color:var(--text-muted); border:1px solid rgba(255,255,255,0.15); }
.s-future     { background:rgba(244,114,182,0.2); color:#f472b6; border:1px solid #f472b6; }

/* Lijst/tabel badges */
.s-open-tbl       { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }
.s-inprogress-tbl { background:#faf5ff; color:#6d28d9; border:1px solid #c4b5fd; }
.s-review-tbl     { background:#fefce8; color:#854d0e; border:1px solid #fde047; }
.s-done-tbl       { background:#f0fdf4; color:#15803d; border:1px solid #86efac; }
.s-cancelled-tbl  { background:#f3f4f6; color:#6b7280; border:1px solid #d1d5db; }
.s-future-tbl     { background:#fdf4ff; color:#7e22ce; border:1px solid #e9d5ff; }
```

JS mapping (identiek in alle pagina's):
```javascript
var S_CSS = {'Open':'s-open','In Progress':'s-inprogress','Review':'s-review','Done':'s-done','Cancelled':'s-cancelled','Future':'s-future'};
var S_TBL = {'Open':'s-open-tbl','In Progress':'s-inprogress-tbl','Review':'s-review-tbl','Done':'s-done-tbl','Cancelled':'s-cancelled-tbl','Future':'s-future-tbl'};
```

---

## Admin toolset (huidige versies)
| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `admin/backlog.html` | v5.3.2 | Backlog manager |
| `admin/marketing.html` | v4.1.0 | Marketing & communicatieplan |
| `admin/agenda.html` | v1.1.0 | Centrale agenda |
| `admin/projectlog.html` | v2.1.0 | Project log editor |
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
