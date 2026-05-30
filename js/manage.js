/* ======================= js/manage.js v2.6.1 =======================
   Wijziging v2.6.1 (sessie 35 — bugfix headers):
   - buildHeader() niet meer aangeroepen vanuit init()
   - buildHeader() geëxposed via window.ManageTable.buildHeader
   - Aanroep verplaatst naar manage.html .then()-chain, ná loadNamespace('manage')
   - languageChanged listener blijft in manage.js (gebruikt window.ManageTable.buildHeader)

   Wijziging v2.6.0 (sessie F3-48):
   - VaderID, MoederID en PartnerID dynamische lijsten met add/remove knoppen
   - buildMultiIDCell(), buildMultiIDRow(), readMultiIDCell()
   - buildRow(p, isNew) centrale rij-bouwer
   - makeDeleteHandler() cleanup via parsePartners()/stringifyPartners()

   Wijziging v2.5.1 (sessie 27):
   - COLUMNS uitgebreid met i18nKey per kolom
   - buildHeader() gebruikt i18nModule.t(col.i18nKey)
   - i18next.on('languageChanged') toegevoegd

   Scripts: utils.js → schema.js → idGenerator.js → storage.js → auth.js →
            siteAnalytics.js → shareModule.js → accessGuard.js → LiveSearch.js →
            relatieEngine.js → manage.js (verplichte volgorde)
   =================================================================== */

