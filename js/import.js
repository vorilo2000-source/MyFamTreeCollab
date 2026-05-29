/* ======================= js/import.js v2.2.0 ======================= */
/* Wijziging v2.2.0 (sessie 26):
   - TD-11 / F8-56: import-parser gebruikt nu schema.normalizeHeader()
   - Legacy CSV (19 kolommen) wordt correct herkend via LEGACY_HEADERS in schema.js
   - Legacy velden die niet in schema.fields staan worden genegeerd (huwelijksdatum, etc.)
   - Eigen object-bouw vervangen door schema.fromCSV() voor correcte migratie
   Drop-in CSV/TXT importer voor MyFamTreeCollab
   - Geen validatie, geen ID generaties
   - Eerste 14 velden volgens schema.fields
   - Extra kolommen 15-22 → _extra (alleen bij huidige schema, niet bij legacy)
   - Delimiter detectie: comma, semicolon, tab
   - Quotes handling en embedded delimiters
*/

// ======================= START IMPORT =======================
document.addEventListener("DOMContentLoaded", function() {

    const btn = document.getElementById("importBtn"); // zoek import knop
    if(!btn){
        console.error("importBtn niet gevonden"); // log fout als knop ontbreekt
        return;
    }

    btn.addEventListener("click", function() {

        const status = document.getElementById("importStatus"); // element voor statusmeldingen

        // Controleer of storage.js geladen is
        if(typeof StamboomStorage === "undefined"){
            status.innerHTML = "❌ " + i18nModule.t("import:status.storageError"); // foutmelding storage
            status.style.color = "red";
            return;
        }

        // Controleer of schema.js geladen is
        if(!window.StamboomSchema){
            status.innerHTML = "❌ " + i18nModule.t("import:status.schemaError"); // foutmelding schema
            status.style.color = "red";
            return;
        }

        const schema = window.StamboomSchema; // lokale referentie naar schema module
        const maxColumns = schema.maxColumns;  // max kolommen totaal (22)

        const fileInput = document.getElementById("importFile"); // verborgen native input
        const file = fileInput.files[0]; // geselecteerd bestand

        // Controleer of een bestand geselecteerd is
        if(!file){
            status.innerHTML = "❌ " + i18nModule.t("import:status.noFile"); // foutmelding geen bestand
            status.style.color = "red";
            return;
        }

        const reader = new FileReader(); // bestandslezer
        reader.onload = function(e){

            let text = e.target.result; // ruwe bestandsinhoud
            text = text.replace(/^\uFEFF/, ""); // verwijder BOM indien aanwezig

            // ======================= DELIMITER DETECTIE =======================
            function detectDelimiter(csv){
                const firstLine = csv.split(/\r?\n/)[0]; // eerste regel voor detectie
                const options = [",",";","\t"];           // mogelijke delimiters
                let best = ",";                           // standaard delimiter
                let bestScore = 0;                        // hoogste kolomtelling
                options.forEach(d => {
                    const score = firstLine.split(d).length; // tel kolommen per delimiter
                    if(score > bestScore){ bestScore = score; best = d; } // bewaar beste
                });
                return best; // geef gedetecteerde delimiter terug
            }

            const delimiter = detectDelimiter(text); // detecteer delimiter van dit bestand

            // ======================= SPLIT LINES =======================
            const lines = text
                .split(/\r?\n/)      // split op newline (unix en windows)
                .map(l => l.trim())  // trim whitespace per regel
                .filter(l => l.length); // verwijder lege regels

            // Controleer of CSV minimaal een header + 1 datarij bevat
            if(lines.length < 2){
                status.innerHTML = "❌ " + i18nModule.t("import:status.noData"); // foutmelding leeg bestand
                status.style.color = "red";
                return;
            }

            // ======================= HEADER DETECTIE =======================
            // Gebruik schema.normalizeHeader om headertype te bepalen:
            // - "current"  → huidige 14-kolommen structuur
            // - "legacy"   → oudere structuur (bv. 19 kolommen met huwelijksdata)
            // - "unknown"  → onbekende structuur, best-effort import
            const headerLine = lines[0];                          // eerste regel = header
            const headerInfo = schema.normalizeHeader(headerLine); // detecteer type

            console.log("Import header type:", headerInfo.type, headerInfo.header); // debug info

            // ======================= CSV SPLIT HULPFUNCTIE =======================
            function splitLine(line){
                let values = [];   // resultaat array
                let current = "";  // huidige cel
                let insideQuotes = false; // quote tracking

                for(let i = 0; i < line.length; i++){
                    const char = line[i]; // huidig karakter
                    if(char === '"'){
                        insideQuotes = !insideQuotes; // toggle quote modus
                    } else if(char === delimiter && !insideQuotes){
                        values.push(current); // sla cel op bij delimiter buiten quotes
                        current = "";         // reset cel
                    } else {
                        current += char; // voeg karakter toe aan cel
                    }
                }
                values.push(current); // laatste cel toevoegen

                // verwijder surrounding quotes en escaped dubbele quotes
                return values.map(v => v.replace(/^"(.*)"$/,'$1').replace(/""/g,'"').trim());
            }

            // ======================= PARSEN VAN RIJEN =======================
            const newRows = [];                  // geïmporteerde personen
            const existing = StamboomStorage.get(); // bestaande data

            lines.slice(1).forEach((line, index) => { // sla headerrij over, loop door datarijen

                if(!line.trim()) return; // lege regel overslaan

                const values = splitLine(line); // splits CSV-regel in waarden

                let obj; // persoonsobject

                if(headerInfo.type === "legacy"){
                    // Legacy structuur: schema.fromCSV gebruikt migrateLegacyRow
                    // Velden die niet in schema.fields staan (huwelijksdatum etc.) worden genegeerd
                    obj = schema.fromCSV(line, headerInfo); // migreer via schema module

                } else {
                    // Huidige of onbekende structuur: bouw object op via schema.fields
                    obj = schema.empty(); // start met leeg schema object

                    schema.fields.forEach((field, i) => {
                        obj[field] = values[i] !== undefined ? values[i] : ""; // vul kernvelden
                    });

                    // Extra kolommen 15-22 bewaren als _extra array
                    obj._extra = values.slice(schema.coreFieldCount, maxColumns); // kolommen buiten schema
                }

                newRows.push(obj); // voeg toe aan importlijst
            });

            // ======================= OPSLAAN =======================
            StamboomStorage.set(existing.concat(newRows)); // voeg nieuwe rijen toe aan bestaande data

            // Succesmelding met geïnterpoleerd aantal personen via i18next
            status.innerHTML = "✅ " + i18nModule.t("import:status.success", { count: newRows.length });
            status.style.color = "green";
            console.log("Import completed:", newRows.length, "personen, type:", headerInfo.type); // debug
        };

        reader.readAsText(file); // lees bestand als tekst
    });
});
