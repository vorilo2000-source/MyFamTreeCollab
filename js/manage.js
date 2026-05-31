/* ======================= js/manage.js v2.7.0 =======================
   Beheerpagina: toont stamboom als tabel, live search, add/save/refresh
   Vereist: schema.js, idGenerator.js, storage.js, LiveSearch.js, relatieEngine.js, colorHelper.js

   Wijziging v2.7.0 (sessie 36):
   - Kleurgradiënt voor meerdere VaderID/MoederID/PartnerID rijen
   - buildRow() krijgt colorIndex parameter mee
   - ColorHelper.applyRelationColor() past achtergrondkleur toe op tabelrij
   - renderTable() geeft juiste index mee per relatietype en volgorde

   Wijziging v2.6.1 (bugfix headers):
   - buildHeader() exposed via window.ManageTable
   - showPlaceholder() uit init() gehaald

   Wijziging v2.6.0 (F3-48):
   - VaderID, MoederID, PartnerID dynamische lijsten
   =================================================================== */

(function () {
    'use strict';

    var safe          = window.ftSafe;
    var parsePartners = window.StamboomSchema.parsePartners;               // | splitter voor index berekening

    var MULTI_ID_FIELDS = ['VaderID', 'MoederID', 'PartnerID'];

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

    var dataset         = StamboomStorage.get();
    var selectedHoofdId = null;
    var tempRowCount    = 0;

    var tableBody     = document.querySelector('#manageTable tbody');
    var theadRow      = document.querySelector('#manageTable thead tr');
    var addBtn        = document.getElementById('addBtn');
    var saveBtn       = document.getElementById('saveBtn');
    var refreshBtn    = document.getElementById('refreshBtn');
    var exportJsonBtn = document.getElementById('exportJson');
    var exportCsvBtn  = document.getElementById('exportCsv');
    var searchInput   = document.getElementById('searchPerson');

    function buildHeader() {
        theadRow.innerHTML = '';
        COLUMNS.forEach(function (col) {
            var th = document.createElement('th');
            th.textContent = i18nModule.t(col.i18nKey);
            theadRow.appendChild(th);
        });
    }

    var computeRelaties = window.RelatieEngine.computeRelaties;

    function adjustTextareas() {
        tableBody.querySelectorAll('textarea').forEach(function (ta) {
            ta.style.height = 'auto';
            var maxH = 120;
            if (ta.scrollHeight > maxH) {
                ta.style.height    = maxH + 'px';
                ta.style.overflowY = 'auto';
            } else {
                ta.style.height    = ta.scrollHeight + 'px';
                ta.style.overflowY = 'hidden';
            }
        });
    }

    function buildMultiIDCell(fieldKey, currentValue) {
        var td = document.createElement('td');
        td.dataset.multiField = fieldKey;

        var wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;min-width:120px';

        var ids = window.StamboomSchema.parsePartners(currentValue || '');
        if (ids.length === 0) { ids = ['']; }

        ids.forEach(function (idValue) {
            wrapper.appendChild(buildMultiIDRow(idValue, wrapper));
        });

        var addIdBtn = document.createElement('button');
        addIdBtn.type        = 'button';
        addIdBtn.textContent = '+ ID';
        addIdBtn.title       = 'Extra ID toevoegen';
        addIdBtn.style.cssText = 'margin-top:2px;padding:2px 6px;font-size:0.8rem;cursor:pointer;background:#28a745;color:#fff;border:none;border-radius:3px;align-self:flex-start';

        addIdBtn.addEventListener('click', function () {
            wrapper.insertBefore(buildMultiIDRow('', wrapper), addIdBtn);
        });

        wrapper.appendChild(addIdBtn);
        td.appendChild(wrapper);
        return td;
    }

    function buildMultiIDRow(idValue, wrapper) {
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:4px;align-items:center';

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
            var allRows = wrapper.querySelectorAll('div');
            if (allRows.length > 1) {
                wrapper.removeChild(row);
            } else {
                input.value = '';
            }
        });

        row.appendChild(input);
        row.appendChild(removeBtn);
        return row;
    }

    function readMultiIDCell(td) {
        var inputs = td.querySelectorAll('input.multi-id-input');
        var values = [];
        inputs.forEach(function (input) {
            var val = input.value.trim();
            if (val) values.push(val);
        });
        return window.StamboomSchema.stringifyPartners(values);
    }

    function makeDeleteHandler(tr, getID) {
        return function () {
            if (!confirm(i18nModule.t('manage:confirm.delete'))) return;
            var id = getID();
            if (id) {
                dataset = dataset.filter(function (x) { return safe(x.ID) !== id; });
                dataset = dataset.map(function (x) {
                    var updated = Object.assign({}, x);
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
                StamboomStorage.set(dataset);
            }
            tr.remove();
        };
    }

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
        var renderQueue = [];                                              // {persoon, colorIndex}

        // Hoofdpersoon
        var hoofd = contextData.find(function (p) { return p.Relatie === 'HoofdID'; });

        // Ouders van hoofdpersoon — index op basis van positie in VaderID/MoederID
        var hoofdVaderIDs  = parsePartners(hoofd ? hoofd.VaderID  || '' : '');
        var hoofdMoederIDs = parsePartners(hoofd ? hoofd.MoederID || '' : '');
        var hoofdPartners  = parsePartners(hoofd ? hoofd.PartnerID || '' : '');

        contextData
            .filter(function (p) { return p.Relatie === 'VHoofdID' || p.Relatie === 'MHoofdID'; })
            .forEach(function (p) {
                // Index = positie in de |-lijst van de hoofdpersoon
                var idxV = hoofdVaderIDs.indexOf(safe(p.ID));
                var idxM = hoofdMoederIDs.indexOf(safe(p.ID));
                var colorIndex = idxV !== -1 ? idxV : (idxM !== -1 ? idxM : 0);
                renderQueue.push({ p: p, colorIndex: colorIndex });
            });

        if (hoofd) renderQueue.push({ p: hoofd, colorIndex: 0 });         // Hoofdpersoon altijd index 0

        // Eerste partner via relatieEngine
        contextData
            .filter(function (p) { return p.Relatie === 'PHoofdID'; })
            .forEach(function (p) {
                var idx = hoofdPartners.indexOf(safe(p.ID));
                renderQueue.push({ p: p, colorIndex: idx !== -1 ? idx : 0 });
            });

        // Extra partners (2e, 3e, ...)
        if (hoofd && safe(hoofd.PartnerID)) {
            hoofd.PartnerID.split('|')
                .map(function (id) { return id.trim(); })
                .filter(Boolean)
                .slice(1)
                .forEach(function (pid, sliceIdx) {
                    var ep = dataset.find(function (p) { return safe(p.ID) === pid; });
                    if (ep) renderQueue.push({
                        p: Object.assign({}, ep, { Relatie: 'PHoofdID' }),
                        colorIndex: sliceIdx + 1                           // slice(1) → index start bij 1
                    });
                });
        }

        // Kinderen + hun partners
        contextData
            .filter(function (p) { return ['KindID', 'HKindID', 'PHKindID'].includes(p.Relatie); })
            .forEach(function (k) {
                renderQueue.push({ p: k, colorIndex: 0 });                // Kind altijd index 0
                if (safe(k.PartnerID)) {
                    var kindPartners = parsePartners(k.PartnerID);
                    kindPartners.forEach(function (pid, idx) {
                        var kp = dataset.find(function (p) { return safe(p.ID) === pid; });
                        if (kp) renderQueue.push({
                            p: Object.assign({}, kp, { Relatie: 'Partner' }),
                            colorIndex: idx                                // Index op basis van positie in lijst
                        });
                    });
                }
            });

        // Broers/zussen + hun partners
        contextData
            .filter(function (p) { return p.Relatie === 'BZID'; })
            .forEach(function (s) {
                renderQueue.push({ p: s, colorIndex: 0 });
                if (safe(s.PartnerID)) {
                    var bzPartners = parsePartners(s.PartnerID);
                    bzPartners.forEach(function (pid, idx) {
                        var bzP = dataset.find(function (p) { return safe(p.ID) === pid; });
                        if (bzP) renderQueue.push({
                            p: Object.assign({}, bzP, { Relatie: 'Partner' }),
                            colorIndex: idx
                        });
                    });
                }
            });

        renderQueue.forEach(function (item) {
            tableBody.appendChild(buildRow(item.p, false, item.colorIndex));
        });

        adjustTextareas();
    }

    /* ======================= RIJ BOUWEN =======================
     * colorIndex: volgorde-index voor kleurgradiënt (0 = basiskleur)
     */
    function buildRow(p, isNew, colorIndex) {
        var tr = document.createElement('tr');

        if (!isNew && p.Relatie) {
            tr.classList.add(p.Relatie);                                   // CSS klasse voor basiskleur

            // Kleurgradiënt toepassen voor index 1 en hoger
            if (colorIndex > 0 && window.ColorHelper) {
                window.ColorHelper.applyRelationColor(tr, p.Relatie, colorIndex); // Lichtere tint op rij
            }
        }

        COLUMNS.forEach(function (col) {
            var td;

            if (col.key === 'Acties') {
                td = document.createElement('td');
                var btn = document.createElement('button');
                if (isNew) {
                    btn.textContent = i18nModule.t('manage:action.delete');
                    btn.title       = i18nModule.t('manage:action.deleteRowTitle');
                    btn.addEventListener('click', function () { tr.remove(); tempRowCount--; });
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

    function addRow() {
        if (tempRowCount >= 10) {
            alert(i18nModule.t('manage:alert.maxRows'));
            return;
        }
        var tr = buildRow({}, true, 0);                                    // Nieuwe rijen altijd index 0
        tableBody.appendChild(tr);
        tempRowCount++;
        adjustTextareas();
    }

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
                        if (col.key === 'ID') persoon.ID = safe(cell.textContent);
                    } else if (MULTI_ID_FIELDS.indexOf(col.key) !== -1) {
                        persoon[col.key] = readMultiIDCell(cell);
                    } else {
                        var ta = cell.querySelector('textarea');
                        persoon[col.key] = ta ? ta.value.trim() : '';
                    }
                });

                if (!persoon.ID) {
                    persoon.ID = window.genereerCode(persoon, Array.from(idMap.values()));
                }

                idMap.set(persoon.ID, Object.assign({}, idMap.get(persoon.ID) || {}, persoon));
            });

            dataset = Array.from(idMap.values());
            StamboomStorage.set(dataset);
            tempRowCount = 0;
            alert(i18nModule.t('manage:alert.saved'));
        } catch (e) {
            alert(i18nModule.t('manage:alert.saveFailed', { error: e.message }));
        }
    }

    function exportJSON() {
        var data = JSON.stringify(dataset, null, 2);
        var blob = new Blob([data], { type: 'application/json' });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href = url; a.download = 'stamboom.json'; a.click();
        URL.revokeObjectURL(url);
    }

    function exportCSV() {
        var headers = COLUMNS.map(function (c) { return c.key; }).join(',');
        var rows    = dataset.map(function (p) {
            return COLUMNS.map(function (c) { return '"' + (p[c.key] || '').replace(/"/g, '""') + '"'; }).join(',');
        }).join('\n');
        var csv  = headers + '\n' + rows;
        var blob = new Blob([csv], { type: 'text/csv' });
        var url  = URL.createObjectURL(blob);
        var a    = document.createElement('a');
        a.href = url; a.download = 'stamboom.csv'; a.click();
        URL.revokeObjectURL(url);
    }

    function init() {
        i18next.on('languageChanged', function () { buildHeader(); });

        addBtn.addEventListener('click', addRow);
        saveBtn.addEventListener('click', saveDatasetMerged);
        refreshBtn.addEventListener('click', function () {
            if (selectedHoofdId) renderTable(dataset);
            else showPlaceholder(i18nModule.t('manage:placeholder.select'));
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
                if (popup && !popup.contains(e.target) && e.target !== searchInput) popup.remove();
            });
        }
    }

    init();

    window.ManageTable = {
        buildHeader:     buildHeader,
        showPlaceholder: showPlaceholder
    };

})();
