# DOCUMENT_STRUCTUUR.md
*MyFamTreeCollab — Documentatie-organigram & bestandsrelaties*
*Versie: 1.0 — 2026-05-25*

---

## Organigram

```
┌─────────────────────────────────────────────────────────────┐
│                        PROJECT.md                           │
│               Projectvisie · Stack · DoD · Werkwijze        │
│                    [ CENTRALE ANKERPUNT ]                   │
└───────────┬─────────────┬──────────────┬────────────────────┘
            │             │              │
            ▼             ▼              ▼
   ┌──────────────┐  ┌──────────┐  ┌────────────────┐
   │  BACKLOG.md  │  │DECISION  │  │ MARKETING      │
   │              │  │LOG.md    │  │ PLAN.md        │
   │ Wat te doen  │  │          │  │                │
   │ Wat gedaan   │  │ Waarom   │  │ Doelgroep      │
   │ Prioriteiten │  │ zo & niet│  │ Positionering  │
   │              │  │ anders   │  │ Kanalen        │
   └──────┬───────┘  └────┬─────┘  └───────┬────────┘
          │               │                │
          └───────┬────────┘                │
                  ▼                         │
       ┌──────────────────┐                 │
       │  PROJECT_LOG.md  │◄────────────────┘
       │                  │
       │  Sessie-entries  │
       │  Wat gebeurde    │
       │  Wie deed wat    │
       │  Datum + output  │
       └──────────────────┘
                  │
                  ▼
       ┌──────────────────┐
       │  Handleiding.html│
       │                  │
       │  Eindgebruiker-  │
       │  documentatie    │
       │  (publiek)       │
       └──────────────────┘
```

---

## Bestandsrollen

### PROJECT.md — Het anker
**Wat:** De enige bron van waarheid over wat dit project is en hoe eraan gewerkt wordt.
**Bevat:** Projectvisie, kernprincipes, technische stack, Definition of Done, werkwijze, taalafspraken.
**Relatie tot andere bestanden:**
- Definieert de spelregels die *alle* andere bestanden volgen.
- Elk ander bestand refereert impliciet aan de normen die hier vastliggen (bijv. versienummering, taalgebruik, DoD-criteria).
- Wordt enkel aangepast bij fundamentele koerwijzigingen.

---

### BACKLOG.md — De takenlijst
**Wat:** Levend overzicht van alle taken: gepland, in uitvoering en afgerond.
**Bevat:** Taken met status (⬜ Todo / 🔄 Bezig / ✅ Gedaan), prioriteit en eventuele notities.
**Relatie tot andere bestanden:**
- Wordt aangestuurd door `PROJECT.md` (wat past binnen de visie?).
- Elke afgewerkte taak genereert een entry in `PROJECT_LOG.md`.
- Beslissingen die de richting van taken beïnvloeden staan in `DECISION_LOG.md`.
- Nieuwe inzichten uit het `MARKETING_PLAN.md` kunnen nieuwe taken aanmaken.

---

### DECISION_LOG.md — Het geheugen van keuzes
**Wat:** Gestructureerde log van alle architecturale, functionele en strategische beslissingen.
**Bevat:** Datum, beslissing, motivatie, alternatieven overwogen, gevolgen.
**Relatie tot andere bestanden:**
- Legt vast *waarom* taken in `BACKLOG.md` zo zijn geformuleerd.
- Verantwoordt technische keuzes die terugkomen in `PROJECT_LOG.md`-entries.
- Voorkomt dat eerdere overwegingen opnieuw gedaan worden in latere sessies.
- Kan aanleiding geven tot aanpassingen in `PROJECT.md` bij grote koerswijzigingen.

---

### MARKETING_PLAN.md — De buitenwereld
**Wat:** Strategie voor positionering, doelgroepen en communicatiekanalen.
**Bevat:** Doelgroepsegmenten, USP's, kanaalstrategie, tone of voice, mijlpalen voor lancering.
**Relatie tot andere bestanden:**
- Informeert `BACKLOG.md` over welke features publiekelijk prioriteit hebben.
- Staat los van de dagelijkse technische cyclus, maar wordt geraadpleegd bij releases.
- Wordt gereflecteerd in `PROJECT_LOG.md` bij marketing-gerelateerde sessies.
- Vertaalt de visie uit `PROJECT.md` naar externe communicatie.

---

### PROJECT_LOG.md — De tijdlijn
**Wat:** Chronologisch verslag van elke werksessie.
**Bevat:** Datum, deelnemer(s), wat gedaan, welke bestanden gewijzigd, versienummers, openstaande punten.
**Relatie tot andere bestanden:**
- Registreert de uitvoering van taken uit `BACKLOG.md`.
- Documenteert welke beslissingen (uit `DECISION_LOG.md`) effectief zijn geïmplementeerd.
- Vormt het historisch bewijs dat de DoD uit `PROJECT.md` gehaald is.
- Biedt context bij toekomstig onderhoud van `Handleiding.html`.

---

### Handleiding.html — De publieke stem
**Wat:** Eindgebruikersdocumentatie, toegankelijk via de browser.
**Bevat:** Stap-voor-stap uitleg van features, screenshots, FAQ.
**Relatie tot andere bestanden:**
- Wordt bijgewerkt na elke sessie die gebruikersgerichte features oplevert (zie `PROJECT_LOG.md`).
- Weerspiegelt de actuele staat van het product zoals beschreven in `BACKLOG.md` (✅ Gedaan).
- Volgt de toon en doelgroepafbakening uit `MARKETING_PLAN.md`.
- Is het enige bestand gericht op externe lezers; alle andere zijn intern.

---

## Cyclus per werksessie

```
SESSION START
      │
      ▼
 Lees PROJECT.md          ← spelregels ophalen
      │
      ▼
 Bekijk BACKLOG.md        ← volgende taak kiezen
      │
      ▼
 Raadpleeg DECISION_LOG   ← eerdere keuzes checken
      │
      ▼
 [ Werk uitvoeren ]
      │
      ├──► Code gewijzigd → versienummer omhoog
      ├──► Nieuwe keuze gemaakt → entry DECISION_LOG.md
      ├──► Feature klaar → BACKLOG taak op ✅
      └──► Gebruikersfunctie → Handleiding.html bijgewerkt
      │
      ▼
 Schrijf entry PROJECT_LOG.md
      │
      ▼
SESSION END
```

---

## Vuistregels

| Vraag | Kijk in |
|---|---|
| Wat is de volgende taak? | `BACKLOG.md` |
| Waarom is dit zo gebouwd? | `DECISION_LOG.md` |
| Wat is er vorige sessie gedaan? | `PROJECT_LOG.md` |
| Hoe gebruik ik de app? | `Handleiding.html` |
| Wie is de doelgroep? | `MARKETING_PLAN.md` |
| Wat zijn de spelregels van dit project? | `PROJECT.md` |

---

*Dit bestand wordt bijgewerkt bij structurele wijzigingen in de documentatieopzet.*
