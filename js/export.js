/* ======================= js/export.js v2.2.0 =======================
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

    function familienaamVoorBestandsnaam() {
        const data = StamboomStorage.get();                                // Lees de stamboom in bestaande opslagvolgorde
        const eerstePersoon = data.length ? data[0] : null;                // Gebruik de eerste persoon als naamgever van de stamboom
        const achternaam = eerstePersoon && eerstePersoon.Achternaam       // Lees uitsluitend de achternaam van die eerste persoon
            ? String(eerstePersoon.Achternaam).trim()
            : 'familie';                                                   // Veilige fallback wanneer geen achternaam beschikbaar is

        return achternaam
            .replace(/[\\/:*?"<>|]/g, '')                                // Verwijder tekens die niet in bestandsnamen mogen voorkomen
            .replace(/\s+/g, '_')                                         // Zet spaties om naar underscores
            || 'familie';                                                  // Behoud altijd een geldige bestandsnaam
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

        const velden = window.StamboomSchema                               // Neem inclusief PortretURL alle 15 schemavelden mee in CSV
            ? [...window.StamboomSchema.fields]
            : Object.keys(data[0]);                                        // Fallback: sleutels van eerste object

        const volledigeNaam = `${familienaamVoorBestandsnaam()}_stamboom_${datumVoorBestandsnaam()}.csv`; // Vaste naam: familienaam_stamboom_JJJJMMDD.csv

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

        const standaardNaam = `${familienaamVoorBestandsnaam()}_stamboom_${datumVoorBestandsnaam()}.json`; // Vaste naam: familienaam_stamboom_JJJJMMDD.json
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


    /* ======================= EVENTS JSON EXPORT ======================= */

    /**
     * Exporteert de volledige EventStorage als JSON-bestand.
     * De bestaande stamboomexport blijft volledig gescheiden.
     * @param {HTMLElement} [statusEl] - Optioneel element voor statusmelding
     */
    function exportEventsJSON(statusEl) {
        if (!window.EventStorage) {                                          // Controleer of eventStorage.js geladen is
            if (statusEl) {
                statusEl.textContent = '❌ ' + i18nModule.t('export:status.eventStorageError'); // Meld ontbrekende EventStorage
                statusEl.style.color = 'red';
            }
            return;                                                          // Stop zonder de stamboomexport te beïnvloeden
        }

        const data = EventStorage.get();                                     // Haal uitsluitend de lokale eventdata op

        if (!data.length) {                                                  // Controleer of er events zijn
            if (statusEl) {
                statusEl.textContent = '⚠️ ' + i18nModule.t('export:status.eventNoData'); // Vertaalde waarschuwing
                statusEl.style.color = 'red';
            }
            return;
        }

        const standaardNaam = `${familienaamVoorBestandsnaam()}_event_${datumVoorBestandsnaam()}.json`; // Vaste naam: familienaam_event_JJJJMMDD.json
        const blob = new Blob(
            [JSON.stringify(data, null, 2)],                                 // Exporteer volledige EventStorage als leesbare JSON
            { type: 'application/json' }
        );

        const url = URL.createObjectURL(blob);                               // Maak tijdelijke download-URL
        const a   = document.createElement('a');                             // Maak tijdelijke downloadlink
        a.href = url;                                                        // Koppel download-URL
        a.download = standaardNaam;                                          // Stel bestandsnaam in
        document.body.appendChild(a);                                        // Voeg link tijdelijk toe
        a.click();                                                           // Start download
        document.body.removeChild(a);                                        // Verwijder tijdelijke link
        URL.revokeObjectURL(url);                                            // Geef tijdelijke URL vrij

        if (statusEl) {
            statusEl.textContent = '✅ ' + i18nModule.t('export:status.eventJsonSaved', { filename: standaardNaam }); // Succesmelding
            statusEl.style.color = 'green';
        }
    }

    /* ======================= EXPORTEER ALS GLOBAAL OBJECT ======================= */
    window.ExportModule = {                                                // Exporteer alle exportfuncties onder één namespace
        exportCSV,                                                         // window.ExportModule.exportCSV(statusEl)
        exportJSON,                                                        // window.ExportModule.exportJSON(statusEl)
        exportEventsJSON                                                   // window.ExportModule.exportEventsJSON(statusEl)
    };

})();                                                                      // Sluit en voer de zelfuit