(function () {                                                              // Zelfuitvoerende functie: alle variabelen blijven lokaal
    'use strict';                                                           // Strikte modus: voorkomt stille JS-fouten

    /* ======================= HELPERS ======================= */
    var safe = window.ftSafe;                                              // Centrale safe() uit utils.js

    /* ======================= MULTI-ID VELDEN ======================= */
    var MULTI_ID_FIELDS = ['VaderID', 'MoederID', 'PartnerID'];           // Velden met |-gescheiden meerdere waarden

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
    // Exposed via window.ManageTable.buildHeader zodat manage.html
    // dit kan aanroepen ná loadNamespace('manage') in de .then()-chain
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

    /* ======================= MULTI-ID WIDGET BOUWEN ======================= */
    function buildMultiIDCell(fieldKey, currentValue) {
        var td = document.createElement('td');                           // Container cel
        td.dataset.multiField = fieldKey;                                // Markeer cel als multi-ID widget

        var wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;min-width:120px'; // verticale lijst

        var ids = window.StamboomSchema.parsePartners(currentValue || ''); // ['P002','P005'] of []
        if (ids.length === 0) { ids = ['']; }                            // Eén lege invoer als startpunt

        ids.forEach(function (idValue) {
            wrapper.appendChild(buildMultiIDRow(idValue, wrapper));      // Voeg rij toe aan wrapper
        });

        var addIdBtn = document.createElement('button');
        addIdBtn.type        = 'button';
        addIdBtn.textContent = '+ ID';
        addIdBtn.title       = 'Extra ID toevoegen';
        addIdBtn.style.cssText = 'margin-top:2px;padding:2px 6px;font-size:0.8rem;cursor:pointer;background:#28a745;color:#fff;border:none;border-radius:3px;align-self:flex-start';

        addIdBtn.addEventListener('click', function () {
            wrapper.insertBefore(buildMultiIDRow('', wrapper), addIdBtn); // Nieuw leeg veld vóór knop
        });

        wrapper.appendChild(addIdBtn);
        td.appendChild(wrapper);
        return td;
    }

    /* ======================= MULTI-ID INVOER-RIJ BOUWEN ======================= */
    function buildMultiIDRow(idValue, wrapper) {
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:4px;align-items:center';  // Horizontale rij

        var input = document.createElement('input');
        input.type        = 'text';
        input.value       = idValue;
        input.placeholder = 'ID...';
        input.className   = 'multi-id-input';
        input.style.cssText = 'flex:1;padding:3px 6px;font-size:0.88rem;border:1px solid #ccc;border-radius:3px;box-sizing:border-box';

        var removeBtn = document.createElement('button');
        removeBtn.type        = 'button';
        removeBtn.textContent = '×';
        removeBtn.title       = 'Verwijder dit ID';
        removeBtn.style.cssText = 'padding:2px 6px;font-size:0.9rem;cursor:pointer;background:#dc3545;color:#fff;border:none;border-radius:3px;line-height:1';

        removeBtn.addEventListener('click', function () {
            var allRows = wrapper.querySelectorAll('div');               // Alle invoer-rijen in de widget
            if (allRows.length > 1) {
                wrapper.removeChild(row);                                // Rij verwijderen
            } else {
                input.value = '';                                        // Laatste rij: alleen leegmaken
            }
        });

        row.appendChild(input);
        row.appendChild(removeBtn);
        return row;
    }

    /* ======================= MULTI-ID WIDGET UITLEZEN ======================= */
    function readMultiIDCell(td) {
        var inputs = td.querySelectorAll('input.multi-id-input');        // Alle invoervelden in de widget
        var values = [];

        inputs.forEach(function (input) {
            var val = input.value.trim();
            if (val) values.push(val);                                   // Alleen niet-lege waarden
        });

        return window.StamboomSchema.stringifyPartners(values);          // |-gescheiden string
    }

    /* ======================= DELETE HANDLER FACTORY ======================= */
    function makeDeleteHandler(tr, getID) {
        return function () {
            if (!confirm(i18nModule.t('manage:confirm.delete'))) return;

            var id = getID();

            if (id) {
                dataset = dataset.filter(function (x) { return safe(x.ID) !== id; }); // Verwijder persoon

                dataset = dataset.map(function (x) {
                    var updated = Object.assign({}, x);                  // Ondiepe kopie

                    // VaderID, MoederID, PartnerID: verwijder gedelete ID uit |-lijst
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

            tr.remove();                                                 // Rij direct uit DOM verwijderen
        };
    }

    /* ======================= RELATIE-LABEL HELPER ======================= */
    function relatieLabel(relatie) {
        switch (relatie) {
            case 'VHoofdID':
            case 'MHoofdID':  return i18nModule.t('manage:rel.parent');
            case 'PHoofdID':
            case 'Partner':   return i18nModule.t('manage:rel.partner');
            case 'BZID':      return i18nModule.t('manage:rel.sibling');
            case 'HoofdID':   return i18nModule.t('manage:rel.root');
            case 'KindID':
            case 'HKindID':
            case 'PHKindID':  return i18nModule.t('manage:rel.child');
            default:          return relatie || i18nModule.t('manage:rel.unknown');
        }
    }

    /* ======================= TABEL RENDEREN ======================= */
    function renderTable(ds) {
        if (!selectedHoofdId) {
            showPlaceholder(i18nModule.t('manage:placeholder.select'));
            return;
        }

        var contextData = computeRelaties(ds, selectedHoofdId);
        if (!contextData.length) {
            showPlaceholder(i18nModule.t('manage:placeholder.notFound'));
            return;
        }

        tableBody.innerHTML = '';
        var renderQueue = [];

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

        // Extra partners (2e, 3e, ...)
        if (hoofd && safe(hoofd.PartnerID)) {
            hoofd.PartnerID.split('|')
                .map(function (id) { return id.trim(); })
                .filter(Boolean)
                .slice(1)                                                 // Eerste al via PHoofdID
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

        renderQueue.forEach(function (p) {
            tableBody.appendChild(buildRow(p, false));
        });

        adjustTextareas();
    }

    /* ======================= RIJ BOUWEN ======================= */
    function buildRow(p, isNew) {
        var tr = document.createElement('tr');
        if (!isNew && p.Relatie) tr.classList.add(p.Relatie);

        COLUMNS.forEach(function (col) {
            var td;

            if (col.key === 'Acties') {
                td = document.createElement('td');
                var btn = document.createElement('button');

                if (isNew) {
                    btn.textContent = i18nModule.t('manage:action.delete');
                    btn.title       = i18nModule.t('manage:action.deleteRowTitle');
                    btn.addEventListener('click', function () {
                        tr.remove();
                        tempRowCount--;
                    });
                } else {
                    btn.textContent = i18nModule.t('manage:action.delete');
                    btn.title       = i18nModule.t('manage:action.deleteTitle');
                    btn.addEventListener('click', makeDeleteHandler(tr, function () { return safe(p.ID); }));
                }

                td.appendChild(btn);

            } else if (col.key === 'Relatie') {
                td = document.createElement('td');
                td.textContent = isNew ? '' : relatieLabel(p.Relatie);

            } else if (col.readonly) {
                td = document.createElement('td');
                td.textContent = isNew ? '' : (p[col.key] || '');

            } else if (MULTI_ID_FIELDS.indexOf(col.key) !== -1) {
                td = buildMultiIDCell(col.key, isNew ? '' : (p[col.key] || ''));

            } else {
                td = document.createElement('td');
                var ta = document.createElement('textarea');
                ta.value           = isNew ? '' : (p[col.key] || '');
                ta.dataset.field   = col.key;
                ta.style.width     = '100%';
                ta.style.boxSizing = 'border-box';
                ta.style.resize    = 'vertical';
                td.appendChild(ta);
            }

            tr.appendChild(td);
        });

        return tr;
    }

    /* ======================= PLACEHOLDER ======================= */
    function showPlaceholder(msg) {
        tableBody.innerHTML = '';
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        td.colSpan         = COLUMNS.length;
        td.textContent     = msg;
        td.style.textAlign = 'center';
        tr.appendChild(td);
        tableBody.appendChild(tr);
    }

    /* ======================= NIEUWE RIJ TOEVOEGEN ======================= */
    function addRow() {
        if (tempRowCount >= 10) {
            alert(i18nModule.t('manage:alert.maxRows'));
            return;
        }

        var tr = buildRow({}, true);
        tableBody.appendChild(tr);
        tempRowCount++;
        adjustTextareas();
    }

    /* ======================= DATASET OPSLAAN ======================= */
    function saveDatasetMerged() {
        try {
            var rows  = tableBody.querySelectorAll('tr');
            var idMap = new Map(dataset.map(function (p) { return [p.ID, p]; }));

            rows.forEach(function (tr) {
                var persoon = {};

                COLUMNS.forEach(function (col, i) {
                    var cell = tr.cells[i];
                    if (!cell) return;

                    if (col.readonly) {
                        if (col.key === 'ID') {
                            persoon.ID = safe(cell.textContent);
                        }
                    } else if (MULTI_ID_FIELDS.indexOf(col.key) !== -1) {
                        persoon[col.key] = readMultiIDCell(cell);        // |-gescheiden string
                    } else {
                        var ta = cell.querySelector('textarea');
                        persoon[col.key] = ta ? ta.value.trim() : '';
                    }
                });

                if (!persoon.ID) {
                    persoon.ID = window.genereerCode(
                        persoon,
                        Array.from(idMap.values())
                    );
                }

                idMap.set(persoon.ID, Object.assign(
                    {},
                    idMap.get(persoon.ID) || {},
                    persoon
                ));
            });

            dataset = Array.from(idMap.values());
            StamboomStorage.set(dataset);
            tempRowCount = 0;
            alert(i18nModule.t('manage:alert.saved'));
        } catch (e) {
            alert(i18nModule.t('manage:alert.saveFailed', { error: e.message }));
        }
    }

    /* ======================= EXPORT JSON ======================= */
    function exportJSON() {
        var data = JSON.stringify(dataset, null, 2);
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
        // buildHeader() wordt NIET hier aangeroepen —
        // manage.html roept window.ManageTable.buildHeader() aan
        // ná loadNamespace('manage') in de .then()-chain

        // languageChanged: namespace is al herladen door i18n.js
        // voordat dit event vuurt, dus t() geeft direct correcte strings
        i18next.on('languageChanged', function () {
            buildHeader();                                               // Headers hertekenen bij taalwissel
        });

        showPlaceholder(i18nModule.t('manage:placeholder.select'));      // Beginmelding — werkt pas correct als namespace geladen is

        addBtn.addEventListener('click', addRow);
        saveBtn.addEventListener('click', saveDatasetMerged);
        refreshBtn.addEventListener('click', function () {
            if (selectedHoofdId) {
                renderTable(dataset);
            } else {
                showPlaceholder(i18nModule.t('manage:placeholder.select'));
            }
        });

        if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportJSON);
        if (exportCsvBtn)  exportCsvBtn.addEventListener('click',  exportCSV);

        if (typeof initLiveSearch === 'function') {
            initLiveSearch(searchInput, dataset, function (selectedID) {
                selectedHoofdId = selectedID;
                renderTable(dataset);
            });

            document.addEventListener('click', function (e) {
                var popup = document.getElementById('searchPopup');
                if (popup && !popup.contains(e.target) && e.target !== searchInput) {
                    popup.remove();
                }
            });
        }
    }

    init();                                                              // Start initialisatie

    /* ======================= PUBLIEKE API ======================= */
    // Exposed zodat manage.html buildHeader() kan aanroepen
    // ná loadNamespace('manage') — consistent met window.RelatieEngine, window.StamboomSchema
    window.ManageTable = {
        buildHeader: buildHeader                                         // Enige publieke functie
    };

})();
