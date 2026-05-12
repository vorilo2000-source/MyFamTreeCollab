/* ======================= js/export.js v2.1.0 =======================
   Wijziging v2.1.0 (sessie 25):
   - Alle hardcoded statusmeldingen vervangen door i18nModule.t('export:status.*')
   - Bestandsnaam interpolatie via {{filename}}
   Centrale export-module voor MyFamTreeCollab
   Exporteert: window.ExportModule met exportCSV() en exportJSON()
   Vereist: schema.js, storage.js (in die volgorde geladen vóór dit bestand)
   Gebruikt door: home/export.html, stamboom/storage.html
   ======================================================================= */

(function () {                                                              // Zelfuitvoerende functie: voorkomt globale variabelen buiten window.ExportModule
    'use strict';                                                           // Strikte modus: voorkomt stille JS-fouten

    /* ======================= HELPERS ======================= */

    /**
     * Maakt een waarde veilig voor gebruik in een CSV-cel.
     * @param  {*}      value - Elke waarde (string, number, null, undefined)
     * @returns {string}      - CSV-veilige string, altijd tussen dubbele aanhalingstekens
     */
    function escapeCSV(value) {
        if (value == null) return '""';                                     // Null of undefined → lege cel
        const str = String(value).replace(/"/g, '""');                     // Verdubbel interne aanhalingstekens (CSV-standaard)
        return `"${str}"`;                                                 // Wikkel in aanhalingstekens
    }

    /**
     * Genereert een datumstring voor in de bestandsnaam, bijv. "20240312".
     * @returns {string} - Huidige datum als JJJJMMDD
     */
    function datumVoorBestandsnaam() {
        const nu    = new Date();                                           // Haal de huidige datum en tijd op
        const jaar  = nu.getFullYear();                                    // 4-cijferig jaartal
        const maand = String(nu.getMonth() + 1).padStart(2, '0');          // Maand 0-gebaseerd, +1 en opvullen
        const dag   = String(nu.getDate()).padStart(2, '0');               // Dag opvullen tot 2 cijfers
        return `${jaar}${maand}${dag}`;                                    // Combineer tot JJJJMMDD
    }

    /* ======================= CSV EXPORT ======================= */

    /**
     * Exporteert de volledige stamboom als CSV-bestand.
     * Op Chrome/Edge + HTTPS: toont "Opslaan als" dialoog.
     * Op andere browsers: slaat op in downloadmap.
     * @param {HTMLElement} [statusEl] - Optioneel element voor statusmelding
     */
    async function exportCSV(statusEl) {
        const data = StamboomStorage.get();                                // Haal dataset op uit localStorage

        if (!data.length) {                                                // Controleer of er data is
            if (statusEl) {
                statusEl.textContent = '⚠️ ' + i18nModule.t('export:status.noData'); // Vertaalde waarschuwing
                statusEl.style.color = 'red';
            }
            return;
        }

        const velden = window.StamboomSchema                               // Haal kolomnamen op uit schema
            ? [...window.StamboomSchema.fields]
            : Object.keys(data[0]);                                        // Fallback: sleutels van eerste object

        const standaardNaam = `stamboom_${datumVoorBestandsnaam()}`;       // Standaard bestandsnaam met datum
        let bestandsnaam = prompt(
            i18nModule.t('export:status.promptFilename'),                  // Vertaalde prompttekst
            standaardNaam
        );
        if (!bestandsnaam) bestandsnaam = standaardNaam;                   // Fallback bij annuleren of leeg
        const volledigeNaam = `${bestandsnaam}.csv`;                       // Voeg .csv extensie toe

        // Bouw CSV-inhoud op
        const csvRegels = [];
        csvRegels.push(velden.map(escapeCSV).join(','));                   // Kolomnamen als eerste regel
        data.forEach(persoon => {
            const rij = velden.map(veld => escapeCSV(persoon[veld] ?? '')); // Waarden per rij
            csvRegels.push(rij.join(','));
        });
        const csvInhoud = csvRegels.join('\n');                            // Combineer regels tot CSV-string

        try {
            if (window.showSaveFilePicker && location.protocol === 'https:') { // Moderne File System API beschikbaar?
                const fileHandle = await window.showSaveFilePicker({       // Open "Opslaan als" dialoog
                    suggestedName: volledigeNaam,
                    types: [{ description: 'CSV bestand', accept: { 'text/csv': ['.csv'] } }]
                });
                const writable = await fileHandle.createWritable();        // Maak bestand schrijfbaar
                await writable.write(csvInhoud);                           // Schrijf CSV-inhoud
                await writable.close();                                    // Sluit bestand
                if (statusEl) {
                    statusEl.textContent = '✅ ' + i18nModule.t('export:status.csvSavedAs', { filename: volledigeNaam }); // Vertaalde succesmelding
                    statusEl.style.color = 'green';
                }
            } else {                                                       // Fallback voor browsers zonder showSaveFilePicker
                alert('⚠️ ' + i18nModule.t('export:status.browserWarning')); // Vertaalde browsermelding
                const blob = new Blob([csvInhoud], { type: 'text/csv' }); // Maak downloadbaar object
                const url  = URL.createObjectURL(blob);                    // Tijdelijke download-URL
                const a    = document.createElement('a');                  // Onzichtbare downloadlink
                a.href     = url;
                a.download = volledigeNaam;
                document.body.appendChild(a);
                a.click();                                                 // Start download
                document.body.removeChild(a);
                URL.revokeObjectURL(url);                                  // Geef geheugen vrij
                if (statusEl) {
                    statusEl.textContent = '✅ ' + i18nModule.t('export:status.csvDownload', { filename: volledigeNaam }); // Vertaalde downloadmelding
                    statusEl.style.color = 'green';
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') {                               // Gebruiker annuleerde dialoog
                if (statusEl) {
                    statusEl.textContent = i18nModule.t('export:status.cancelled'); // Vertaalde annuleringsmelding
                    statusEl.style.color = 'gray';
                }
            } else {                                                       // Onverwachte fout
                console.error('Export mislukt:', err);
                if (statusEl) {
                    statusEl.textContent = '❌ ' + i18nModule.t('export:status.failed'); // Vertaalde foutmelding
                    statusEl.style.color = 'red';
                }
            }
        }
    }

    /* ======================= JSON EXPORT ======================= */

    /**
     * Exporteert de volledige stamboom als JSON-bestand.
     * Altijd via downloadmap (geen "Opslaan als" dialoog).
     * @param {HTMLElement} [statusEl] - Optioneel element voor statusmelding
     */
    function exportJSON(statusEl) {
        const data = StamboomStorage.get();                                // Haal dataset op uit localStorage

        if (!data.length) {                                                // Controleer of er data is
            if (statusEl) {
                statusEl.textContent = '⚠️ ' + i18nModule.t('export:status.noData'); // Vertaalde waarschuwing
                statusEl.style.color = 'red';
            }
            return;
        }

        const standaardNaam = `stamboom_${datumVoorBestandsnaam()}.json`;  // Bestandsnaam met datum
        const blob = new Blob(
            [JSON.stringify(data, null, 2)],                               // Leesbare JSON met 2 spaties inspringing
            { type: 'application/json' }
        );
        const url = URL.createObjectURL(blob);                             // Tijdelijke download-URL
        const a   = document.createElement('a');                          // Onzichtbare downloadlink
        a.href     = url;
        a.download = standaardNaam;
        document.body.appendChild(a);
        a.click();                                                         // Start download
        document.body.removeChild(a);
        URL.revokeObjectURL(url);                                          // Geef geheugen vrij

        if (statusEl) {
            statusEl.textContent = '✅ ' + i18nModule.t('export:status.jsonSaved', { filename: standaardNaam }); // Vertaalde succesmelding
            statusEl.style.color = 'green';
        }
    }

    /* ======================= EXPORTEER ALS GLOBAAL OBJECT ======================= */
    window.ExportModule = {                                                // Exporteer beide functies onder één namespace
        exportCSV,                                                         // window.ExportModule.exportCSV(statusEl)
        exportJSON                                                         // window.ExportModule.exportJSON(statusEl)
    };

})();                                                                      // Sluit en voer de zelfuitvoerende functie direct uit
