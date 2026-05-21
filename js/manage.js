/* ======================= js/manage.js v2.5.1 =======================
   Beheerpagina: toont stamboom als tabel, live search, add/save/refresh
   Vereist: schema.js, idGenerator.js, storage.js, LiveSearch.js, relatieEngine.js

   Wijziging v2.5.1 (sessie 27):
   - COLUMNS uitgebreid met i18nKey per kolom
   - buildHeader() gebruikt i18nModule.t(col.i18nKey) i.p.v. col.key
   - i18next.on('languageChanged') toegevoegd: headers herladen bij taalwisseling

   Wijziging v2.5.0 (sessie 26):
   - Alle hardcoded strings vervangen door i18nModule.t('manage:...')
   - Relatie-labels via manage:rel.* keys
   - Acties-kolom titles via manage:action.*
   - Bevestigingen, alerts, placeholders via manage:confirm.*, manage:alert.*, manage:placeholder.*
   - const/let vervangen door var (ES5 conform projectstijl)
   - Template literals vervangen door string-concatenatie

   Wijziging v2.4.0:
   - Meerdere partners via pipe-gescheiden PartnerID (F3-48)

   Wijziging v2.3.2:
   - Delete-knop werkt op alle bestaande rijen
   - Delete cleanup: verwijderd ID gewist uit VaderID, MoederID, PartnerID

   Wijziging v2.3.0:
   - KindPartnerID en BZPartnerID vervangen door uniforme 'Partner'

   Wijziging v2.2.0:
   - Kindpartner en BZpartner opzoeken via dataset

   Wijziging v2.1.0:
   - KindID filter uitgebreid naar HKindID en PHKindID
   =================================================================== */

