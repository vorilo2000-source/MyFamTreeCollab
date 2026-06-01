/* ======================= js/manage.js v2.8.0 =======================
   Beheerpagina: toont stamboom als tabel, live search, add/save/refresh
   Vereist: schema.js, idGenerator.js, storage.js, LiveSearch.js,
            relatieEngine.js, colorHelper.js

   Wijziging v2.8.0 (sessie 36):
   - Kleurgradiënt op td cellen i.p.v. tr — CSS specificiteitsprobleem opgelost
   - Inline stijl op td's gezet ná COLUMNS.forEach() loop zodat alle cellen bestaan
   - VHoofdID en MHoofdID krijgen nu correcte aparte kleuren

   Wijziging v2.7.0 (sessie 36):
   - Kleurgradiënt voor meerdere VaderID/MoederID/PartnerID rijen
   - buildRow() krijgt colorIndex parameter mee
   - renderTable() geeft juiste index mee per relatietype en volgorde

   Wijziging v2.6.1 (bugfix headers):
   - buildHeader() exposed via window.ManageTable
   - showPlaceholder() uit init() gehaald

   Wijziging v2.6.0 (F3-48):
   - VaderID, MoederID, PartnerID dynamische lijsten met add/remove knoppen

   Scripts: utils.js → colorHelper.js → schema.js → idGenerator.js →
            storage.js → auth.js → siteAnalytics.js → shareModule.js →
            accessGuard.js → LiveSearch.js → relatieEngine.js → manage.js
   =================================================================== */

