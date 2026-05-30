/* ======================= js/manage.js v2.6.1 =======================
   Beheerpagina: toont stamboom als tabel, live search, add/save/refresh
   Vereist: schema.js, idGenerator.js, storage.js, LiveSearch.js, relatieEngine.js

   Wijziging v2.6.1 (bugfix headers):
   - buildHeader() verwijderd uit init() — werd aangeroepen vóór namespace geladen
   - window.ManageTable.buildHeader() exposed voor aanroep vanuit manage.html .then()-chain
   - showPlaceholder() in init() vervangen door lege tbody (namespace nog niet geladen)
   - showPlaceholder() correct aangeroepen vanuit manage.html na loadNamespace()

   Wijziging v2.6.0 (F3-48):
   - VaderID, MoederID, PartnerID: dynamische lijsten met add/remove knoppen
   - buildMultiIDCell(), buildMultiIDRow(), readMultiIDCell()
   - buildRow(p, isNew): centrale rij-bouwer
   - makeDeleteHandler(): cleanup via parsePartners()/stringifyPartners()

   Wijziging v2.5.1 (sessie 27):
   - COLUMNS uitgebreid met i18nKey per kolom
   - buildHeader() gebruikt i18nModule.t(col.i18nKey)
   - i18next.on('languageChanged'): headers herladen bij taalwisseling

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
    var COLUMNS = [
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
    // Niet vanuit init() — namespace is dan nog niet geladen
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

        wrapper.appendChild(addIdBtn);
        td.appendChild(wrapper);
        return td;
    }

    /* ======================= MULTI-ID INVOER-RIJ BOUWEN ======================= */
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

        row.appendChild(input);
        row.appendChild(removeBtn);
        return row;
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
                                    .filter(function (s) { return s !== id; })
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
        if (!isNew && p.Relatie) tr.classList.add(p.Relatie);           // CSS kleurklasse op relatie

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
                            persoon.ID = safe(cell.textContent);         // ID uit readonly cel
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
        // buildHeader() en showPlaceholder() worden NIET hier aangeroepen —
        // beide vereisen de manage-namespace die nog niet geladen is op dit moment.
        // manage.html roept window.ManageTable.buildHeader() en
        // window.ManageTable.showPlaceholder() aan ná loadNamespace('manage').

        // languageChanged: i18n.js herlaadt namespace vóór dit event vuurt
        // zodat t() al correcte strings geeft bij hertekenen
        i18next.on('languageChanged', function () {
            buildHeader();                                               // Headers hertekenen bij taalwissel
        });

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

    init();

    /* ======================= PUBLIEKE API ======================= */
    // Exposed via window.ManageTable zodat manage.html beide functies kan aanroepen
    // ná loadNamespace('manage') — consistent met window.RelatieEngine, window.StamboomSchema
    window.ManageTable = {
        buildHeader:     buildHeader,                                    // Headers bouwen na namespace load
        showPlaceholder: showPlaceholder                                 // Beginmelding na namespace load
    };

})();
