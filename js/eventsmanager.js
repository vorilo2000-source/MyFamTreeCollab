/* ======================= js/eventsmanager.js v0.9.2 =======================
   Beheerpagina: toont stamboom als tabel, live search, add/save/refresh
   Vereist: schema.js, idGenerator.js, storage.js, LiveSearch.js,
            relatieEngine.js, colorHelper.js

   Wijziging v0.9.0:
   - Bronnen per event als meerdere { name, url } links beheren
   - Bronnen toevoegen, wijzigen en verwijderen vanuit Event Manager
   - Klikbare bronnaam als preview in de Bronnen-kolom

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
    var COLUMNS = [                                                        // Persoonskolommen + eventkolommen
        { key: 'ID',                i18nKey: 'eventsmanager:table.id',                readonly: true  },
        { key: 'Doopnaam',          i18nKey: 'eventsmanager:table.doopnaam',          readonly: false },
        { key: 'Roepnaam',          i18nKey: 'eventsmanager:table.roepnaam',          readonly: false },
        { key: 'Prefix',            i18nKey: 'eventsmanager:table.prefix',            readonly: false },
        { key: 'Achternaam',        i18nKey: 'eventsmanager:table.achternaam',        readonly: false },
        { key: 'Geslacht',          i18nKey: 'eventsmanager:table.geslacht',          readonly: false },
        { key: 'Geboortedatum',     i18nKey: 'eventsmanager:table.geboortedatum',     readonly: false },
        { key: 'id',                i18nKey: 'Event ID',                        readonly: true  },
        { key: 'type',              i18nKey: 'Type',                            readonly: false },
        { key: 'title',             i18nKey: 'Titel',                           readonly: false },
        { key: 'start_date',        i18nKey: 'Startdatum',                      readonly: false },
        { key: 'end_date',          i18nKey: 'Einddatum',                       readonly: false },
        { key: 'place',             i18nKey: 'Plaats',                          readonly: false },
        { key: 'participants',      i18nKey: 'Deelnemers',                      readonly: false },
        { key: 'sources',           i18nKey: 'Bronnen',                         readonly: false },
        { key: 'notes',             i18nKey: 'Notities',                        readonly: false },
    ];

    /* ======================= EVENT TYPES ======================= */
    var EVENT_TYPES = [                                                   // Vaste keuzelijst voor de kolom Type.
        'Geboorte',                                                       // Vast basis-event op Event ID -001.
        'Religie',                                                        // Doop, eerste communie, vormsel, enz.
        'Relatie',                                                        // Samenwonen en andere relatiegebeurtenissen.
        'Huwelijk',                                                       // Burgerlijk, kerkelijk, enz.
        'Scheiding',                                                      // Scheiding of beëindiging huwelijk.
        'Diploma',                                                        // Diploma's en opleidingen.
        'Loopbaan',                                                       // Werk, beroep en loopbaangebeurtenissen.
        'Pensioen',                                                       // Pensionering.
        'Verhuizing',                                                     // Verandering van woonplaats.
        'Migratie',                                                       // Immigratie of emigratie.
        'Overlijden',                                                     // Akte, begrafenis, crematie, enz.
        'Anders'                                                          // Overige gebeurtenissen.
    ];

    var COLUMN_MIN_WIDTHS = {                                             // Minimale breedtes voor de gevraagde eventkolommen.
        type: '130px',                                                    // Breed genoeg om Verhuizing volledig te tonen.
        title: '210px',                                                   // Iets compacter, maar voldoende voor een normale titel.
        place: '150px',                                                   // Breed genoeg voor bijvoorbeeld 's-Hertogenbosch.
        participants: '220px',                                            // Meer ruimte voor meerdere deelnemers onder elkaar.
        sources: '260px',                                                 // Bestaande breedte behouden.
        notes: '260px'                                                    // Bestaande breedte behouden.
    };

    /* ======================= STATE ======================= */
    var dataset         = StamboomStorage.get();                          // Volledige stamboom-dataset uit localStorage

    if (window.EventStorage && typeof EventStorage.importFromStamboom === 'function') { // Gebruik de bestaande EventStorage-import wanneer beschikbaar.
        EventStorage.importFromStamboom(dataset);                          // Voeg alleen ontbrekende -001 Geboorte- en -002 Overlijden-events toe.
    }
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
    // Aangeropen vanuit eventsmanager.html .then()-chain, ná loadNamespace('eventsmanager')
    function buildHeader() {
        theadRow.innerHTML = '';                                          // Verwijder bestaande kolomkoppen
        COLUMNS.forEach(function (col) {                                  // Loop door elke kolom-definitie
            var th = document.createElement('th');                       // Maak nieuw <th> element
            th.textContent = i18nModule.t(col.i18nKey);                  // Vertaalde kolomnaam via namespace
            if (COLUMN_MIN_WIDTHS[col.key]) {                            // Alleen de gevraagde eventkolommen verbreden.
                th.style.minWidth = COLUMN_MIN_WIDTHS[col.key];          // Pas dezelfde minimale breedte toe op de kolomkop.
            }
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

    /* ======================= BRONNEN WIDGET ======================= */
    function normalizeSourceForManager(source) {
        if (typeof source === 'string') {                                  // Ondersteun bestaande tekstbronnen.
            var legacy = source.trim();
            if (!legacy) return null;
            return {
                name: legacy,
                url: /^https?:\/\//i.test(legacy) ? legacy : ''
            };
        }

        if (!source || typeof source !== 'object') return null;

        var name = source.name == null ? '' : String(source.name).trim();
        var url = source.url == null ? '' : String(source.url).trim();
        if (!name && !url) return null;

        return {
            name: name || url,
            url: url
        };
    }

    function buildSourceRow(source, wrapper) {
        var normalized = normalizeSourceForManager(source) || { name: '', url: '' };
        var row = document.createElement('div');
        row.className = 'source-entry';
        row.style.cssText = 'display:grid;grid-template-columns:minmax(120px,0.8fr) minmax(180px,1.2fr) auto;gap:4px;align-items:center';

        var nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'source-name-input';
        nameInput.value = normalized.name;
        nameInput.placeholder = i18nModule.t('eventsmanager:sourcesEditor.namePlaceholder');
        nameInput.style.cssText = 'width:100%;padding:3px 6px;font-size:0.85rem;border:1px solid #ccc;border-radius:3px;box-sizing:border-box';

        var urlInput = document.createElement('input');
        urlInput.type = 'url';
        urlInput.className = 'source-url-input';
        urlInput.value = normalized.url;
        urlInput.placeholder = i18nModule.t('eventsmanager:sourcesEditor.urlPlaceholder');
        urlInput.style.cssText = 'width:100%;padding:3px 6px;font-size:0.85rem;border:1px solid #ccc;border-radius:3px;box-sizing:border-box';

        var removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = '×';
        removeBtn.title = i18nModule.t('eventsmanager:sourcesEditor.removeTitle');
        removeBtn.style.cssText = 'padding:2px 6px;font-size:0.9rem;cursor:pointer;background:#dc3545;color:#fff;border:none;border-radius:3px;line-height:1';

        var preview = document.createElement('a');
        preview.className = 'source-link-preview';
        preview.target = '_blank';
        preview.rel = 'noopener noreferrer';
        preview.style.cssText = 'grid-column:1 / 4;font-size:0.82rem;word-break:break-all';

        function updatePreview() {
            var name = nameInput.value.trim();
            var url = urlInput.value.trim();
            if (url && /^https?:\/\//i.test(url)) {
                preview.href = url;
                preview.textContent = name || url;
                preview.style.display = 'inline';
            } else {
                preview.removeAttribute('href');
                preview.textContent = '';
                preview.style.display = 'none';
            }
        }

        nameInput.addEventListener('input', updatePreview);
        urlInput.addEventListener('input', updatePreview);
        removeBtn.addEventListener('click', function () {
            wrapper.removeChild(row);
        });

        row.appendChild(nameInput);
        row.appendChild(urlInput);
        row.appendChild(removeBtn);
        row.appendChild(preview);
        updatePreview();

        return row;
    }

    function buildSourcesCell(currentSources) {
        var td = document.createElement('td');
        td.dataset.sourcesCell = 'true';

        var wrapper = document.createElement('div');
        wrapper.className = 'sources-editor';
        wrapper.style.cssText = 'display:flex;flex-direction:column;gap:6px;min-width:250px';

        var sources = Array.isArray(currentSources) ? currentSources : [];
        sources.map(normalizeSourceForManager).filter(Boolean).forEach(function (source) {
            wrapper.appendChild(buildSourceRow(source, wrapper));
        });

        var addSourceBtn = document.createElement('button');
        addSourceBtn.type = 'button';
        addSourceBtn.textContent = i18nModule.t('eventsmanager:sourcesEditor.add');
        addSourceBtn.title = i18nModule.t('eventsmanager:sourcesEditor.addTitle');
        addSourceBtn.style.cssText = 'padding:3px 8px;font-size:0.82rem;cursor:pointer;background:#28a745;color:#fff;border:none;border-radius:3px;align-self:flex-start';

        addSourceBtn.addEventListener('click', function () {
            wrapper.insertBefore(buildSourceRow({ name: '', url: '' }, wrapper), addSourceBtn);
        });

        wrapper.appendChild(addSourceBtn);
        td.appendChild(wrapper);
        return td;
    }

    function readSourcesCell(td) {
        var sources = [];

        td.querySelectorAll('.source-entry').forEach(function (row) {
            var nameInput = row.querySelector('.source-name-input');
            var urlInput = row.querySelector('.source-url-input');
            var name = nameInput ? nameInput.value.trim() : '';
            var url = urlInput ? urlInput.value.trim() : '';

            if (!name && !url) return;

            sources.push({
                name: name || url,
                url: url
            });
        });

        return sources;
    }

    /* ======================= DELETE HANDLER FACTORY ======================= */
    function makeDeleteHandler(tr, getID) {
        return function () {
            if (!confirm(i18nModule.t('eventsmanager:confirm.delete'))) return; // Bevestiging

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
            case 'MHoofdID':  return i18nModule.t('eventsmanager:rel.parent');  // Ouder
            case 'PHoofdID':
            case 'Partner':   return i18nModule.t('eventsmanager:rel.partner'); // Partner
            case 'BZID':      return i18nModule.t('eventsmanager:rel.sibling'); // Broer/Zus
            case 'HoofdID':   return i18nModule.t('eventsmanager:rel.root');    // Hoofdpersoon
            case 'KindID':
            case 'HKindID':
            case 'PHKindID':  return i18nModule.t('eventsmanager:rel.child');   // Kind
            default:          return relatie || i18nModule.t('eventsmanager:rel.unknown');
        }
    }

    /* ======================= TABEL RENDEREN ======================= */
    function renderTable(ds) {
        if (!selectedHoofdId) {                                           // Zonder geselecteerde persoon niets tonen.
            showPlaceholder(i18nModule.t('eventsmanager:placeholder.select'));    // Toon de bestaande selectiemelding.
            return;                                                       // Stop de render.
        }

        var persoon = ds.find(function (p) {                              // Zoek de geselecteerde persoon in StamboomStorage.
            return safe(p.ID) === selectedHoofdId;                        // Match exact op het bestaande persoons-ID.
        });

        if (!persoon) {                                                   // Controleer of de persoon werkelijk bestaat.
            showPlaceholder(i18nModule.t('eventsmanager:placeholder.notFound'));  // Toon de bestaande niet-gevondenmelding.
            return;                                                       // Stop de render.
        }

        tableBody.innerHTML = '';                                         // Maak de tabel leeg voor de nieuwe selectie.
        tempRowCount = 0;                                                 // Reset alleen de teller voor nieuwe kopieën.

        var opgeslagenEvents = window.EventStorage                        // Controleer of EventStorage beschikbaar is.
            ? EventStorage.get().filter(function (event) {                // Lees alle events en selecteer die van deze persoon.
                return Array.isArray(event.participants) &&               // Het event moet een deelnemerslijst hebben.
                    event.participants.some(function (participant) {      // Controleer iedere gekoppelde deelnemer.
                        return participant &&                             // De deelnemer moet bestaan.
                            safe(participant.person_id) === selectedHoofdId; // Koppel exact op het persoons-ID.
                    });
            })
            : [];                                                         // Zonder EventStorage zijn er geen opgeslagen events.

        if (opgeslagenEvents.length) {                                    // Zijn voor deze persoon al events opgeslagen?
            opgeslagenEvents.forEach(function (event) {                  // Toon ieder bestaand event als eigen tabelrij.
                var eventRij = Object.assign({}, persoon, event);         // Combineer persoonsvelden met de eventvelden.

                eventRij.participants = Array.isArray(event.participants) // Zet deelnemers om naar bewerkbare tabeltekst.
                    ? event.participants.map(function (participant) {     // Verwerk iedere opgeslagen deelnemer.
                        if (!participant) return '';                       // Ongeldige deelnemer overslaan.
                        return safe(participant.name) +                   // Toon de opgeslagen naam.
                            (participant.role ? ' (' + participant.role + ')' : ''); // Voeg rol toe als die bestaat.
                    }).filter(Boolean).join('\n')                        // Toon meerdere deelnemers elk op een eigen regel.
                    : '';                                                 // Geen deelnemers geeft een leeg veld.

                eventRij.sources = Array.isArray(event.sources)           // Houd bronnen als objecten voor de bronnen-editor.
                    ? event.sources                                       // Iedere bron bevat name + url.
                    : [];                                                 // Geen bronnen geeft een lege lijst.

                tableBody.appendChild(buildRow(eventRij, false, 0));      // Voeg het bestaande event aan de tabel toe.
            });
        } else {                                                          // Alleen wanneer nog geen event bestaat.
            var eersteEvent = Object.assign({}, persoon);                 // Kopieer de geselecteerde persoonsgegevens.
            eersteEvent.id = nextEventId(persoon.ID);                     // Ken het eerste vrije Event ID toe.
            tableBody.appendChild(buildRow(eersteEvent, false, 0));       // Toon één nieuwe lege eventrij.
        }

        adjustTextareas();                                                // Pas textarea-hoogtes aan na het renderen.
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
                    btn.textContent = i18nModule.t('eventsmanager:action.delete');
                    btn.title       = i18nModule.t('eventsmanager:action.deleteRowTitle');
                    btn.addEventListener('click', function () {
                        tr.remove();                                     // Verwijder rij uit DOM
                        tempRowCount--;                                  // Teller verlagen
                    });
                } else {
                    btn.textContent = i18nModule.t('eventsmanager:action.delete');
                    btn.title       = i18nModule.t('eventsmanager:action.deleteTitle');
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

            } else if (col.key === 'type') {
                td = document.createElement('td');                       // Maak cel voor de Type-keuzelijst.
                var select = document.createElement('select');           // Type wordt een dropdown in plaats van vrije tekst.
                select.dataset.field = col.key;                          // Veldnaam behouden voor opslaan.
                select.style.width = '100%';                             // Gebruik de volledige celbreedte.
                select.style.boxSizing = 'border-box';                   // Houd padding binnen de celbreedte.

                var emptyOption = document.createElement('option');      // Lege keuze voor een nog niet ingevuld type.
                emptyOption.value = '';                                  // Lege waarde wordt als leeg opgeslagen.
                emptyOption.textContent = '—';                           // Neutrale lege keuze.
                select.appendChild(emptyOption);                         // Voeg lege keuze als eerste optie toe.

                EVENT_TYPES.forEach(function (eventType) {               // Voeg alle definitieve eventtypes toe.
                    var option = document.createElement('option');        // Maak één optie per type.
                    option.value = eventType;                            // Opgeslagen waarde is gelijk aan het label.
                    option.textContent = eventType;                      // Toon dezelfde tekst in de dropdown.
                    select.appendChild(option);                          // Voeg optie toe aan de keuzelijst.
                });

                select.value = isNew ? '' : (p[col.key] || '');           // Herstel bestaand type of laat nieuwe rij leeg.
                td.appendChild(select);                                  // Plaats de dropdown in de tabelcel.

            } else if (col.key === 'sources') {
                td = buildSourcesCell(isNew ? [] : p[col.key]);           // Meerdere benoemde links beheren in één event.

            } else {
                td = document.createElement('td');
                var ta = document.createElement('textarea');
                ta.value           = isNew ? '' : (p[col.key] || '');
                ta.dataset.field   = col.key;                            // Veldnaam voor opslaan
                ta.style.width     = '100%';
                ta.style.boxSizing = 'border-box';
                ta.style.resize    = 'vertical';
                if (col.key === 'participants') {                        // Deelnemers mogen meerdere namen onder elkaar bevatten.
                    ta.rows = 3;                                          // Toon standaard meerdere regels voor deelnemers.
                }
                td.appendChild(ta);
            }

            if (COLUMN_MIN_WIDTHS[col.key]) {                            // Alleen Type, Titel, Bronnen en Notities verbreden.
                td.style.minWidth = COLUMN_MIN_WIDTHS[col.key];          // Houd de kolombreedte gelijk aan de header.
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

    /* ======================= EVENTRIJ KOPIËREN ======================= */
    function nextEventId(personId) {
        var prefix = safe(personId);                                     // Gebruik het bestaande persoons-ID als basis.
        var highest = 0;                                                 // Bewaar het hoogste gevonden event-volgnummer.
        var storedEvents = window.EventStorage ? EventStorage.get() : [];// Lees reeds opgeslagen events uit EventStorage.

        storedEvents.forEach(function (event) {                          // Controleer eerst alle blijvend opgeslagen events.
            var eventId = safe(event.id);                                // Lees het opgeslagen Event ID.
            var expectedPrefix = prefix + '-';                           // Verwacht formaat: <persoons-ID>-001.
            if (eventId.indexOf(expectedPrefix) !== 0) return;           // Negeer events die bij een andere persoon horen.

            var suffix = eventId.slice(expectedPrefix.length);           // Neem alleen het driecijferige volgnummer.
            if (!/^\d{3}$/.test(suffix)) return;                         // Accepteer uitsluitend exact drie cijfers.

            highest = Math.max(highest, parseInt(suffix, 10));           // Bewaar het hoogste opgeslagen volgnummer.
        });

        tableBody.querySelectorAll('tr').forEach(function (tr) {         // Controleer daarna ook nog niet-opgeslagen zichtbare rijen.
            var eventIdCell = tr.cells[7];                               // Event ID staat direct na Geboortedatum.
            if (!eventIdCell) return;                                    // Rij zonder Event ID overslaan.

            var eventId = safe(eventIdCell.textContent);                 // Lees het zichtbare Event ID.
            var expectedPrefix = prefix + '-';                           // Verwacht hetzelfde persoons-ID als prefix.
            if (eventId.indexOf(expectedPrefix) !== 0) return;           // Negeer rijen van een ander persoons-ID.

            var suffix = eventId.slice(expectedPrefix.length);           // Neem alleen het zichtbare volgnummer.
            if (!/^\d{3}$/.test(suffix)) return;                         // Accepteer uitsluitend exact drie cijfers.

            highest = Math.max(highest, parseInt(suffix, 10));           // Neem ook tijdelijke rijen mee in de nummering.
        });

        return prefix + '-' + String(highest + 1).padStart(3, '0');      // Geef het eerstvolgende Event ID terug.
    }

    function copyFirstRow() {
        if (!selectedHoofdId) return;                                    // Zonder geselecteerde persoon niets kopiëren

        if (tempRowCount >= 10) {
            alert(i18nModule.t('eventsmanager:alert.maxRows'));                 // Bestaande limiet van tien tijdelijke rijen behouden
            return;
        }

        var firstRow = tableBody.querySelector('tr');                    // De eerste zichtbare persoonsrij
        if (!firstRow) return;                                           // Geen bronrij aanwezig: niets doen

        var copied = {};                                                 // Nieuw object voor de eventrij

        COLUMNS.slice(0, 7).forEach(function (col, i) {                  // Kopieer alleen ID t/m Geboortedatum
            var cell = firstRow.cells[i];                                // Bijbehorende cel uit de eerste rij
            if (!cell) return;                                           // Ontbrekende cel veilig overslaan

            if (col.readonly) {
                copied[col.key] = safe(cell.textContent);                // Readonly ID uit de cel kopiëren
            } else {
                var ta = cell.querySelector('textarea');                 // Bewerkbaar persoonsveld zoeken
                copied[col.key] = ta ? ta.value : safe(cell.textContent);// Actuele zichtbare waarde kopiëren
            }
        });

        copied.id = nextEventId(copied.ID);                              // Event ID = persoons-ID + driecijferig volgnummer

        var tr = buildRow(copied, false, 0);                             // Bouw eventrij met gekopieerde persoonsgegevens
        tableBody.appendChild(tr);                                       // Plaats de nieuwe eventrij onder de eerste rij
        tempRowCount++;                                                  // Teller voor tijdelijke eventrijen verhogen
        adjustTextareas();                                               // Textarea-hoogtes opnieuw bepalen
    }

    /* ======================= DATASET OPSLAAN ======================= */
    function saveDatasetMerged() {
        try {
            if (!window.EventStorage) {                                   // Controleer of de aparte eventopslag geladen is.
                throw new Error('EventStorage is niet geladen.');         // Stop veilig als eventStorage.js ontbreekt.
            }

            var storedEvents = EventStorage.get();                        // Lees alle reeds opgeslagen events.
            var storedIds = new Set(storedEvents.map(function (event) {   // Bouw een set met bestaande Event ID's.
                return safe(event.id);                                    // Gebruik uitsluitend het Event ID als unieke sleutel.
            }));

            var rows = tableBody.querySelectorAll('tr');                  // Lees alle zichtbare eventrijen uit de tabel.

            rows.forEach(function (tr) {                                  // Verwerk iedere zichtbare rij afzonderlijk.
                if (tr.cells.length !== COLUMNS.length) return;           // Sla placeholder- of onvolledige rijen over.

                var personId = safe(tr.cells[0].textContent);             // Persoons-ID blijft de koppeling naar StamboomStorage.
                var event = {};                                           // Bouw alleen het EventStorage-record op.

                COLUMNS.slice(7).forEach(function (col, offset) {         // Lees uitsluitend de eventkolommen na Geboortedatum.
                    var cell = tr.cells[offset + 7];                       // Zoek de bijbehorende eventcel.
                    if (!cell) return;                                    // Ontbrekende cel veilig overslaan.

                    if (col.readonly) {                                    // Event ID is readonly in de tabel.
                        event[col.key] = safe(cell.textContent);           // Lees het Event ID rechtstreeks uit de cel.
                    } else if (col.key === 'sources') {
                        event.sources = readSourcesCell(cell);             // Lees alle benoemde links uit de Bronnen-widget.
                    } else {
                        var input = cell.querySelector('textarea, select'); // Lees textarea of Type-dropdown.
                        event[col.key] = input ? input.value.trim() : '';   // Neem de actuele ingevulde/gekozen waarde over.
                    }
                });

                var participantText = event.participants || '';           // Bewaar de zichtbare deelnemerswaarde tijdelijk.
                event.participants = [{                                   // Maak de verplichte persoonskoppeling voor dit event.
                    person_id: personId,                                  // Gebruik exact het bestaande StamboomStorage persoons-ID.
                    name: participantText,                                // Gebruik eventueel ingevulde deelnemernaam; leeg blijft toegestaan.
                    role: ''                                              // Rol blijft leeg totdat hiervoor apart gedrag wordt toegevoegd.
                }];

                if (!event.id) return;                                    // Een event zonder Event ID mag niet worden opgeslagen.

                if (storedIds.has(event.id)) {                            // Bestaand Event ID betekent een update.
                    EventStorage.update(event.id, event);                 // Werk uitsluitend dit bestaande event bij.
                } else {
                    EventStorage.add(event);                              // Voeg een nieuw event toe aan stamboomEvents.
                    storedIds.add(event.id);                              // Markeer het ID direct als bestaand binnen deze save-run.
                }
            });

            tempRowCount = 0;                                             // Reset de teller na succesvolle opslag.
            alert(i18nModule.t('eventsmanager:alert.saved'));                    // Gebruik de bestaande opslagbevestiging.
        } catch (e) {
            alert(i18nModule.t('eventsmanager:alert.saveFailed', { error: e.message })); // Gebruik de bestaande foutmelding.
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
        // beide vereisen de eventsmanager-namespace die nog niet geladen is op dit moment
        // eventsmanager.html roept window.ManageTable.buildHeader() aan ná loadNamespace('eventsmanager')

        i18next.on('languageChanged', function () {
            buildHeader();                                               // Headers hertekenen bij taalwissel
        });

        addBtn.removeAttribute('data-i18n');                             // Voorkom dat i18n het nieuwe knoplabel terugzet
        addBtn.textContent = 'Kopieer';                                  // + Toevoegen wordt Kopieer
        addBtn.addEventListener('click', copyFirstRow);                   // Kopieer de eerste persoonsrij naar een nieuwe eventrij
        saveBtn.addEventListener('click', saveDatasetMerged);            // Opslaan-knop
        refreshBtn.addEventListener('click', function () {
            var refreshUrl = new URL(window.location.href);               // Neem de huidige Event Manager-URL over.
            refreshUrl.searchParams.set('_refresh', Date.now());          // Voeg een unieke waarde toe om de paginacache te omzeilen.
            window.location.replace(refreshUrl.toString());                // Laad de volledige pagina opnieuw vanaf de nieuwe URL.
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
    // Exposed via window.ManageTable zodat eventsmanager.html beide functies kan aanroepen
    // ná loadNamespace('eventsmanager') — consistent met window.RelatieEngine, window.StamboomSchema
    window.ManageTable = {
        buildHeader:     buildHeader,                                    // Headers bouwen na namespace load
        showPlaceholder: showPlaceholder                                 // Beginmelding na namespace load
    };

})();                                                                    // Sluit en vo