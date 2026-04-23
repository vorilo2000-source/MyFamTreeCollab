// =============================================================================
// demo.js — Demo stamboom module
// MyFamTreeCollab v1.0.0
// -----------------------------------------------------------------------------
// Provides a hardcoded fictional demo family tree for guest users.
// Loaded automatically when no local data is present and the user is a guest.
//
// Structure:
//   Familie De Vries — 5 generaties (hoofdlijn)
//  Familie De Vries — 6 generaties:
//   Gen 1: Hendrik + Cornelia
//   Gen 2: Willem + Sofie (+ zus Lies + Pieter)
//   Gen 3: Thomas + ex Eva Smits → later hertrouwd met Nora Bakker · Anne + Marc
//   Gen 4: Julia en Daan (kind Thomas+Eva) · Sara en Noah (kind Thomas+Nora) · Lisa (kind Anne+Marc)
//   Gen 5: Emma en Max (kind Julia+Lars) · Lena (kind Sara+Kevin) · Finn en Mia (kind Lisa+Sander)
//   Gen 6: Olivia (kind Emma) — diepste lijn
//  
//  Familie Martens  — 2 generaties (ex-partner Eva Smits stamt hieruit)
//   Gerard + Riet → Eva (ex Thomas), Kees + Truus, Anja
//   Kees + Truus → Robin + Sofie → Jade en Luca
//  
//   Verbindingen:
//     - Thomas de Vries (gen 3) was getrouwd met Eva Smits (ex-partner)
//     - Thomas hertrouwde met Nora Bakker
//     - Kinderen van Thomas+Eva én Thomas+Nora aanwezig
//     - 1 kind van gen 4 heeft zelf ook een kind (gen 5 → gen 6 lijn)
//
// Max personen: 60 (huidig: 37)
//
// Exported as: window.DemoModule
// Dependencies: window.StamboomStorage (storage.js)
//
// Load order:
//   utils.js → schema.js → storage.js → auth.js → demo.js → [pagina].js
// =============================================================================

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // DEMO DATA
    // Fictional persons — all names, dates and places are made up.
    // Field order matches import CSV: ID, Doopnaam, Roepnaam, Prefix, Achternaam,
    // Geslacht, Geboortedatum, Geboorteplaats, Overlijdensdatum, Overlijdensplaats,
    // VaderID, MoederID, PartnerID, Opmerkingen (huwelijksdatum)
    // -------------------------------------------------------------------------

    var DEMO_PERSONS = [

        // =====================================================================
        // FAMILIE DE VRIES — GENERATIE 1
        // =====================================================================

        {
            id:               'DV001',                                     // Hendrik de Vries (overgrootvader)
            doopnaam:         'Hendrik',
            roepnaam:         'Henk',
            prefix:           'de',
            achternaam:       'Vries',
            geslacht:         'M',
            geboortedatum:    '1895-04-22',
            geboorteplaats:   'Groningen',
            overlijdensdatum: '1968-09-14',
            overlijdensplaats:'Groningen',
            vaderId:          '',
            moederId:         '',
            partnerId:        'DV002',
            opmerkingen:      'Getrouwd op 1920-06-05'
        },
        {
            id:               'DV002',                                     // Cornelia van den Berg (overgrootmoeder)
            doopnaam:         'Cornelia',
            roepnaam:         'Corrie',
            prefix:           'van den',
            achternaam:       'Berg',
            geslacht:         'V',
            geboortedatum:    '1898-11-03',
            geboorteplaats:   'Assen',
            overlijdensdatum: '1971-02-28',
            overlijdensplaats:'Groningen',
            vaderId:          '',
            moederId:         '',
            partnerId:        'DV001',
            opmerkingen:      'Getrouwd op 1920-06-05'
        },

        // =====================================================================
        // FAMILIE DE VRIES — GENERATIE 2
        // =====================================================================

        {
            id:               'DV003',                                     // Willem de Vries (zoon van Hendrik+Cornelia)
            doopnaam:         'Willem',
            roepnaam:         'Wim',
            prefix:           'de',
            achternaam:       'Vries',
            geslacht:         'M',
            geboortedatum:    '1922-07-15',
            geboorteplaats:   'Groningen',
            overlijdensdatum: '1995-03-10',
            overlijdensplaats:'Amsterdam',
            vaderId:          'DV001',
            moederId:         'DV002',
            partnerId:        'DV004',
            opmerkingen:      'Getrouwd op 1948-08-20'
        },
        {
            id:               'DV004',                                     // Sofie Jacobs (vrouw van Willem)
            doopnaam:         'Sofie',
            roepnaam:         'Sofie',
            prefix:           '',
            achternaam:       'Jacobs',
            geslacht:         'V',
            geboortedatum:    '1925-02-09',
            geboorteplaats:   'Utrecht',
            overlijdensdatum: '1998-12-01',
            overlijdensplaats:'Amsterdam',
            vaderId:          '',
            moederId:         '',
            partnerId:        'DV003',
            opmerkingen:      'Getrouwd op 1948-08-20'
        },
        {
            id:               'DV005',                                     // Zuster van Willem: Lies de Vries
            doopnaam:         'Elisabeth',
            roepnaam:         'Lies',
            prefix:           'de',
            achternaam:       'Vries',
            geslacht:         'V',
            geboortedatum:    '1926-05-30',
            geboorteplaats:   'Groningen',
            overlijdensdatum: '2004-07-19',
            overlijdensplaats:'Groningen',
            vaderId:          'DV001',
            moederId:         'DV002',
            partnerId:        'DV006',
            opmerkingen:      'Getrouwd op 1952-04-12'
        },
        {
            id:               'DV006',                                     // Pieter Hoekstra (man van Lies)
            doopnaam:         'Pieter',
            roepnaam:         'Piet',
            prefix:           '',
            achternaam:       'Hoekstra',
            geslacht:         'M',
            geboortedatum:    '1923-10-17',
            geboorteplaats:   'Leeuwarden',
            overlijdensdatum: '2001-01-05',
            overlijdensplaats:'Groningen',
            vaderId:          '',
            moederId:         '',
            partnerId:        'DV005',
            opmerkingen:      'Getrouwd op 1952-04-12'
        },

        // =====================================================================
        // FAMILIE DE VRIES — GENERATIE 3
        // =====================================================================

        {
            id:               'DV007',                                     // Thomas de Vries (zoon van Willem+Sofie)
            doopnaam:         'Thomas',
            roepnaam:         'Tom',
            prefix:           'de',
            achternaam:       'Vries',
            geslacht:         'M',
            geboortedatum:    '1950-06-03',
            geboorteplaats:   'Amsterdam',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'DV003',
            moederId:         'DV004',
            partnerId:        'MT003',                                     // Eerste partner: Eva Smits (ex)
            opmerkingen:      'Getrouwd op 1975-09-13 — gescheiden 1985'
        },
        {
            id:               'DV008',                                     // Anne de Vries (dochter van Willem+Sofie)
            doopnaam:         'Anne',
            roepnaam:         'Anne',
            prefix:           'de',
            achternaam:       'Vries',
            geslacht:         'V',
            geboortedatum:    '1953-11-22',
            geboorteplaats:   'Amsterdam',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'DV003',
            moederId:         'DV004',
            partnerId:        'DV009',
            opmerkingen:      'Getrouwd op 1979-05-04'
        },
        {
            id:               'DV009',                                     // Marc Vermeer (man van Anne)
            doopnaam:         'Marcus',
            roepnaam:         'Marc',
            prefix:           '',
            achternaam:       'Vermeer',
            geslacht:         'M',
            geboortedatum:    '1951-03-14',
            geboorteplaats:   'Haarlem',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          '',
            moederId:         '',
            partnerId:        'DV008',
            opmerkingen:      'Getrouwd op 1979-05-04'
        },
        {
            id:               'DV010',                                     // Nora Bakker (tweede partner Thomas)
            doopnaam:         'Nora',
            roepnaam:         'Nora',
            prefix:           '',
            achternaam:       'Bakker',
            geslacht:         'V',
            geboortedatum:    '1958-08-27',
            geboorteplaats:   'Rotterdam',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          '',
            moederId:         '',
            partnerId:        'DV007',                                     // Tweede partner van Thomas
            opmerkingen:      'Getrouwd op 1988-03-21'
        },
        {
            id:               'DV011',                                     // Kind van Lies+Pieter: Frank Hoekstra
            doopnaam:         'Frank',
            roepnaam:         'Frank',
            prefix:           '',
            achternaam:       'Hoekstra',
            geslacht:         'M',
            geboortedatum:    '1955-09-08',
            geboorteplaats:   'Groningen',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'DV006',
            moederId:         'DV005',
            partnerId:        'DV012',
            opmerkingen:      'Getrouwd op 1982-10-30'
        },
        {
            id:               'DV012',                                     // Partner van Frank: Ingrid Koster
            doopnaam:         'Ingrid',
            roepnaam:         'Ingrid',
            prefix:           '',
            achternaam:       'Koster',
            geslacht:         'V',
            geboortedatum:    '1957-12-14',
            geboorteplaats:   'Zwolle',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          '',
            moederId:         '',
            partnerId:        'DV011',
            opmerkingen:      'Getrouwd op 1982-10-30'
        },

        // =====================================================================
        // FAMILIE DE VRIES — GENERATIE 4
        // Kinderen van Thomas + Eva (ex) én Thomas + Nora (huidig)
        // =====================================================================

        {
            id:               'DV013',                                     // Kind Thomas+Eva: Julia de Vries
            doopnaam:         'Julia',
            roepnaam:         'Julia',
            prefix:           'de',
            achternaam:       'Vries',
            geslacht:         'V',
            geboortedatum:    '1977-04-19',
            geboorteplaats:   'Amsterdam',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'DV007',
            moederId:         'MT003',                                     // Moeder is Eva Smits (ex)
            partnerId:        'DV014',
            opmerkingen:      'Getrouwd op 2003-07-12'
        },
        {
            id:               'DV014',                                     // Partner van Julia: Lars Hendriksen
            doopnaam:         'Lars',
            roepnaam:         'Lars',
            prefix:           '',
            achternaam:       'Hendriksen',
            geslacht:         'M',
            geboortedatum:    '1975-01-30',
            geboorteplaats:   'Den Haag',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          '',
            moederId:         '',
            partnerId:        'DV013',
            opmerkingen:      'Getrouwd op 2003-07-12'
        },
        {
            id:               'DV015',                                     // Kind Thomas+Eva: Daan de Vries
            doopnaam:         'Daan',
            roepnaam:         'Daan',
            prefix:           'de',
            achternaam:       'Vries',
            geslacht:         'M',
            geboortedatum:    '1980-10-05',
            geboorteplaats:   'Amsterdam',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'DV007',
            moederId:         'MT003',                                     // Moeder is Eva Smits (ex)
            partnerId:        '',
            opmerkingen:      ''
        },
        {
            id:               'DV016',                                     // Kind Thomas+Nora: Sara de Vries
            doopnaam:         'Sara',
            roepnaam:         'Sara',
            prefix:           'de',
            achternaam:       'Vries',
            geslacht:         'V',
            geboortedatum:    '1990-03-17',
            geboorteplaats:   'Amsterdam',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'DV007',
            moederId:         'DV010',                                     // Moeder is Nora Bakker
            partnerId:        'DV017',
            opmerkingen:      'Getrouwd op 2015-06-20'
        },
        {
            id:               'DV017',                                     // Partner van Sara: Kevin Wolters
            doopnaam:         'Kevin',
            roepnaam:         'Kevin',
            prefix:           '',
            achternaam:       'Wolters',
            geslacht:         'M',
            geboortedatum:    '1988-07-24',
            geboorteplaats:   'Eindhoven',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          '',
            moederId:         '',
            partnerId:        'DV016',
            opmerkingen:      'Getrouwd op 2015-06-20'
        },
        {
            id:               'DV018',                                     // Kind Thomas+Nora: Noah de Vries
            doopnaam:         'Noah',
            roepnaam:         'Noah',
            prefix:           'de',
            achternaam:       'Vries',
            geslacht:         'M',
            geboortedatum:    '1993-12-02',
            geboorteplaats:   'Amsterdam',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'DV007',
            moederId:         'DV010',                                     // Moeder is Nora Bakker
            partnerId:        '',
            opmerkingen:      ''
        },
        {
            id:               'DV019',                                     // Kind Anne+Marc: Lisa Vermeer
            doopnaam:         'Lisa',
            roepnaam:         'Lisa',
            prefix:           '',
            achternaam:       'Vermeer',
            geslacht:         'V',
            geboortedatum:    '1982-06-11',
            geboorteplaats:   'Haarlem',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'DV009',
            moederId:         'DV008',
            partnerId:        'DV020',
            opmerkingen:      'Getrouwd op 2008-09-06'
        },
        {
            id:               'DV020',                                     // Partner van Lisa: Sander Prins
            doopnaam:         'Sander',
            roepnaam:         'Sander',
            prefix:           '',
            achternaam:       'Prins',
            geslacht:         'M',
            geboortedatum:    '1980-04-03',
            geboorteplaats:   'Leiden',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          '',
            moederId:         '',
            partnerId:        'DV019',
            opmerkingen:      'Getrouwd op 2008-09-06'
        },
        {
            id:               'DV021',                                     // Kind Frank+Ingrid: Bas Hoekstra
            doopnaam:         'Bas',
            roepnaam:         'Bas',
            prefix:           '',
            achternaam:       'Hoekstra',
            geslacht:         'M',
            geboortedatum:    '1985-02-28',
            geboorteplaats:   'Groningen',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'DV011',
            moederId:         'DV012',
            partnerId:        '',
            opmerkingen:      ''
        },

        // =====================================================================
        // FAMILIE DE VRIES — GENERATIE 5
        // Kinderen van Julia+Lars en Sara+Kevin
        // =====================================================================

        {
            id:               'DV022',                                     // Kind Julia+Lars: Emma Hendriksen
            doopnaam:         'Emma',
            roepnaam:         'Emma',
            prefix:           '',
            achternaam:       'Hendriksen',
            geslacht:         'V',
            geboortedatum:    '2005-08-14',
            geboorteplaats:   'Amsterdam',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'DV014',
            moederId:         'DV013',
            partnerId:        '',
            opmerkingen:      ''
        },
        {
            id:               'DV023',                                     // Kind Julia+Lars: Max Hendriksen
            doopnaam:         'Maximilian',
            roepnaam:         'Max',
            prefix:           '',
            achternaam:       'Hendriksen',
            geslacht:         'M',
            geboortedatum:    '2008-03-22',
            geboorteplaats:   'Amsterdam',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'DV014',
            moederId:         'DV013',
            partnerId:        '',
            opmerkingen:      ''
        },
        {
            id:               'DV024',                                     // Kind Sara+Kevin: Lena Wolters
            doopnaam:         'Lena',
            roepnaam:         'Lena',
            prefix:           '',
            achternaam:       'Wolters',
            geslacht:         'V',
            geboortedatum:    '2017-11-09',
            geboorteplaats:   'Eindhoven',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'DV017',
            moederId:         'DV016',
            partnerId:        '',
            opmerkingen:      ''
        },
        {
            id:               'DV025',                                     // Kind Lisa+Sander: Finn Prins
            doopnaam:         'Finn',
            roepnaam:         'Finn',
            prefix:           '',
            achternaam:       'Prins',
            geslacht:         'M',
            geboortedatum:    '2010-05-31',
            geboorteplaats:   'Leiden',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'DV020',
            moederId:         'DV019',
            partnerId:        '',
            opmerkingen:      ''
        },
        {
            id:               'DV026',                                     // Kind Lisa+Sander: Mia Prins
            doopnaam:         'Mia',
            roepnaam:         'Mia',
            prefix:           '',
            achternaam:       'Prins',
            geslacht:         'V',
            geboortedatum:    '2013-09-17',
            geboorteplaats:   'Leiden',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'DV020',
            moederId:         'DV019',
            partnerId:        '',
            opmerkingen:      ''
        },

        // =====================================================================
        // FAMILIE DE VRIES — GENERATIE 6
        // Kind van Emma Hendriksen (gen 5) — diepste lijn
        // =====================================================================

        {
            id:               'DV027',                                     // Kind Emma: Olivia Hendriksen (gen 6)
            doopnaam:         'Olivia',
            roepnaam:         'Olivia',
            prefix:           '',
            achternaam:       'Hendriksen',
            geslacht:         'V',
            geboortedatum:    '2026-01-15',
            geboorteplaats:   'Amsterdam',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          '',                                           // Vader niet bekend in demo
            moederId:         'DV022',                                     // Moeder is Emma
            partnerId:        '',
            opmerkingen:      'Pasgeboren'
        },

        // =====================================================================
        // FAMILIE MARTENS — ouders en broer/zus van Eva Smits (ex-partner Thomas)
        // =====================================================================

        {
            id:               'MT001',                                     // Vader Eva: Gerard Martens
            doopnaam:         'Gerard',
            roepnaam:         'Geer',
            prefix:           '',
            achternaam:       'Martens',
            geslacht:         'M',
            geboortedatum:    '1920-08-11',
            geboorteplaats:   'Tilburg',
            overlijdensdatum: '1988-04-03',
            overlijdensplaats:'Tilburg',
            vaderId:          '',
            moederId:         '',
            partnerId:        'MT002',
            opmerkingen:      'Getrouwd op 1945-10-18'
        },
        {
            id:               'MT002',                                     // Moeder Eva: Riet van Osch
            doopnaam:         'Maria',
            roepnaam:         'Riet',
            prefix:           'van',
            achternaam:       'Osch',
            geslacht:         'V',
            geboortedatum:    '1923-03-29',
            geboorteplaats:   'Breda',
            overlijdensdatum: '1999-07-22',
            overlijdensplaats:'Tilburg',
            vaderId:          '',
            moederId:         '',
            partnerId:        'MT001',
            opmerkingen:      'Getrouwd op 1945-10-18'
        },
        {
            id:               'MT003',                                     // Eva Smits (ex-partner Thomas) — geboren als Martens
            doopnaam:         'Eva',
            roepnaam:         'Eva',
            prefix:           '',
            achternaam:       'Smits',                                     // Achternaam na huwelijk
            geslacht:         'V',
            geboortedatum:    '1952-12-07',
            geboorteplaats:   'Tilburg',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'MT001',
            moederId:         'MT002',
            partnerId:        'DV007',                                     // Ex-partner Thomas de Vries
            opmerkingen:      'Getrouwd op 1975-09-13 — gescheiden 1985'
        },
        {
            id:               'MT004',                                     // Broer van Eva: Kees Martens
            doopnaam:         'Cornelis',
            roepnaam:         'Kees',
            prefix:           '',
            achternaam:       'Martens',
            geslacht:         'M',
            geboortedatum:    '1949-05-14',
            geboorteplaats:   'Tilburg',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'MT001',
            moederId:         'MT002',
            partnerId:        'MT005',
            opmerkingen:      'Getrouwd op 1973-06-01'
        },
        {
            id:               'MT005',                                     // Partner Kees: Truus van den Berg
            doopnaam:         'Gertruda',
            roepnaam:         'Truus',
            prefix:           'van den',
            achternaam:       'Berg',
            geslacht:         'V',
            geboortedatum:    '1951-09-02',
            geboorteplaats:   'Eindhoven',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          '',
            moederId:         '',
            partnerId:        'MT004',
            opmerkingen:      'Getrouwd op 1973-06-01'
        },
        {
            id:               'MT006',                                     // Zus van Eva: Anja Martens
            doopnaam:         'Anja',
            roepnaam:         'Anja',
            prefix:           '',
            achternaam:       'Martens',
            geslacht:         'V',
            geboortedatum:    '1955-02-19',
            geboorteplaats:   'Tilburg',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'MT001',
            moederId:         'MT002',
            partnerId:        '',
            opmerkingen:      ''
        },
        {
            id:               'MT007',                                     // Kind Kees+Truus: Robin Martens
            doopnaam:         'Robin',
            roepnaam:         'Robin',
            prefix:           '',
            achternaam:       'Martens',
            geslacht:         'M',
            geboortedatum:    '1975-11-26',
            geboorteplaats:   'Tilburg',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'MT004',
            moederId:         'MT005',
            partnerId:        'MT008',
            opmerkingen:      'Getrouwd op 2001-04-14'
        },
        {
            id:               'MT008',                                     // Partner Robin: Sofie Claes
            doopnaam:         'Sofie',
            roepnaam:         'Sofie',
            prefix:           '',
            achternaam:       'Claes',
            geslacht:         'V',
            geboortedatum:    '1977-07-08',
            geboorteplaats:   'Antwerpen',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          '',
            moederId:         '',
            partnerId:        'MT007',
            opmerkingen:      'Getrouwd op 2001-04-14'
        },
        {
            id:               'MT009',                                     // Kind Robin+Sofie: Jade Martens
            doopnaam:         'Jade',
            roepnaam:         'Jade',
            prefix:           '',
            achternaam:       'Martens',
            geslacht:         'V',
            geboortedatum:    '2003-06-30',
            geboorteplaats:   'Tilburg',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'MT007',
            moederId:         'MT008',
            partnerId:        '',
            opmerkingen:      ''
        },
        {
            id:               'MT010',                                     // Kind Robin+Sofie: Luca Martens
            doopnaam:         'Luca',
            roepnaam:         'Luca',
            prefix:           '',
            achternaam:       'Martens',
            geslacht:         'M',
            geboortedatum:    '2006-02-11',
            geboorteplaats:   'Tilburg',
            overlijdensdatum: '',
            overlijdensplaats:'',
            vaderId:          'MT007',
            moederId:         'MT008',
            partnerId:        '',
            opmerkingen:      ''
        }

    ];

    // -------------------------------------------------------------------------
    // Totaal: 37 personen (ruim onder de 60-limiet)
    // -------------------------------------------------------------------------

    // -------------------------------------------------------------------------
    // loadDemo()
    // Laadt de demo stamboom in localStorage via StamboomStorage.
    // Overschrijft bestaande data alleen als de huidige localStorage leeg is.
    //
    // @param {boolean} force — als true: altijd laden, ook als er al data is
    // @returns {boolean} true als demo geladen is, false als overgeslagen
    // -------------------------------------------------------------------------
    function loadDemo(force) {
        if (!window.StamboomStorage) {
            console.warn('[DemoModule] StamboomStorage niet beschikbaar');    // Module niet geladen
            return false;
        }

        var bestaand = window.StamboomStorage.get();                          // Haal huidige data op

        if (!force && bestaand && bestaand.length > 0) {
            console.log('[DemoModule] Bestaande data aanwezig — demo niet geladen'); // Geen overschrijving
            return false;
        }

        window.StamboomStorage.replaceAll(DEMO_PERSONS);                      // Laad alle demo personen
        window.StamboomStorage.setActiveTreeId(null);                         // Geen cloud-ID (lokale demo)
        window.StamboomStorage.setActiveTreeName('Demo — Familie De Vries');  // Naam zichtbaar in topbar

        console.log('[DemoModule] Demo stamboom geladen (' + DEMO_PERSONS.length + ' personen)');
        return true;
    }

    // -------------------------------------------------------------------------
    // isDemo()
    // Geeft true terug als de actieve stamboom de demo is.
    // Gebaseerd op de actieve tree-naam.
    // -------------------------------------------------------------------------
    function isDemo() {
        if (!window.StamboomStorage) return false;
        var naam = window.StamboomStorage.getActiveTreeName();                // Haal naam op
        return naam === 'Demo — Familie De Vries';                            // Vergelijk met demo-naam
    }

    // -------------------------------------------------------------------------
    // getPersons()
    // Geeft de ruwe demo-data terug (voor tests of previewdoeleinden).
    // -------------------------------------------------------------------------
    function getPersons() {
        return DEMO_PERSONS.slice();                                           // Kopie teruggeven
    }

    // -------------------------------------------------------------------------
    // Publieke API
    // -------------------------------------------------------------------------
    window.DemoModule = {
        loadDemo:   loadDemo,    // (force?)  → boolean
        isDemo:     isDemo,      // ()        → boolean
        getPersons: getPersons   // ()        → persoon[]
    };

    console.log('[DemoModule] Module geladen — ' + DEMO_PERSONS.length + ' demo personen beschikbaar');

})();
