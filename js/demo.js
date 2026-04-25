// =============================================================================
// demo.js — Demo stamboom module
// MyFamTreeCollab v1.2.0
// -----------------------------------------------------------------------------
// Nieuw in v1.2.0:
// - Demo data als hardcoded CSV string — zelfde formaat als normale CSV import
// - Parsing via window.StamboomSchema.fromCSV() — identiek aan import.js
// - Veldnamen komen nu gegarandeerd overeen met schema.js
//
// Exported as: window.DemoModule
// Dependencies: window.StamboomStorage (storage.js), window.StamboomSchema (schema.js)
//
// Load order:
//   utils.js → schema.js → idGenerator.js → storage.js → auth.js → demo.js
// =============================================================================

(function () {
    'use strict'; // Strikte modus — voorkomt stille fouten

    // -------------------------------------------------------------------------
    // DEMO DATA als CSV string
    // Exact hetzelfde formaat als een normale CSV import
    // 19 kolommen conform het legacy schema in schema.js
    // -------------------------------------------------------------------------
    var DEMO_CSV = [
        'ID,Doopnaam,Roepnaam,Prefix,Achternaam,Geslacht,Geboortedatum,Geboorteplaats,Overlijdensdatum,Overlijdensplaats,VaderID,MoederID,PartnerID,Huwelijksdatum,Huwelijksplaats,Opmerkingen,Huisadressen,ContactInfo,URL',
        'DV001,Hendrik,Henk,de,Vries,M,1895-04-22,Groningen,1968-09-14,Groningen,,,DV002,1920-06-05,Groningen,Overgrootvader hoofdlijn,,',
        'DV002,Cornelia,Corrie,van den,Berg,V,1898-11-03,Assen,1971-02-28,Groningen,,,DV001,1920-06-05,Groningen,Overgrootmoeder hoofdlijn,,',
        'DV003,Willem,Wim,de,Vries,M,1922-07-15,Groningen,1995-03-10,Amsterdam,DV001,DV002,DV004,1948-08-20,Amsterdam,,,',
        'DV004,Sofie,Sofie,,Jacobs,V,1925-02-09,Utrecht,1998-12-01,Amsterdam,,,DV003,1948-08-20,Amsterdam,,,',
        'DV005,Elisabeth,Lies,de,Vries,V,1926-05-30,Groningen,2004-07-19,Groningen,DV001,DV002,DV006,1952-04-12,Groningen,Zus van Willem,,',
        'DV006,Pieter,Piet,,Hoekstra,M,1923-10-17,Leeuwarden,2001-01-05,Groningen,,,DV005,1952-04-12,Groningen,,,',
        'DV007,Thomas,Tom,de,Vries,M,1950-06-03,Amsterdam,,,,DV003,DV004,MT003,1975-09-13,Amsterdam,Eerste huwelijk gescheiden 1985,,',
        'DV008,Anne,Anne,de,Vries,V,1953-11-22,Amsterdam,,,DV003,DV004,DV009,1979-05-04,Amsterdam,,,',
        'DV009,Marcus,Marc,,Vermeer,M,1951-03-14,Haarlem,,,,,DV008,1979-05-04,Amsterdam,,,',
        'DV010,Nora,Nora,,Bakker,V,1958-08-27,Rotterdam,,,,,DV007,1988-03-21,Amsterdam,Tweede partner Thomas,,',
        'DV011,Frank,Frank,,Hoekstra,M,1955-09-08,Groningen,,,DV006,DV005,DV012,1982-10-30,Groningen,Kind van Lies en Pieter,,',
        'DV012,Ingrid,Ingrid,,Koster,V,1957-12-14,Zwolle,,,,,DV011,1982-10-30,Groningen,,,',
        'DV013,Julia,Julia,de,Vries,V,1977-04-19,Amsterdam,,,DV007,MT003,DV014,2003-07-12,Amsterdam,Kind Thomas en Eva,,',
        'DV014,Lars,Lars,,Hendriksen,M,1975-01-30,Den Haag,,,,,DV013,2003-07-12,Amsterdam,,,',
        'DV015,Daan,Daan,de,Vries,M,1980-10-05,Amsterdam,,,DV007,MT003,,,,,',
        'DV016,Sara,Sara,de,Vries,V,1990-03-17,Amsterdam,,,DV007,DV010,DV017,2015-06-20,Amsterdam,Kind Thomas en Nora,,',
        'DV017,Kevin,Kevin,,Wolters,M,1988-07-24,Eindhoven,,,,,DV016,2015-06-20,Amsterdam,,,',
        'DV018,Noah,Noah,de,Vries,M,1993-12-02,Amsterdam,,,DV007,DV010,,,,,',
        'DV019,Lisa,Lisa,,Vermeer,V,1982-06-11,Haarlem,,,DV009,DV008,DV020,2008-09-06,Haarlem,,,',
        'DV020,Sander,Sander,,Prins,M,1980-04-03,Leiden,,,,,DV019,2008-09-06,Haarlem,,,',
        'DV021,Bas,Bas,,Hoekstra,M,1985-02-28,Groningen,,,DV011,DV012,,,,,',
        'DV022,Emma,Emma,,Hendriksen,V,2005-08-14,Amsterdam,,,DV014,DV013,,,,,',
        'DV023,Maximilian,Max,,Hendriksen,M,2008-03-22,Amsterdam,,,DV014,DV013,,,,,',
        'DV024,Lena,Lena,,Wolters,V,2017-11-09,Eindhoven,,,DV017,DV016,,,,,',
        'DV025,Finn,Finn,,Prins,M,2010-05-31,Leiden,,,DV020,DV019,,,,,',
        'DV026,Mia,Mia,,Prins,V,2013-09-17,Leiden,,,DV020,DV019,,,,,',
        'DV027,Olivia,Olivia,,Hendriksen,V,2026-01-15,Amsterdam,,,,,DV022,,,Pasgeboren,,',
        'MT001,Gerard,Geer,,Martens,M,1920-08-11,Tilburg,1988-04-03,Tilburg,,,MT002,1945-10-18,Tilburg,,,',
        'MT002,Maria,Riet,van,Osch,V,1923-03-29,Breda,1999-07-22,Tilburg,,,MT001,1945-10-18,Tilburg,,,',
        'MT003,Eva,Eva,,Smits,V,1952-12-07,Tilburg,,,MT001,MT002,DV007,1975-09-13,Amsterdam,Ex-partner Thomas gescheiden 1985,,',
        'MT004,Cornelis,Kees,,Martens,M,1949-05-14,Tilburg,,,MT001,MT002,MT005,1973-06-01,Tilburg,,,',
        'MT005,Gertruda,Truus,van den,Berg,V,1951-09-02,Eindhoven,,,,,MT004,1973-06-01,Tilburg,,,',
        'MT006,Anja,Anja,,Martens,V,1955-02-19,Tilburg,,,MT001,MT002,,,,,',
        'MT007,Robin,Robin,,Martens,M,1975-11-26,Tilburg,,,MT004,MT005,MT008,2001-04-14,Tilburg,,,',
        'MT008,Sofie,Sofie,,Claes,V,1977-07-08,Antwerpen,,,,,MT007,2001-04-14,Tilburg,,,',
        'MT009,Jade,Jade,,Martens,V,2003-06-30,Tilburg,,,MT007,MT008,,,,,',
        'MT010,Luca,Luca,,Martens,M,2006-02-11,Tilburg,,,MT007,MT008,,,,,'
    ].join('\n'); // Regels samenvoegen tot één CSV string

    // -------------------------------------------------------------------------
    // _parseCSV()
    // Converteert de hardcoded CSV string naar een array van persoon-objecten
    // via window.StamboomSchema.fromCSV() — exact hetzelfde als import.js
    // -------------------------------------------------------------------------
    function _parseCSV() {
        if (!window.StamboomSchema) {                                      // Schema niet geladen
            console.error('[DemoModule] StamboomSchema niet beschikbaar');
            return [];
        }

        var lines = DEMO_CSV.split('\n').filter(function(l) {             // Splits op regels, filter lege
            return l.trim().length > 0;
        });

        if (lines.length < 2) return [];                                   // Geen data — stoppen

        var headerLine   = lines[0];                                       // Eerste regel = header
        var headerInfo   = window.StamboomSchema.normalizeHeader(headerLine); // Header type detecteren
        var persons      = [];                                             // Resultaat array

        for (var i = 1; i < lines.length; i++) {                          // Loop door datarijen
            var obj = window.StamboomSchema.fromCSV(lines[i], headerInfo); // CSV rij → object
            if (obj && obj.ID) {                                           // Alleen geldige records
                persons.push(obj);                                         // Toevoegen aan resultaat
            }
        }

        return persons; // Geef geparseerde personen terug
    }

    // -------------------------------------------------------------------------
    // loadDemo(force)
    // Laadt de demo stamboom in localStorage via StamboomStorage.replaceAll()
    // @param {boolean} force — true: altijd laden, ook als er al data is
    // @returns {boolean} true als demo geladen is, false als overgeslagen
    // -------------------------------------------------------------------------
    function loadDemo(force) {
        if (!window.StamboomStorage) {                                     // Storage niet beschikbaar
            console.warn('[DemoModule] StamboomStorage niet beschikbaar');
            return false;
        }

        var bestaand = window.StamboomStorage.get();                       // Haal huidige data op

        if (!force && bestaand && bestaand.length > 0) {                  // Bestaande data en geen force
            console.log('[DemoModule] Bestaande data aanwezig — demo niet geladen');
            return false;
        }

        var persons = _parseCSV();                                         // CSV string parsen naar objecten

        if (persons.length === 0) {                                        // Parsen mislukt
            console.error('[DemoModule] CSV parsen mislukt — geen personen geladen');
            return false;
        }

        window.StamboomStorage.replaceAll(persons);                        // Laad personen in localStorage
        window.StamboomStorage.setActiveTreeId(null);                      // Geen cloud-ID — lokale demo
        window.StamboomStorage.setActiveTreeName('Demo — Familie De Vries'); // Naam zichtbaar in topbar

        console.log('[DemoModule] Demo geladen (' + persons.length + ' personen)');
        return true;
    }

    // -------------------------------------------------------------------------
    // isDemo()
    // Geeft true terug als de actieve stamboom de demo is.
    // -------------------------------------------------------------------------
    function isDemo() {
        if (!window.StamboomStorage) return false;                         // Storage niet beschikbaar
        var naam = window.StamboomStorage.getActiveTreeName();             // Haal actieve naam op
        return naam === 'Demo — Familie De Vries';                         // Vergelijk met demo-naam
    }

    // -------------------------------------------------------------------------
    // getPersons()
    // Geeft de geparseerde demo-data terug (voor tests).
    // -------------------------------------------------------------------------
    function getPersons() {
        return _parseCSV();                                                // Parse en geef terug
    }

    // -------------------------------------------------------------------------
    // Publieke API
    // -------------------------------------------------------------------------
    window.DemoModule = {
        loadDemo:   loadDemo,   // (force?) → boolean — laadt demo in localStorage
        isDemo:     isDemo,     // ()       → boolean — controleert of demo actief is
        getPersons: getPersons  // ()       → array   — geeft geparseerde demo data terug
    };

    console.log('[DemoModule] Module geladen — klaar om demo te laden');

})();