(function () {                                                              // Zelfuitvoerende functie: alle variabelen blijven lokaal
    'use strict';                                                           // Strikte modus: voorkomt stille JS-fouten

    /* ======================= HELPERS ======================= */
    var safe = window.ftSafe;                                              // Centrale safe() uit utils.js

    /* ======================= KOLOMMEN DEFINITIE ======================= */
    var COLUMNS = [                                                        // Array met alle tabelkolommen en hun bewerkbaarheid
        { key: 'Acties',            i18nKey: 'manage:table.actions',           readonly: true  },
        { key: 'Relatie',           i18nKey: 'manage:table.relatie',           readonly: true  },
        { key: 'ID',                i18nKey: 'manage:table.id',                readonly: true  },
        { key: 'Doopnaam',          i18nKey: 'manage:table.doopnaam',          readonly: false },
        { key: 'Roepnaam',          i18nKey: 'manage:table.roepnaam',          readonly: false },
        { key: 'Prefix',            i18nKey: 'manage:table.prefix',            readonly: false },
        { key: 'Achternaam',        i18nKey: 'manage:table.achternaam',        readonly: false },
        { key: 'Geslacht',          i18nKey: 'manage:table.geslacht',          readonly: false },
        { key: 'Geboortedatum',     i18nKey: 'manage:table.geboortedatum',     readonly: false },
        { key: 'Geboorteplaats',    i18nKey: 'manage:table.geboorteplaats',    readonly: false },
        { key: 'Overlijdensdatum',  i18nKey: 'manage:table.overlijdensdatum',  readonly: false },
        { key: 'Overlijdensplaats', i18nKey: 'manage:table.overlijdensplaats', readonly: false },
        { key: 'VaderID',           i18nKey: 'manage:table.vaderID',           readonly: false },
        { key: 'MoederID',          i18nKey: 'manage:table.moederID',          readonly: false },
        { key: 'PartnerID',         i18nKey: 'manage:table.partnerID',         readonly: false },
        { key: 'Opmerkingen',       i18nKey: 'manage:table.opmerkingen',       readonly: false }
    ];

    /* ======================= STATE ======================= */
    var dataset         = StamboomStorage.get();                          // Volledige stamboom-dataset uit localStorage
    var selectedHoofdId = null;                                           // Geselecteerde hoofdpersoon
    var tempRowCount    = 0;                                              // Teller voor onopgeslagen rijen

    /* ======================= DOM ELEMENTEN ======================= */
    var tableBody     = document.querySelector('#manageTable tbody');     // <tbody> voor persoonsrijen
    var theadRow      = document.querySelector('#manageTable thead tr'); // Header-rij voor kolomtitels
    var addBtn        = document.getElementById('addBtn');                // Knop: nieuwe rij toevoegen
    var saveBtn       = document.getElementById('saveBtn');               // Knop: opslaan naar localStorage
    var refreshBtn    = document.getElementById('refreshBtn');            // Knop: tabel herladen
    var exportJsonBtn = document.getElementById('exportJson');            // Knop: download als JSON
    var exportCsvBtn  = document.getElementById('exportCsv');             // Knop: download als CSV
    var searchInput   = document.getElementById('searchPerson');          // Zoekveld live search

    /* ======================= HEADER BOUWEN ======================= */
    function buildHeader() {
        theadRow.innerHTML = '';                                          // Verwijder bestaande kolomkoppen
        COLUMNS.forEach(function (col) {                                  // Loop door elke kolom-definitie
            var th = document.createElement('th');                       // Maak een nieuw <th> element
            th.textContent = i18nModule.t(col.i18nKey);                  // Vertaalde kolomnaam via i18nKey
            theadRow.appendChild(th);                                    // Toevoegen aan header-rij
        });
    }

    /* ======================= RELATIE ENGINE ======================= */
    var computeRelaties = window.RelatieEngine.computeRelaties;          // Centrale functie uit relatieEngine.js

    /* ======================= TEXTAREA AUTO-HOOGTE ======================= */
    function adjustTextareas() {
        tableBody.querySelectorAll('textarea').forEach(function (ta) {   // Loop door alle textarea-velden
            ta.style.height = 'auto';                                    // Reset hoogte voor correcte scrollHeight
            var maxH = 120;                                              // Maximum hoogte in pixels
            if (ta.scrollHeight > maxH) {
                ta.style.height    = maxH + 'px';                        // Begrens op maximum
                ta.style.overflowY = 'auto';                             // Scrollbalk toevoegen
            } else {
                ta.style.height    = ta.scrollHeight + 'px';             // Pas hoogte aan op inhoud
                ta.style.overflowY = 'hidden';                           // Geen scrollbalk nodig
            }
        });
    }

    /* ======================= DELETE HANDLER FACTORY ======================= */
    // Herbruikbaar voor bestaande én nieuwe rijen
    function makeDeleteHandler(tr, getID) {
        return function () {
            // Bevestigingsdialoog — vertaald via i18n
            if (!confirm(i18nModule.t('manage:confirm.delete'))) return;

            var id = getID();                                            // Haal het te verwijderen ID op

            if (id) {
                // Stap 1: verwijder de persoon uit de dataset
                dataset = dataset.filter(function (x) { return safe(x.ID) !== id; });

                // Stap 2: cleanup verwijzingen in alle andere personen
                dataset = dataset.map(function (x) {
                    var updated = Object.assign({}, x);                  // Ondiepe kopie

                    if (safe(updated.VaderID) === id) {
                        updated.VaderID = '';                            // Vader bestaat niet meer
                    }
                    if (safe(updated.MoederID) === id) {
                        updated.MoederID = '';                           // Moeder bestaat niet meer
                    }
                    if (safe(updated.PartnerID)) {
                        // PartnerID kan meerdere ID's bevatten gescheiden door |
                        updated.PartnerID = updated.PartnerID
                            .split('|')
                            .map(function (s) { return s.trim(); })
                            .filter(function (s) { return s !== id; })   // Verwijder gedelete ID
                            .join('|');
                    }

                    return updated;
                });

                StamboomStorage.set(dataset);                            // Opgeschoonde dataset opslaan
            }

            tr.remove();                                                 // Rij direct uit DOM verwijderen
        };
    }

    /* ======================= RELATIE-LABEL HELPER ======================= */
    // Vertaalt interne relatiecodes naar gelokaliseerde labels via i18n
    function relatieLabel(relatie) {
        switch (relatie) {
            case 'VHoofdID':
            case 'MHoofdID':  return i18nModule.t('manage:rel.parent');  // Ouder
            case 'PHoofdID':
            case 'Partner':   return i18nModule.t('manage:rel.partner'); // Partner
            case 'BZID':      return i18nModule.t('manage:rel.sibling'); // Broer/Zus
            case 'HoofdID':   return i18nModule.t('manage:rel.root');    // Hoofdpersoon
            case 'KindID':
            case 'HKindID':
            case 'PHKindID':  return i18nModule.t('manage:rel.child');   // Kind
            default:          return relatie || i18nModule.t('manage:rel.unknown'); // Onbekend
        }
    }

    /* ======================= TABEL RENDEREN ======================= */
    function renderTable(ds) {
        if (!selectedHoofdId) {
            // Geen selectie — vertaalde melding
            showPlaceholder(i18nModule.t('manage:placeholder.select'));
            return;
        }

        var contextData = computeRelaties(ds, selectedHoofdId);          // Bereken relaties rondom hoofdpersoon
        if (!contextData.length) {
            // Geen personen gevonden — vertaalde melding
            showPlaceholder(i18nModule.t('manage:placeholder.notFound'));
            return;
        }

        tableBody.innerHTML = '';                                         // Leeg de tabel
        var renderQueue = [];                                             // Volgorde-array voor weergave

        // Ouders eerst
        contextData
            .filter(function (p) { return p.Relatie === 'VHoofdID' || p.Relatie === 'MHoofdID'; })
            .forEach(function (p) { renderQueue.push(p); });

        // Hoofdpersoon
        var hoofd = contextData.find(function (p) { return p.Relatie === 'HoofdID'; });
        if (hoofd) renderQueue.push(hoofd);

        // Eerste partner via relatieEngine
        contextData
            .filter(function (p) { return p.Relatie === 'PHoofdID'; })
            .forEach(function (p) { renderQueue.push(p); });

        // Extra partners van hoofdpersoon (2e, 3e, ...)
        if (hoofd && safe(hoofd.PartnerID)) {
            hoofd.PartnerID.split('|')
                .map(function (id) { return id.trim(); })
                .filter(Boolean)
                .slice(1)                                                 // Eerste partner al toegevoegd via PHoofdID
                .forEach(function (pid) {
                    var ep = dataset.find(function (p) { return safe(p.ID) === pid; });
                    if (ep) renderQueue.push(Object.assign({}, ep, { Relatie: 'PHoofdID' }));
                });
        }

        // Kinderen + hun partners
        contextData
            .filter(function (p) { return ['KindID', 'HKindID', 'PHKindID'].includes(p.Relatie); })
            .forEach(function (k) {
                renderQueue.push(k);
                if (safe(k.PartnerID)) {
                    k.PartnerID.split('|')
                        .map(function (id) { return id.trim(); })
                        .filter(Boolean)
                        .forEach(function (pid) {
                            var kp = dataset.find(function (p) { return safe(p.ID) === pid; });
                            if (kp) renderQueue.push(Object.assign({}, kp, { Relatie: 'Partner' }));
                        });
                }
            });

        // Broers/zussen + hun partners
        contextData
            .filter(function (p) { return p.Relatie === 'BZID'; })
            .forEach(function (s) {
                renderQueue.push(s);
                if (safe(s.PartnerID)) {
                    s.PartnerID.split('|')
                        .map(function (id) { return id.trim(); })
                        .filter(Boolean)
                        .forEach(function (pid) {
                            var bzP = dataset.find(function (p) { return safe(p.ID) === pid; });
                            if (bzP) renderQueue.push(Object.assign({}, bzP, { Relatie: 'Partner' }));
                        });
                }
            });

        // Bouw tabelrijen
        renderQueue.forEach(function (p) {
            var tr = document.createElement('tr');                       // Nieuwe tabelrij

            // CSS-kleurklasse op basis van relatie
            if (p.Relatie) tr.classList.add(p.Relatie);

            COLUMNS.forEach(function (col, i) {
                var td = document.createElement('td');                   // Cel per kolom

                if (col.key === 'Acties') {
                    // Delete-knop voor bestaande rij — vertaald via i18n
                    var btn = document.createElement('button');
                    btn.textContent = i18nModule.t('manage:action.delete');      // 🗑️
                    btn.title       = i18nModule.t('manage:action.deleteTitle'); // Tooltip
                    btn.addEventListener('click', makeDeleteHandler(tr, function () { return safe(p.ID); }));
                    td.appendChild(btn);

                } else if (col.key === 'Relatie') {
                    // Relatie-kolom: vertaald label via relatieLabel()
                    td.textContent = relatieLabel(p.Relatie);

                } else if (col.readonly) {
                    // Overige readonly kolommen (ID): platte tekst
                    td.textContent = p[col.key] || '';

                } else {
                    // Bewerkbare kolom: textarea
                    var ta = document.createElement('textarea');
                    ta.value           = p[col.key] || '';
                    ta.dataset.field   = col.key;
                    ta.style.width     = '100%';
                    ta.style.boxSizing = 'border-box';
                    ta.style.resize    = 'vertical';
                    td.appendChild(ta);
                }

                tr.appendChild(td);
            });

            tableBody.appendChild(tr);
        });

        adjustTextareas();                                               // Hoogte textareas aanpassen
    }

    /* ======================= PLACEHOLDER ======================= */
    function showPlaceholder(msg) {
        tableBody.innerHTML = '';                                        // Verwijder bestaande rijen
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        td.colSpan         = COLUMNS.length;                            // Span alle kolommen
        td.textContent     = msg;                                       // Vertaalde meldingstekst
        td.style.textAlign = 'center';
        tr.appendChild(td);
        tableBody.appendChild(tr);
    }

    /* ======================= NIEUWE RIJ TOEVOEGEN ======================= */
    function addRow() {
        if (tempRowCount >= 10) {
            // Maximum bereikt — vertaald via i18n
            alert(i18nModule.t('manage:alert.maxRows'));
            return;
        }

        var tr = document.createElement('tr');                           // Nieuwe lege tabelrij

        COLUMNS.forEach(function (col) {
            var td = document.createElement('td');

            if (col.key === 'Acties') {
                // Delete-knop voor nieuwe rij — vertaald via i18n
                var btn = document.createElement('button');
                btn.textContent = i18nModule.t('manage:action.delete');         // 🗑️
                btn.title       = i18nModule.t('manage:action.deleteRowTitle'); // Tooltip
                btn.addEventListener('click', function () { tr.remove(); });    // Nieuwe rij: alleen DOM-verwijdering
                td.appendChild(btn);

            } else if (col.readonly) {
                td.textContent = '';                                     // Readonly cel leeg: ID volgt na opslaan

            } else {
                var ta = document.createElement('textarea');
                ta.value           = '';
                ta.dataset.field   = col.key;
                ta.style.width     = '100%';
                ta.style.boxSizing = 'border-box';
                ta.style.resize    = 'vertical';
                td.appendChild(ta);
            }

            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
        tempRowCount++;                                                  // Teller verhogen
        adjustTextareas();
    }

    /* ======================= DATASET OPSLAAN ======================= */
    function saveDatasetMerged() {
        try {
            var rows  = tableBody.querySelectorAll('tr');                // Alle zichtbare tabelrijen
            var idMap = new Map(dataset.map(function (p) { return [p.ID, p]; })); // ID → persoon-object

            rows.forEach(function (tr) {
                var persoon = {};                                        // Nieuw object vullen vanuit cellen

                COLUMNS.forEach(function (col, i) {
                    var cell = tr.cells[i];
                    if (col.readonly) {
                        if (col.key === 'ID') {
                            persoon.ID = safe(cell.textContent);         // ID uit readonly cel lezen
                        }
                    } else {
                        var ta = cell.querySelector('textarea');
                        persoon[col.key] = ta ? ta.value.trim() : '';   // Waarde uit textarea
                    }
                });

                if (!persoon.ID) {
                    // Nieuw record: genereer uniek ID
                    persoon.ID = window.genereerCode(
                        persoon,
                        Array.from(idMap.values())                       // Bestaande personen voor uniciteit
                    );
                }

                idMap.set(persoon.ID, Object.assign(
                    {},
                    idMap.get(persoon.ID) || {},                         // Bewaar bestaande velden
                    persoon                                              // Overschrijf met gewijzigde waarden
                ));
            });

            dataset = Array.from(idMap.values());                       // Map terug naar array
            StamboomStorage.set(dataset);                               // Opslaan in localStorage
            tempRowCount = 0;                                            // Teller resetten
            alert(i18nModule.t('manage:alert.saved'));                   // Bevestiging — vertaald
        } catch (e) {
            alert(i18nModule.t('manage:alert.saveFailed', { error: e.message })); // Foutmelding — vertaald
        }
    }

    /* ======================= EXPORT JSON ======================= */
    function exportJSON() {
        var data = JSON.stringify(dataset, null, 2);                    // Dataset naar leesbare JSON
        var blob = new Blob([data], { type: 'application/json' });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href     = url;
        a.download = 'stamboom.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    /* ======================= EXPORT CSV ======================= */
    function exportCSV() {
        var headers = COLUMNS.map(function (c) { return c.key; }).join(',');
        var rows    = dataset
            .map(function (p) {
                return COLUMNS
                    .map(function (c) { return '"' + (p[c.key] || '').replace(/"/g, '""') + '"'; })
                    .join(',');
            })
            .join('\n');

        var csv  = headers + '\n' + rows;
        var blob = new Blob([csv], { type: 'text/csv' });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href     = url;
        a.download = 'stamboom.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    /* ======================= INITIALISATIE ======================= */
    function init() {
        buildHeader();                                                   // Kolomtitels bouwen

        // Herlaad headers automatisch bij taalwisseling
        i18next.on('languageChanged', function () {
            buildHeader();
        });

        // Beginmelding — vertaald via i18n
        showPlaceholder(i18nModule.t('manage:placeholder.select'));

        addBtn.addEventListener('click', addRow);                        // Voeg toe-knop
        saveBtn.addEventListener('click', saveDatasetMerged);            // Opslaan-knop
        refreshBtn.addEventListener('click', function () {
            if (selectedHoofdId) {
                renderTable(dataset);                                    // Herlaad tabel
            } else {
                showPlaceholder(i18nModule.t('manage:placeholder.select')); // Beginmelding
            }
        });

        if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportJSON);
        if (exportCsvBtn)  exportCsvBtn.addEventListener('click',  exportCSV);

        if (typeof initLiveSearch === 'function') {
            initLiveSearch(searchInput, dataset, function (selectedID) {
                selectedHoofdId = selectedID;                            // Nieuwe hoofdpersoon
                renderTable(dataset);                                    // Tabel herbouwen
            });

            document.addEventListener('click', function (e) {
                var popup = document.getElementById('searchPopup');      // Zoekresultaten-popup
                if (popup && !popup.contains(e.target) && e.target !== searchInput) {
                    popup.remove();                                      // Sluit popup bij klik buiten
                }
            });
        }
    }

    init();                                                              // Start initialisatie

})();                                                                    // Sluit en voer direct uit