(function () {
    'use strict';                                                           // Strikte modus: voorkomt stille JS-fouten

    /* ======================= HELPERS ======================= */
    var safe          = window.ftSafe;                                     // Centrale safe() uit utils.js
    var parsePartners = window.StamboomSchema.parsePartners;               // | splitter voor index berekening

    /* ======================= MULTI-ID VELDEN ======================= */
    var MULTI_ID_FIELDS = ['VaderID', 'MoederID', 'PartnerID'];           // Velden met |-gescheiden meerdere waarden

    /* ======================= KOLOMMEN DEFINITIE ======================= */
    var COLUMNS = [                                                        // Alle tabelkolommen met bewerkbaarheid
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
    // Aangeropen vanuit manage.html .then()-chain, ná loadNamespace('manage')
    function buildHeader() {
        theadRow.innerHTML = '';                                          // Verwijder bestaande kolomkoppen
        COLUMNS.forEach(function (col) {                                  // Loop door elke kolom-definitie
            var th = document.createElement('th');                       // Maak nieuw <th> element
            th.textContent = i18nModule.t(col.i18nKey);                  // Vertaalde kolomnaam via namespace
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

    /* ======================= MULTI-ID WIDGET BOUWEN ======================= */
    // Bouwt een bewerkbare lijst van ID-invoervelden in een <td>
    function buildMultiIDCell(fieldKey, currentValue) {
        var td = document.createElement('td');                           // Container cel
        td.dataset.multiField = fieldKey;                                // Markeer als multi-ID widget

        var wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;min-width:120px'; // Verticale lijst

        var ids = window.StamboomSchema.parsePartners(currentValue || ''); // Splits op |
        if (ids.length === 0) { ids = ['']; }                            // Minimaal één leeg veld

        ids.forEach(function (idValue) {
            wrapper.appendChild(buildMultiIDRow(idValue, wrapper));      // Rij per ID
        });

        var addIdBtn = document.createElement('button');
        addIdBtn.type        = 'button';                                 // Geen form submit
        addIdBtn.textContent = '+ ID';                                   // Label
        addIdBtn.title       = 'Extra ID toevoegen';                     // Tooltip
        addIdBtn.style.cssText = 'margin-top:2px;padding:2px 6px;font-size:0.8rem;cursor:pointer;background:#28a745;color:#fff;border:none;border-radius:3px;align-self:flex-start';

        addIdBtn.addEventListener('click', function () {
            wrapper.insertBefore(buildMultiIDRow('', wrapper), addIdBtn); // Nieuw leeg veld vóór knop
        });

        wrapper.appendChild(addIdBtn);                                   // Knop als laatste element
        td.appendChild(wrapper);                                         // Widget in cel
        return td;                                                       // Retourneer ingevulde cel
    }

    /* ======================= MULTI-ID INVOER-RIJ BOUWEN ======================= */
    // Bouwt één rij: [input veld] [× knop]
    function buildMultiIDRow(idValue, wrapper) {
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:4px;align-items:center';  // Horizontale rij

        var input = document.createElement('input');
        input.type        = 'text';                                      // Tekst invoer
        input.value       = idValue;                                     // Huidige waarde
        input.placeholder = 'ID...';                                     // Hint
        input.className   = 'multi-id-input';                            // Klasse voor uitlezen
        input.style.cssText = 'flex:1;padding:3px 6px;font-size:0.88rem;border:1px solid #ccc;border-radius:3px;box-sizing:border-box';

        var removeBtn = document.createElement('button');
        removeBtn.type        = 'button';                                // Geen form submit
        removeBtn.textContent = '×';                                     // Kruisje
        removeBtn.title       = 'Verwijder dit ID';                      // Tooltip
        removeBtn.style.cssText = 'padding:2px 6px;font-size:0.9rem;cursor:pointer;background:#dc3545;color:#fff;border:none;border-radius:3px;line-height:1';

        removeBtn.addEventListener('click', function () {
            var allRows = wrapper.querySelectorAll('div');               // Alle rijen in widget
            if (allRows.length > 1) {
                wrapper.removeChild(row);                                // Verwijder deze rij
            } else {
                input.value = '';                                        // Laatste rij: leegmaken
            }
        });

        row.appendChild(input);                                          // Input in rij
        row.appendChild(removeBtn);                                      // Knop in rij
        return row;                                                      // Retourneer de rij
    }

    /* ======================= MULTI-ID WIDGET UITLEZEN ======================= */
    function readMultiIDCell(td) {
        var inputs = td.querySelectorAll('input.multi-id-input');        // Alle inputs in widget
        var values = [];

        inputs.forEach(function (input) {
            var val = input.value.trim();
            if (val) values.push(val);                                   // Alleen niet-lege waarden
        });

        return window.StamboomSchema.stringifyPartners(values);          // Samenvoegen met |
    }

    /* ======================= DELETE HANDLER FACTORY ======================= */
    function makeDeleteHandler(tr, getID) {
        return function () {
            if (!confirm(i18nModule.t('manage:confirm.delete'))) return; // Bevestiging

            var id = getID();                                            // Te verwijderen ID

            if (id) {
                dataset = dataset.filter(function (x) { return safe(x.ID) !== id; }); // Verwijder persoon

                dataset = dataset.map(function (x) {
                    var updated = Object.assign({}, x);                  // Ondiepe kopie

                    // Verwijder gedelete ID uit VaderID, MoederID en PartnerID
                    ['VaderID', 'MoederID', 'PartnerID'].forEach(function (field) {
                        if (safe(updated[field])) {
                            updated[field] = window.StamboomSchema.stringifyPartners(
                                window.StamboomSchema.parsePartners(updated[field])
                                    .filter(function (s) { return s !== id; }) // Verwijder gedelete ID
                            );
                        }
                    });

                    return updated;
                });

                StamboomStorage.set(dataset);                            // Opgeschoonde dataset opslaan
            }

            tr.remove();                                                 // Rij uit DOM verwijderen
        };
    }

    /* ======================= RELATIE-LABEL HELPER ======================= */
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
            default:          return relatie || i18nModule.t('manage:rel.unknown');
        }
    }

    /* ======================= TABEL RENDEREN ======================= */
    function renderTable(ds) {
        if (!selectedHoofdId) {
            showPlaceholder(i18nModule.t('manage:placeholder.select'));  // Geen selectie — beginmelding
            return;
        }

        var contextData = computeRelaties(ds, selectedHoofdId);          // Bereken relaties rondom hoofdpersoon
        if (!contextData.length) {
            showPlaceholder(i18nModule.t('manage:placeholder.notFound')); // Geen personen gevonden
            return;
        }

        tableBody.innerHTML = '';                                         // Leeg de tabel
        var renderQueue = [];                                             // Array van {p, colorIndex}

        var hoofd = contextData.find(function (p) { return p.Relatie === 'HoofdID'; }); // Hoofdpersoon

        // Indexarrays voor kleurberekening op basis van positie in |-lijst
        var hoofdVaderIDs  = parsePartners(hoofd ? hoofd.VaderID   || '' : ''); // Vaders van hoofd
        var hoofdMoederIDs = parsePartners(hoofd ? hoofd.MoederID  || '' : ''); // Moeders van hoofd
        var hoofdPartners  = parsePartners(hoofd ? hoofd.PartnerID || '' : ''); // Partners van hoofd

        // Ouders — index = positie in VaderID of MoederID lijst
        contextData
            .filter(function (p) { return p.Relatie === 'VHoofdID' || p.Relatie === 'MHoofdID'; })
            .forEach(function (p) {
                var idxV = hoofdVaderIDs.indexOf(safe(p.ID));            // Positie in vaderlijst
                var idxM = hoofdMoederIDs.indexOf(safe(p.ID));           // Positie in moederlijst
                var colorIndex = idxV !== -1 ? idxV : (idxM !== -1 ? idxM : 0); // Gebruik gevonden index
                renderQueue.push({ p: p, colorIndex: colorIndex });
            });

        if (hoofd) renderQueue.push({ p: hoofd, colorIndex: 0 });        // Hoofdpersoon altijd index 0

        // Eerste partner via relatieEngine
        contextData
            .filter(function (p) { return p.Relatie === 'PHoofdID'; })
            .forEach(function (p) {
                var idx = hoofdPartners.indexOf(safe(p.ID));             // Positie in partnerlijst
                renderQueue.push({ p: p, colorIndex: idx !== -1 ? idx : 0 });
            });

        // Extra partners van hoofdpersoon (2e, 3e, ...)
        if (hoofd && safe(hoofd.PartnerID)) {
            hoofd.PartnerID.split('|')
                .map(function (id) { return id.trim(); })
                .filter(Boolean)
                .slice(1)                                                 // Eerste al via relatieEngine
                .forEach(function (pid, sliceIdx) {
                    var ep = dataset.find(function (p) { return safe(p.ID) === pid; });
                    if (ep) renderQueue.push({
                        p: Object.assign({}, ep, { Relatie: 'PHoofdID' }),
                        colorIndex: sliceIdx + 1                         // slice(1) → index start bij 1
                    });
                });
        }

        // Kinderen + hun partners
        contextData
            .filter(function (p) { return ['KindID', 'HKindID', 'PHKindID'].includes(p.Relatie); })
            .forEach(function (k) {
                renderQueue.push({ p: k, colorIndex: 0 });               // Kind altijd index 0
                if (safe(k.PartnerID)) {
                    parsePartners(k.PartnerID).forEach(function (pid, idx) {
                        var kp = dataset.find(function (p) { return safe(p.ID) === pid; });
                        if (kp) renderQueue.push({
                            p: Object.assign({}, kp, { Relatie: 'Partner' }),
                            colorIndex: idx                               // Index op positie in lijst
                        });
                    });
                }
            });

        // Broers/zussen + hun partners
        contextData
            .filter(function (p) { return p.Relatie === 'BZID'; })
            .forEach(function (s) {
                renderQueue.push({ p: s, colorIndex: 0 });               // BZ altijd index 0
                if (safe(s.PartnerID)) {
                    parsePartners(s.PartnerID).forEach(function (pid, idx) {
                        var bzP = dataset.find(function (p) { return safe(p.ID) === pid; });
                        if (bzP) renderQueue.push({
                            p: Object.assign({}, bzP, { Relatie: 'Partner' }),
                            colorIndex: idx
                        });
                    });
                }
            });

        renderQueue.forEach(function (item) {
            tableBody.appendChild(buildRow(item.p, false, item.colorIndex)); // Bouw en voeg rij toe
        });

        adjustTextareas();                                               // Hoogte textareas aanpassen
    }

    /* ======================= RIJ BOUWEN ======================= */
    // p: persoonsobject | isNew: nieuwe lege rij | colorIndex: 0 = basiskleur, 1+ = lichter
    function buildRow(p, isNew, colorIndex) {
        var tr = document.createElement('tr');                           // Nieuwe tabelrij

        if (!isNew && p.Relatie) {
            tr.classList.add(p.Relatie);                                 // CSS klasse voor basiskleur via RelationColors.css
        }

        COLUMNS.forEach(function (col) {
            var td;                                                       // Cel variabele

            if (col.key === 'Acties') {
                td = document.createElement('td');
                var btn = document.createElement('button');
                if (isNew) {
                    btn.textContent = i18nModule.t('manage:action.delete');
                    btn.title       = i18nModule.t('manage:action.deleteRowTitle');
                    btn.addEventListener('click', function () {
                        tr.remove();                                     // Verwijder rij uit DOM
                        tempRowCount--;                                  // Teller verlagen
                    });
                } else {
                    btn.textContent = i18nModule.t('manage:action.delete');
                    btn.title       = i18nModule.t('manage:action.deleteTitle');
                    btn.addEventListener('click', makeDeleteHandler(tr, function () { return safe(p.ID); }));
                }
                td.appendChild(btn);

            } else if (col.key === 'Relatie') {
                td = document.createElement('td');
                td.textContent = isNew ? '' : relatieLabel(p.Relatie);  // Leeg voor nieuwe rij

            } else if (col.readonly) {
                td = document.createElement('td');
                td.textContent = isNew ? '' : (p[col.key] || '');       // Leeg voor nieuwe rij

            } else if (MULTI_ID_FIELDS.indexOf(col.key) !== -1) {
                td = buildMultiIDCell(col.key, isNew ? '' : (p[col.key] || '')); // Multi-ID widget

            } else {
                td = document.createElement('td');
                var ta = document.createElement('textarea');
                ta.value           = isNew ? '' : (p[col.key] || '');
                ta.dataset.field   = col.key;                            // Veldnaam voor opslaan
                ta.style.width     = '100%';
                ta.style.boxSizing = 'border-box';
                ta.style.resize    = 'vertical';
                td.appendChild(ta);
            }

            tr.appendChild(td);                                          // Cel toevoegen aan rij
        });

        // ======================= KLEURGRADIËNT OP TD CELLEN =======================
        // Na de loop — alle td's bestaan nu via tr.cells
        // CSS specificiteitsprobleem: tr.VHoofdID td { background } wint van inline tr stijl
        // Oplossing: inline stijl rechtstreeks op td's zetten (hogere specificiteit)
        // Index 0 = CSS klasse bepaalt kleur, index 1+ = inline stijl overschrijft
        if (!isNew && colorIndex > 0 && window.ColorHelper && p.Relatie) {
            var tdColor = window.ColorHelper.getRelationColor(p.Relatie, colorIndex); // Bereken lichtere kleur
            Array.from(tr.cells).forEach(function (cell) {
                cell.style.backgroundColor = tdColor;                   // Inline stijl op elke td
            });
        }

        return tr;                                                       // Retourneer de volledige rij
    }

    /* ======================= PLACEHOLDER ======================= */
    function showPlaceholder(msg) {
        tableBody.innerHTML = '';                                        // Verwijder bestaande rijen
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        td.colSpan         = COLUMNS.length;                            // Span alle kolommen
        td.textContent     = msg;                                       // Meldingstekst
        td.style.textAlign = 'center';
        tr.appendChild(td);
        tableBody.appendChild(tr);
    }

    /* ======================= NIEUWE RIJ TOEVOEGEN ======================= */
    function addRow() {
        if (tempRowCount >= 10) {
            alert(i18nModule.t('manage:alert.maxRows'));                 // Maximum bereikt
            return;
        }
        var tr = buildRow({}, true, 0);                                  // Lege rij, altijd index 0
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
                    if (!cell) return;                                   // Cel ontbreekt: overslaan

                    if (col.readonly) {
                        if (col.key === 'ID') {
                            persoon.ID = safe(cell.textContent);         // ID uit readonly cel lezen
                        }
                    } else if (MULTI_ID_FIELDS.indexOf(col.key) !== -1) {
                        persoon[col.key] = readMultiIDCell(cell);        // |-gescheiden string
                    } else {
                        var ta = cell.querySelector('textarea');
                        persoon[col.key] = ta ? ta.value.trim() : '';   // Waarde uit textarea
                    }
                });

                if (!persoon.ID) {
                    persoon.ID = window.genereerCode(                    // Genereer uniek ID voor nieuw record
                        persoon,
                        Array.from(idMap.values())
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
            alert(i18nModule.t('manage:alert.saved'));                   // Bevestiging
        } catch (e) {
            alert(i18nModule.t('manage:alert.saveFailed', { error: e.message })); // Foutmelding
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
        URL.revokeObjectURL(url);                                        // Geheugen vrijgeven
    }

    /* ======================= EXPORT CSV ======================= */
    function exportCSV() {
        var headers = COLUMNS.map(function (c) { return c.key; }).join(','); // Kolomkoppen
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
        URL.revokeObjectURL(url);                                        // Geheugen vrijgeven
    }

    /* ======================= INITIALISATIE ======================= */
    function init() {
        // buildHeader() en showPlaceholder() worden NIET hier aangeroepen —
        // beide vereisen de manage-namespace die nog niet geladen is op dit moment
        // manage.html roept window.ManageTable.buildHeader() aan ná loadNamespace('manage')

        i18next.on('languageChanged', function () {
            buildHeader();                                               // Headers hertekenen bij taalwissel
        });

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

    /* ======================= PUBLIEKE API ======================= */
    // Exposed via window.ManageTable zodat manage.html beide functies kan aanroepen
    // ná loadNamespace('manage') — consistent met window.RelatieEngine, window.StamboomSchema
    window.ManageTable = {
        buildHeader:     buildHeader,                                    // Headers bouwen na namespace load
        showPlaceholder: showPlaceholder                                 // Beginmelding na namespace load
    };

})();                                                                    // Sluit en voer direct uit
