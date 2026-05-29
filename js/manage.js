/* ======================= js/manage.js v2.6.0 =======================
   Beheerpagina: toont stamboom als tabel, live search, add/save/refresh
   Vereist: schema.js, idGenerator.js, storage.js, LiveSearch.js, relatieEngine.js

   Wijziging v2.6.0 (sessie F3-48):
   - VaderID, MoederID en PartnerID zijn nu dynamische lijsten met add/remove knoppen
   - buildMultiIDCell() bouwt de widget: één input per ID, + knop, × knop per rij
   - readMultiIDCell() leest de widget uit en retourneert |-gescheiden string
   - makeDeleteHandler() cleanup uitgebreid: VaderID en MoederID ook via | split
   - saveDatasetMerged() en addRow() gebruiken de nieuwe widget

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

   Wijziging v2.3.2:
   - Delete-knop werkt op alle bestaande rijen
   - Delete cleanup: verwijderd ID gewist uit VaderID, MoederID, PartnerID

   Scripts: utils.js → schema.js → idGenerator.js → storage.js → auth.js →
            siteAnalytics.js → shareModule.js → accessGuard.js → LiveSearch.js →
            relatieEngine.js → manage.js (verplichte volgorde)
   =================================================================== */

(function () {                                                              // Zelfuitvoerende functie: alle variabelen blijven lokaal
    'use strict';                                                           // Strikte modus: voorkomt stille JS-fouten

    /* ======================= HELPERS ======================= */
    var safe = window.ftSafe;                                              // Centrale safe() uit utils.js

    /* ======================= MULTI-ID VELDEN ======================= */
    // Velden die meerdere waarden opslaan via | als scheidingsteken
    var MULTI_ID_FIELDS = ['VaderID', 'MoederID', 'PartnerID'];           // Alle drie behandeld als dynamische lijst

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

    /* ======================= MULTI-ID WIDGET BOUWEN ======================= */
    // Bouwt een bewerkbare lijst van ID-invoervelden in een <td>
    // fieldKey: naam van het veld (bv. 'PartnerID') — wordt opgeslagen als data-field
    // currentValue: huidige |-gescheiden string (bv. "P002|P005") of leeg
    // Retourneert: het ingevulde <td> element

    function buildMultiIDCell(fieldKey, currentValue) {
        var td = document.createElement('td');                           // Container cel

        // data-field op de cel zelf: gebruikt door readMultiIDCell() bij opslaan
        td.dataset.multiField = fieldKey;                                // Markeer cel als multi-ID widget

        // Wrapper div voor de hele widget
        var wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:flex;flex-direction:column;gap:4px;min-width:120px'; // verticale lijst

        // Splits huidige waarde op | — filter lege strings
        var ids = window.StamboomSchema.parsePartners(currentValue || ''); // ['P002','P005'] of []

        // Als er geen waarden zijn toch één lege rij tonen zodat de gebruiker kan beginnen typen
        if (ids.length === 0) {
            ids = [''];                                                   // Eén lege invoer als startpunt
        }

        // Bouw één invoer-rij per bestaand ID
        ids.forEach(function (idValue) {
            wrapper.appendChild(buildMultiIDRow(idValue, wrapper));      // Voeg rij toe aan wrapper
        });

        // "+ Toevoegen" knop onderaan de lijst
        var addIdBtn = document.createElement('button');
        addIdBtn.type        = 'button';                                 // Geen form submit
        addIdBtn.textContent = '+ ID';                                   // Korte label
        addIdBtn.title       = 'Extra ID toevoegen';                     // Tooltip
        addIdBtn.style.cssText = [
            'margin-top:2px',
            'padding:2px 6px',
            'font-size:0.8rem',
            'cursor:pointer',
            'background:#28a745',
            'color:#fff',
            'border:none',
            'border-radius:3px',
            'align-self:flex-start'                                      // Knop niet uitstrekken over volle breedte
        ].join(';');

        addIdBtn.addEventListener('click', function () {
            // Voeg nieuwe lege invoer-rij in vóór de "+ ID" knop
            wrapper.insertBefore(buildMultiIDRow('', wrapper), addIdBtn); // Nieuw leeg veld
        });

        wrapper.appendChild(addIdBtn);                                   // Knop als laatste element
        td.appendChild(wrapper);                                         // Widget in cel
        return td;                                                       // Retourneer ingevulde cel
    }

    /* ======================= MULTI-ID INVOER-RIJ BOUWEN ======================= */
    // Bouwt één rij: [input veld] [× knop]
    // idValue: initiële waarde van het invoerveld
    // wrapper: de parent div — nodig voor verwijdering
    // Retourneert: de rij als <div>

    function buildMultiIDRow(idValue, wrapper) {
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:4px;align-items:center';  // Horizontale rij

        // Invoerveld voor één ID
        var input = document.createElement('input');
        input.type        = 'text';                                      // Tekst invoer
        input.value       = idValue;                                     // Huidige waarde
        input.placeholder = 'ID...';                                     // Hint voor gebruiker
        input.className   = 'multi-id-input';                            // CSS klasse voor styling
        input.style.cssText = [
            'flex:1',                                                    // Neemt beschikbare breedte
            'padding:3px 6px',
            'font-size:0.88rem',
            'border:1px solid #ccc',
            'border-radius:3px',
            'box-sizing:border-box'
        ].join(';');

        // Verwijder-knop voor deze specifieke rij
        var removeBtn = document.createElement('button');
        removeBtn.type        = 'button';                                // Geen form submit
        removeBtn.textContent = '×';                                     // Kruisje
        removeBtn.title       = 'Verwijder dit ID';                      // Tooltip
        removeBtn.style.cssText = [
            'padding:2px 6px',
            'font-size:0.9rem',
            'cursor:pointer',
            'background:#dc3545',
            'color:#fff',
            'border:none',
            'border-radius:3px',
            'line-height:1'
        ].join(';');

        removeBtn.addEventListener('click', function () {
            // Verwijder deze rij uit de wrapper
            // Laat altijd minstens één rij staan zodat het veld leeggemaakt kan worden
            var allRows = wrapper.querySelectorAll('div');               // Alle invoer-rijen in de widget
            if (allRows.length > 1) {
                wrapper.removeChild(row);                                // Rij verwijderen
            } else {
                input.value = '';                                        // Laatste rij: alleen leegmaken
            }
        });

        row.appendChild(input);                                          // Input in rij
        row.appendChild(removeBtn);                                      // Knop in rij
        return row;                                                      // Retourneer de rij
    }

    /* ======================= MULTI-ID WIDGET UITLEZEN ======================= */
    // Leest alle invoervelden uit een multi-ID cel en retourneert |-gescheiden string
    // td: de <td> met data-multiField attribuut

    function readMultiIDCell(td) {
        var inputs = td.querySelectorAll('input.multi-id-input');        // Alle invoervelden in de widget
        var values = [];                                                  // Verzamelde waarden

        inputs.forEach(function (input) {
            var val = input.value.trim();                                // Trimmed waarde
            if (val) values.push(val);                                   // Alleen niet-lege waarden bewaren
        });

        return window.StamboomSchema.stringifyPartners(values);          // Samenvoegen met | als scheidingsteken
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
                // VaderID, MoederID en PartnerID worden alle drie via | gesplitst
                dataset = dataset.map(function (x) {
                    var updated = Object.assign({}, x);                  // Ondiepe kopie

                    // VaderID: verwijder het gedelete ID uit de |-lijst
                    if (safe(updated.VaderID)) {
                        updated.VaderID = window.StamboomSchema.stringifyPartners(
                            window.StamboomSchema.parsePartners(updated.VaderID)
                                .filter(function (s) { return s !== id; }) // Verwijder gedelete ID
                        );
                    }

                    // MoederID: zelfde aanpak als VaderID
                    if (safe(updated.MoederID)) {
                        updated.MoederID = window.StamboomSchema.stringifyPartners(
                            window.StamboomSchema.parsePartners(updated.MoederID)
                                .filter(function (s) { return s !== id; }) // Verwijder gedelete ID
                        );
                    }

                    // PartnerID: zelfde aanpak
                    if (safe(updated.PartnerID)) {
                        updated.PartnerID = window.StamboomSchema.stringifyPartners(
                            window.StamboomSchema.parsePartners(updated.PartnerID)
                                .filter(function (s) { return s !== id; }) // Verwijder gedelete ID
                        );
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
            tableBody.appendChild(buildRow(p, false));                   // Bouw rij voor bestaande persoon
        });

        adjustTextareas();                                               // Hoogte textareas aanpassen
    }

    /* ======================= RIJ BOUWEN (bestaand of nieuw) ======================= */
    // Centrale functie voor het bouwen van een tabelrij
    // p: persoonsobject (of leeg object voor nieuwe rij)
    // isNew: true = nieuwe rij (geen ID, delete zonder confirm)

    function buildRow(p, isNew) {
        var tr = document.createElement('tr');                           // Nieuwe tabelrij

        // CSS-kleurklasse op basis van relatie (alleen voor bestaande rijen)
        if (!isNew && p.Relatie) tr.classList.add(p.Relatie);

        COLUMNS.forEach(function (col) {
            var td;                                                       // Cel variabele

            if (col.key === 'Acties') {
                // Delete-knop
                td = document.createElement('td');
                var btn = document.createElement('button');

                if (isNew) {
                    // Nieuwe rij: simpele DOM-verwijdering, geen confirm
                    btn.textContent = i18nModule.t('manage:action.delete');
                    btn.title       = i18nModule.t('manage:action.deleteRowTitle');
                    btn.addEventListener('click', function () {
                        tr.remove();                                     // Verwijder rij uit DOM
                        tempRowCount--;                                  // Teller verlagen
                    });
                } else {
                    // Bestaande rij: delete met confirm en dataset-cleanup
                    btn.textContent = i18nModule.t('manage:action.delete');
                    btn.title       = i18nModule.t('manage:action.deleteTitle');
                    btn.addEventListener('click', makeDeleteHandler(tr, function () { return safe(p.ID); }));
                }

                td.appendChild(btn);

            } else if (col.key === 'Relatie') {
                // Relatie-kolom: vertaald label
                td = document.createElement('td');
                td.textContent = isNew ? '' : relatieLabel(p.Relatie);  // Leeg voor nieuwe rij

            } else if (col.readonly) {
                // Readonly kolommen (ID)
                td = document.createElement('td');
                td.textContent = isNew ? '' : (p[col.key] || '');       // Leeg voor nieuwe rij

            } else if (MULTI_ID_FIELDS.indexOf(col.key) !== -1) {
                // Multi-ID veld: dynamische widget met add/remove knoppen
                td = buildMultiIDCell(col.key, isNew ? '' : (p[col.key] || ''));

            } else {
                // Gewone bewerkbare cel: textarea
                td = document.createElement('td');
                var ta = document.createElement('textarea');
                ta.value           = isNew ? '' : (p[col.key] || '');   // Leeg voor nieuwe rij
                ta.dataset.field   = col.key;                            // Veldnaam voor opslaan
                ta.style.width     = '100%';
                ta.style.boxSizing = 'border-box';
                ta.style.resize    = 'vertical';
                td.appendChild(ta);
            }

            tr.appendChild(td);                                          // Cel toevoegen aan rij
        });

        return tr;                                                       // Retourneer de volledige rij
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

        var tr = buildRow({}, true);                                     // Bouw lege rij via centrale buildRow()
        tableBody.appendChild(tr);                                       // Toevoegen aan tabel
        tempRowCount++;                                                  // Teller verhogen
        adjustTextareas();                                               // Hoogte aanpassen
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
                        // Relatie-kolom en Acties-kolom worden niet opgeslagen

                    } else if (MULTI_ID_FIELDS.indexOf(col.key) !== -1) {
                        // Multi-ID widget: uitlezen via readMultiIDCell()
                        persoon[col.key] = readMultiIDCell(cell);        // |-gescheiden string

                    } else {
                        // Gewone textarea
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
