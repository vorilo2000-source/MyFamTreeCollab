// =============================================================================
// demo.js — Demo stamboom module
// MyFamTreeCollab v1.1.0
// -----------------------------------------------------------------------------
// Nieuw in v1.1.0:
// - Veldnamen aangepast aan schema.js (hoofdletters: Doopnaam, VaderID etc.)
// - Veldnamen waren lowercase — storage.html toonde lege cellen
//
// Provides a hardcoded fictional demo family tree for guest users.
//
// Structure:
//   Familie De Vries — 6 generaties (hoofdlijn)
//   Familie Martens  — 2 generaties (ex-partner Eva Smits stamt hieruit)
//
// Exported as: window.DemoModule
// Dependencies: window.StamboomStorage (storage.js)
//
// Load order:
//   utils.js → schema.js → storage.js → auth.js → demo.js → [pagina].js
// =============================================================================

(function () {
    'use strict'; // strikte modus — voorkomt stille fouten

    // -------------------------------------------------------------------------
    // DEMO DATA
    // Veldnamen komen overeen met schema.js FIELDS:
    // ID, Doopnaam, Roepnaam, Prefix, Achternaam, Geslacht,
    // Geboortedatum, Geboorteplaats, Overlijdensdatum, Overlijdensplaats,
    // VaderID, MoederID, PartnerID, Opmerkingen
    // -------------------------------------------------------------------------

    var DEMO_PERSONS = [

        // =====================================================================
        // FAMILIE DE VRIES — GENERATIE 1
        // =====================================================================

        {
            ID:                'DV001',                                    // Uniek persoon ID
            Doopnaam:          'Hendrik',                                  // Officiële voornaam
            Roepnaam:          'Henk',                                     // Roepnaam
            Prefix:            'de',                                       // Tussenvoegsel
            Achternaam:        'Vries',                                    // Familienaam
            Geslacht:          'M',                                        // M / V / X
            Geboortedatum:     '1895-04-22',                               // yyyy-mm-dd
            Geboorteplaats:    'Groningen',                                // Geboorteplaats
            Overlijdensdatum:  '1968-09-14',                               // yyyy-mm-dd
            Overlijdensplaats: 'Groningen',                                // Overlijdensplaats
            VaderID:           '',                                         // Verwijzing naar vader
            MoederID:          '',                                         // Verwijzing naar moeder
            PartnerID:         'DV002',                                    // Verwijzing naar partner(s)
            Opmerkingen:       'Getrouwd op 1920-06-05'                    // Vrije tekst
        },
        {
            ID:                'DV002',
            Doopnaam:          'Cornelia',
            Roepnaam:          'Corrie',
            Prefix:            'van den',
            Achternaam:        'Berg',
            Geslacht:          'V',
            Geboortedatum:     '1898-11-03',
            Geboorteplaats:    'Assen',
            Overlijdensdatum:  '1971-02-28',
            Overlijdensplaats: 'Groningen',
            VaderID:           '',
            MoederID:          '',
            PartnerID:         'DV001',
            Opmerkingen:       'Getrouwd op 1920-06-05'
        },

        // =====================================================================
        // FAMILIE DE VRIES — GENERATIE 2
        // =====================================================================

        {
            ID:                'DV003',
            Doopnaam:          'Willem',
            Roepnaam:          'Wim',
            Prefix:            'de',
            Achternaam:        'Vries',
            Geslacht:          'M',
            Geboortedatum:     '1922-07-15',
            Geboorteplaats:    'Groningen',
            Overlijdensdatum:  '1995-03-10',
            Overlijdensplaats: 'Amsterdam',
            VaderID:           'DV001',                                    // Vader: Hendrik de Vries
            MoederID:          'DV002',                                    // Moeder: Cornelia van den Berg
            PartnerID:         'DV004',
            Opmerkingen:       'Getrouwd op 1948-08-20'
        },
        {
            ID:                'DV004',
            Doopnaam:          'Sofie',
            Roepnaam:          'Sofie',
            Prefix:            '',
            Achternaam:        'Jacobs',
            Geslacht:          'V',
            Geboortedatum:     '1925-02-09',
            Geboorteplaats:    'Utrecht',
            Overlijdensdatum:  '1998-12-01',
            Overlijdensplaats: 'Amsterdam',
            VaderID:           '',
            MoederID:          '',
            PartnerID:         'DV003',
            Opmerkingen:       'Getrouwd op 1948-08-20'
        },
        {
            ID:                'DV005',
            Doopnaam:          'Elisabeth',
            Roepnaam:          'Lies',
            Prefix:            'de',
            Achternaam:        'Vries',
            Geslacht:          'V',
            Geboortedatum:     '1926-05-30',
            Geboorteplaats:    'Groningen',
            Overlijdensdatum:  '2004-07-19',
            Overlijdensplaats: 'Groningen',
            VaderID:           'DV001',                                    // Vader: Hendrik de Vries
            MoederID:          'DV002',                                    // Moeder: Cornelia van den Berg
            PartnerID:         'DV006',
            Opmerkingen:       'Getrouwd op 1952-04-12'
        },
        {
            ID:                'DV006',
            Doopnaam:          'Pieter',
            Roepnaam:          'Piet',
            Prefix:            '',
            Achternaam:        'Hoekstra',
            Geslacht:          'M',
            Geboortedatum:     '1923-10-17',
            Geboorteplaats:    'Leeuwarden',
            Overlijdensdatum:  '2001-01-05',
            Overlijdensplaats: 'Groningen',
            VaderID:           '',
            MoederID:          '',
            PartnerID:         'DV005',
            Opmerkingen:       'Getrouwd op 1952-04-12'
        },

        // =====================================================================
        // FAMILIE DE VRIES — GENERATIE 3
        // =====================================================================

        {
            ID:                'DV007',
            Doopnaam:          'Thomas',
            Roepnaam:          'Tom',
            Prefix:            'de',
            Achternaam:        'Vries',
            Geslacht:          'M',
            Geboortedatum:     '1950-06-03',
            Geboorteplaats:    'Amsterdam',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'DV003',
            MoederID:          'DV004',
            PartnerID:         'MT003',                                    // Eerste partner: Eva Smits (ex)
            Opmerkingen:       'Getrouwd op 1975-09-13 — gescheiden 1985'
        },
        {
            ID:                'DV008',
            Doopnaam:          'Anne',
            Roepnaam:          'Anne',
            Prefix:            'de',
            Achternaam:        'Vries',
            Geslacht:          'V',
            Geboortedatum:     '1953-11-22',
            Geboorteplaats:    'Amsterdam',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'DV003',
            MoederID:          'DV004',
            PartnerID:         'DV009',
            Opmerkingen:       'Getrouwd op 1979-05-04'
        },
        {
            ID:                'DV009',
            Doopnaam:          'Marcus',
            Roepnaam:          'Marc',
            Prefix:            '',
            Achternaam:        'Vermeer',
            Geslacht:          'M',
            Geboortedatum:     '1951-03-14',
            Geboorteplaats:    'Haarlem',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           '',
            MoederID:          '',
            PartnerID:         'DV008',
            Opmerkingen:       'Getrouwd op 1979-05-04'
        },
        {
            ID:                'DV010',
            Doopnaam:          'Nora',
            Roepnaam:          'Nora',
            Prefix:            '',
            Achternaam:        'Bakker',
            Geslacht:          'V',
            Geboortedatum:     '1958-08-27',
            Geboorteplaats:    'Rotterdam',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           '',
            MoederID:          '',
            PartnerID:         'DV007',                                    // Tweede partner van Thomas
            Opmerkingen:       'Getrouwd op 1988-03-21'
        },
        {
            ID:                'DV011',
            Doopnaam:          'Frank',
            Roepnaam:          'Frank',
            Prefix:            '',
            Achternaam:        'Hoekstra',
            Geslacht:          'M',
            Geboortedatum:     '1955-09-08',
            Geboorteplaats:    'Groningen',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'DV006',                                    // Vader: Pieter Hoekstra
            MoederID:          'DV005',                                    // Moeder: Lies de Vries
            PartnerID:         'DV012',
            Opmerkingen:       'Getrouwd op 1982-10-30'
        },
        {
            ID:                'DV012',
            Doopnaam:          'Ingrid',
            Roepnaam:          'Ingrid',
            Prefix:            '',
            Achternaam:        'Koster',
            Geslacht:          'V',
            Geboortedatum:     '1957-12-14',
            Geboorteplaats:    'Zwolle',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           '',
            MoederID:          '',
            PartnerID:         'DV011',
            Opmerkingen:       'Getrouwd op 1982-10-30'
        },

        // =====================================================================
        // FAMILIE DE VRIES — GENERATIE 4
        // =====================================================================

        {
            ID:                'DV013',
            Doopnaam:          'Julia',
            Roepnaam:          'Julia',
            Prefix:            'de',
            Achternaam:        'Vries',
            Geslacht:          'V',
            Geboortedatum:     '1977-04-19',
            Geboorteplaats:    'Amsterdam',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'DV007',
            MoederID:          'MT003',                                    // Moeder: Eva Smits (ex)
            PartnerID:         'DV014',
            Opmerkingen:       'Getrouwd op 2003-07-12'
        },
        {
            ID:                'DV014',
            Doopnaam:          'Lars',
            Roepnaam:          'Lars',
            Prefix:            '',
            Achternaam:        'Hendriksen',
            Geslacht:          'M',
            Geboortedatum:     '1975-01-30',
            Geboorteplaats:    'Den Haag',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           '',
            MoederID:          '',
            PartnerID:         'DV013',
            Opmerkingen:       'Getrouwd op 2003-07-12'
        },
        {
            ID:                'DV015',
            Doopnaam:          'Daan',
            Roepnaam:          'Daan',
            Prefix:            'de',
            Achternaam:        'Vries',
            Geslacht:          'M',
            Geboortedatum:     '1980-10-05',
            Geboorteplaats:    'Amsterdam',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'DV007',
            MoederID:          'MT003',                                    // Moeder: Eva Smits (ex)
            PartnerID:         '',
            Opmerkingen:       ''
        },
        {
            ID:                'DV016',
            Doopnaam:          'Sara',
            Roepnaam:          'Sara',
            Prefix:            'de',
            Achternaam:        'Vries',
            Geslacht:          'V',
            Geboortedatum:     '1990-03-17',
            Geboorteplaats:    'Amsterdam',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'DV007',
            MoederID:          'DV010',                                    // Moeder: Nora Bakker
            PartnerID:         'DV017',
            Opmerkingen:       'Getrouwd op 2015-06-20'
        },
        {
            ID:                'DV017',
            Doopnaam:          'Kevin',
            Roepnaam:          'Kevin',
            Prefix:            '',
            Achternaam:        'Wolters',
            Geslacht:          'M',
            Geboortedatum:     '1988-07-24',
            Geboorteplaats:    'Eindhoven',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           '',
            MoederID:          '',
            PartnerID:         'DV016',
            Opmerkingen:       'Getrouwd op 2015-06-20'
        },
        {
            ID:                'DV018',
            Doopnaam:          'Noah',
            Roepnaam:          'Noah',
            Prefix:            'de',
            Achternaam:        'Vries',
            Geslacht:          'M',
            Geboortedatum:     '1993-12-02',
            Geboorteplaats:    'Amsterdam',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'DV007',
            MoederID:          'DV010',                                    // Moeder: Nora Bakker
            PartnerID:         '',
            Opmerkingen:       ''
        },
        {
            ID:                'DV019',
            Doopnaam:          'Lisa',
            Roepnaam:          'Lisa',
            Prefix:            '',
            Achternaam:        'Vermeer',
            Geslacht:          'V',
            Geboortedatum:     '1982-06-11',
            Geboorteplaats:    'Haarlem',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'DV009',                                    // Vader: Marc Vermeer
            MoederID:          'DV008',                                    // Moeder: Anne de Vries
            PartnerID:         'DV020',
            Opmerkingen:       'Getrouwd op 2008-09-06'
        },
        {
            ID:                'DV020',
            Doopnaam:          'Sander',
            Roepnaam:          'Sander',
            Prefix:            '',
            Achternaam:        'Prins',
            Geslacht:          'M',
            Geboortedatum:     '1980-04-03',
            Geboorteplaats:    'Leiden',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           '',
            MoederID:          '',
            PartnerID:         'DV019',
            Opmerkingen:       'Getrouwd op 2008-09-06'
        },
        {
            ID:                'DV021',
            Doopnaam:          'Bas',
            Roepnaam:          'Bas',
            Prefix:            '',
            Achternaam:        'Hoekstra',
            Geslacht:          'M',
            Geboortedatum:     '1985-02-28',
            Geboorteplaats:    'Groningen',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'DV011',
            MoederID:          'DV012',
            PartnerID:         '',
            Opmerkingen:       ''
        },

        // =====================================================================
        // FAMILIE DE VRIES — GENERATIE 5
        // =====================================================================

        {
            ID:                'DV022',
            Doopnaam:          'Emma',
            Roepnaam:          'Emma',
            Prefix:            '',
            Achternaam:        'Hendriksen',
            Geslacht:          'V',
            Geboortedatum:     '2005-08-14',
            Geboorteplaats:    'Amsterdam',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'DV014',
            MoederID:          'DV013',
            PartnerID:         '',
            Opmerkingen:       ''
        },
        {
            ID:                'DV023',
            Doopnaam:          'Maximilian',
            Roepnaam:          'Max',
            Prefix:            '',
            Achternaam:        'Hendriksen',
            Geslacht:          'M',
            Geboortedatum:     '2008-03-22',
            Geboorteplaats:    'Amsterdam',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'DV014',
            MoederID:          'DV013',
            PartnerID:         '',
            Opmerkingen:       ''
        },
        {
            ID:                'DV024',
            Doopnaam:          'Lena',
            Roepnaam:          'Lena',
            Prefix:            '',
            Achternaam:        'Wolters',
            Geslacht:          'V',
            Geboortedatum:     '2017-11-09',
            Geboorteplaats:    'Eindhoven',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'DV017',
            MoederID:          'DV016',
            PartnerID:         '',
            Opmerkingen:       ''
        },
        {
            ID:                'DV025',
            Doopnaam:          'Finn',
            Roepnaam:          'Finn',
            Prefix:            '',
            Achternaam:        'Prins',
            Geslacht:          'M',
            Geboortedatum:     '2010-05-31',
            Geboorteplaats:    'Leiden',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'DV020',
            MoederID:          'DV019',
            PartnerID:         '',
            Opmerkingen:       ''
        },
        {
            ID:                'DV026',
            Doopnaam:          'Mia',
            Roepnaam:          'Mia',
            Prefix:            '',
            Achternaam:        'Prins',
            Geslacht:          'V',
            Geboortedatum:     '2013-09-17',
            Geboorteplaats:    'Leiden',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'DV020',
            MoederID:          'DV019',
            PartnerID:         '',
            Opmerkingen:       ''
        },

        // =====================================================================
        // FAMILIE DE VRIES — GENERATIE 6
        // =====================================================================

        {
            ID:                'DV027',
            Doopnaam:          'Olivia',
            Roepnaam:          'Olivia',
            Prefix:            '',
            Achternaam:        'Hendriksen',
            Geslacht:          'V',
            Geboortedatum:     '2026-01-15',
            Geboorteplaats:    'Amsterdam',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           '',                                         // Vader niet bekend in demo
            MoederID:          'DV022',                                    // Moeder: Emma Hendriksen
            PartnerID:         '',
            Opmerkingen:       'Pasgeboren'
        },

        // =====================================================================
        // FAMILIE MARTENS
        // =====================================================================

        {
            ID:                'MT001',
            Doopnaam:          'Gerard',
            Roepnaam:          'Geer',
            Prefix:            '',
            Achternaam:        'Martens',
            Geslacht:          'M',
            Geboortedatum:     '1920-08-11',
            Geboorteplaats:    'Tilburg',
            Overlijdensdatum:  '1988-04-03',
            Overlijdensplaats: 'Tilburg',
            VaderID:           '',
            MoederID:          '',
            PartnerID:         'MT002',
            Opmerkingen:       'Getrouwd op 1945-10-18'
        },
        {
            ID:                'MT002',
            Doopnaam:          'Maria',
            Roepnaam:          'Riet',
            Prefix:            'van',
            Achternaam:        'Osch',
            Geslacht:          'V',
            Geboortedatum:     '1923-03-29',
            Geboorteplaats:    'Breda',
            Overlijdensdatum:  '1999-07-22',
            Overlijdensplaats: 'Tilburg',
            VaderID:           '',
            MoederID:          '',
            PartnerID:         'MT001',
            Opmerkingen:       'Getrouwd op 1945-10-18'
        },
        {
            ID:                'MT003',
            Doopnaam:          'Eva',
            Roepnaam:          'Eva',
            Prefix:            '',
            Achternaam:        'Smits',                                    // Achternaam na huwelijk
            Geslacht:          'V',
            Geboortedatum:     '1952-12-07',
            Geboorteplaats:    'Tilburg',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'MT001',
            MoederID:          'MT002',
            PartnerID:         'DV007',                                    // Ex-partner: Thomas de Vries
            Opmerkingen:       'Getrouwd op 1975-09-13 — gescheiden 1985'
        },
        {
            ID:                'MT004',
            Doopnaam:          'Cornelis',
            Roepnaam:          'Kees',
            Prefix:            '',
            Achternaam:        'Martens',
            Geslacht:          'M',
            Geboortedatum:     '1949-05-14',
            Geboorteplaats:    'Tilburg',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'MT001',
            MoederID:          'MT002',
            PartnerID:         'MT005',
            Opmerkingen:       'Getrouwd op 1973-06-01'
        },
        {
            ID:                'MT005',
            Doopnaam:          'Gertruda',
            Roepnaam:          'Truus',
            Prefix:            'van den',
            Achternaam:        'Berg',
            Geslacht:          'V',
            Geboortedatum:     '1951-09-02',
            Geboorteplaats:    'Eindhoven',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           '',
            MoederID:          '',
            PartnerID:         'MT004',
            Opmerkingen:       'Getrouwd op 1973-06-01'
        },
        {
            ID:                'MT006',
            Doopnaam:          'Anja',
            Roepnaam:          'Anja',
            Prefix:            '',
            Achternaam:        'Martens',
            Geslacht:          'V',
            Geboortedatum:     '1955-02-19',
            Geboorteplaats:    'Tilburg',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'MT001',
            MoederID:          'MT002',
            PartnerID:         '',
            Opmerkingen:       ''
        },
        {
            ID:                'MT007',
            Doopnaam:          'Robin',
            Roepnaam:          'Robin',
            Prefix:            '',
            Achternaam:        'Martens',
            Geslacht:          'M',
            Geboortedatum:     '1975-11-26',
            Geboorteplaats:    'Tilburg',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'MT004',
            MoederID:          'MT005',
            PartnerID:         'MT008',
            Opmerkingen:       'Getrouwd op 2001-04-14'
        },
        {
            ID:                'MT008',
            Doopnaam:          'Sofie',
            Roepnaam:          'Sofie',
            Prefix:            '',
            Achternaam:        'Claes',
            Geslacht:          'V',
            Geboortedatum:     '1977-07-08',
            Geboorteplaats:    'Antwerpen',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           '',
            MoederID:          '',
            PartnerID:         'MT007',
            Opmerkingen:       'Getrouwd op 2001-04-14'
        },
        {
            ID:                'MT009',
            Doopnaam:          'Jade',
            Roepnaam:          'Jade',
            Prefix:            '',
            Achternaam:        'Martens',
            Geslacht:          'V',
            Geboortedatum:     '2003-06-30',
            Geboorteplaats:    'Tilburg',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'MT007',
            MoederID:          'MT008',
            PartnerID:         '',
            Opmerkingen:       ''
        },
        {
            ID:                'MT010',
            Doopnaam:          'Luca',
            Roepnaam:          'Luca',
            Prefix:            '',
            Achternaam:        'Martens',
            Geslacht:          'M',
            Geboortedatum:     '2006-02-11',
            Geboorteplaats:    'Tilburg',
            Overlijdensdatum:  '',
            Overlijdensplaats: '',
            VaderID:           'MT007',
            MoederID:          'MT008',
            PartnerID:         '',
            Opmerkingen:       ''
        }

    ]; // Totaal: 37 personen — ruim onder de 60-limiet

    // -------------------------------------------------------------------------
    // loadDemo(force)
    // Laadt de demo stamboom in localStorage via StamboomStorage.
    // @param {boolean} force — true: altijd laden, ook als er al data is
    // @returns {boolean} true als demo geladen is, false als overgeslagen
    // -------------------------------------------------------------------------
    function loadDemo(force) {
        if (!window.StamboomStorage) {                                     // Controleer of storage beschikbaar is
            console.warn('[DemoModule] StamboomStorage niet beschikbaar');
            return false;
        }

        var bestaand = window.StamboomStorage.get();                       // Haal huidige data op

        if (!force && bestaand && bestaand.length > 0) {                  // Bestaande data aanwezig en geen force
            console.log('[DemoModule] Bestaande data aanwezig — demo niet geladen');
            return false;
        }

        window.StamboomStorage.replaceAll(DEMO_PERSONS);                   // Laad alle demo personen in localStorage
        window.StamboomStorage.setActiveTreeId(null);                      // Geen cloud-ID — lokale demo
        window.StamboomStorage.setActiveTreeName('Demo — Familie De Vries'); // Naam zichtbaar in topbar

        console.log('[DemoModule] Demo geladen (' + DEMO_PERSONS.length + ' personen)');
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
    // Geeft de ruwe demo-data terug (voor tests of previewdoeleinden).
    // -------------------------------------------------------------------------
    function getPersons() {
        return DEMO_PERSONS.slice();                                        // Kopie teruggeven — origineel niet aanpassen
    }

    // -------------------------------------------------------------------------
    // Publieke API
    // -------------------------------------------------------------------------
    window.DemoModule = {
        loadDemo:   loadDemo,   // (force?) → boolean — laadt demo in localStorage
        isDemo:     isDemo,     // ()       → boolean — controleert of demo actief is
        getPersons: getPersons  // ()       → array   — geeft ruwe demo data terug
    };

    console.log('[DemoModule] Module geladen — ' + DEMO_PERSONS.length + ' personen beschikbaar');

})();
