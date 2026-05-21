# MyFamTreeCollab 

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
**Cloud:** https://supabase.com/dashboard/org/kvaizqetplltywdpwefz

---

## Marketing & Communicatie

**Kernboodschap:** "Bouw en beheer je stamboom gratis, zonder account, zonder dat je data ergens naartoe gaat."

**Actieve kanalen:** Facebook · Reddit (r/genealogy, r/belgium) · Product Hunt
**Huidig plan:** zie `MARKETING.md` — fasering, contentkalender, KPI's en lanceringstemplates

Bij een sessie met marketing-impact checkt Claude ook de actieve fase in `MARKETING.md` en levert een bijgewerkte statuskolom.

---

## Definitie of Done

Een taak is klaar als:
- [ ] Code werkt zoals bedoeld (getest in browser, geen console-errors)
- [ ] Inline commentaar op elke coderegel
- [ ] Bestandsheader bijgewerkt met nieuw versienummer
- [ ] PROJECT.md bijgewerkt
- [ ] PROJECT_LOG.md bijgewerkt met sessie-entry
- [ ] BACKLOG.md bijgewerkt: taak op ✅ Gedaan
- [ ] Handleiding-nl.html bijgewerkt
- [ ] *(indien marketing-impact)* Statuskolom bijgewerkt in MARKETING.md

---

## Werkwijze per sessie

1. Gebruiker geeft aan wat er gedaan moet worden (of vraagt wat de volgende prioriteit is)
2. Claude checkt backlog, huidige bestandsstatus én actieve marketingfase (indien relevant)
3. Code wordt geschreven/aangepast met volledig inline commentaar
4. Einde van sessie: Claude levert
   - Gewijzigde bestanden
   - Sessie-entry voor PROJECT_LOG.md
   - Bijgewerkte: BACKLOG.md, handleiding-nl.html en PROJECT.md
   - *(indien marketing-impact)* Bijgewerkte statuskolom in MARKETING.md

---

## Taal & stijl

- Communicatie: **Nederlands**
- Code & commentaar: **Engels**
- Stijl: direct en technisch, geen overbodige uitleg tenzij gevraagd
- Versienummering: gewijzigde bestanden krijgen verhoogd versienummer
