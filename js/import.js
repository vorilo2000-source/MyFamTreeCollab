/* ======================= js/import.js v2.3.0 ======================= */
/* Wijziging v2.3.0 (sessie F3-62):
   - F3-62: Duplicate ID detectie bij CSV import
   - Bij duplicaten: modal met keuze overslaan / overschrijven / toch alles importeren
   - Rapporteert aantal duplicaten + welke IDs
   - Logica gesplitst: parseFase → duplicaatCheck → opslagFase
   Eerdere wijzigingen:
   - v2.2.0: TD-11 / F8-56: import-parser gebruikt schema.normalizeHeader()
   - Legacy CSV (19 kolommen) correct herkend via LEGACY_HEADERS in schema.js
   - Legacy velden buiten schema.fields worden genegeerd
   - schema.fromCSV() vervangt eigen object-bouw
   Drop-in CSV/TXT importer voor MyFamTreeCollab
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

    // ======================= MODAL AANMAKEN =======================
    // Bouw duplicate-keuze modal dynamisch in de DOM (geen aparte HTML nodig)
    // De modal staat standaard verborgen en wordt getoond bij duplicaten

    const modal = document.createElement("div");       // container element voor modal
    modal.id = "importDuplicateModal";                 // ID voor evt. styling
    modal.style.cssText = [                            // inline stijl: overlay over pagina
        "display:none",                                // standaard verborgen
        "position:fixed",                              // vast op scherm
        "top:0", "left:0",                             // volledig scherm
        "width:100%", "height:100%",                   // volledige breedte/hoogte
        "background:rgba(0,0,0,0.5)",                  // donkere overlay
        "z-index:9999",                                // boven alle andere elementen
        "align-items:center",                          // verticaal centreren
        "justify-content:center"                       // horizontaal centreren
    ].join(";");

    // Binnenste kaart van de modal
    const modalBox = document.createElement("div");   // witte kaart in het midden
    modalBox.style.cssText = [
        "background:#fff",                             // witte achtergrond
        "border-radius:8px",                           // afgeronde hoeken
        "padding:24px",                                // binnenruimte
        "max-width:480px",                             // maximale breedte
        "width:90%",                                   // responsief op kleine schermen
        "box-shadow:0 4px 24px rgba(0,0,0,0.2)",      // schaduw voor diepte
        "font-family:sans-serif"                       // leesbaar lettertype
    ].join(";");

    // Titel van de modal
    const modalTitle = document.createElement("h3");  // koptekst
    modalTitle.style.marginTop = "0";                 // geen extra ruimte boven
    modalTitle.textContent = "⚠️ Dubbele personen gevonden"; // standaard titel

    // Tekst met uitleg en lijst van duplicate IDs
    const modalBody = document.createElement("p");    // alinea voor uitleg tekst
    modalBody.id = "importDuplicateBody";              // ID om tekst later in te vullen

    // Knoppen container
    const modalButtons = document.createElement("div");         // rij met keuze-knoppen
    modalButtons.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-top:16px"; // horizontaal naast elkaar

    // Knop 1: Overslaan (importeer alleen nieuwe IDs, sla duplicaten over)
    const btnSkip = document.createElement("button");          // knop overslaan
    btnSkip.textContent = "⏭ Overslaan";                       // label
    btnSkip.style.cssText = "padding:8px 16px;cursor:pointer;background:#f0ad4e;border:none;border-radius:4px;color:#fff;font-size:14px"; // oranje stijl

    // Knop 2: Overschrijven (vervang bestaande records met geïmporteerde versie)
    const btnOverwrite = document.createElement("button");     // knop overschrijven
    btnOverwrite.textContent = "♻️ Overschrijven";             // label
    btnOverwrite.style.cssText = "padding:8px 16px;cursor:pointer;background:#d9534f;border:none;border-radius:4px;color:#fff;font-size:14px"; // rood stijl

    // Knop 3: Alles importeren (voeg alles toe inclusief duplicaten, max flexibiliteit)
    const btnAll = document.createElement("button");           // knop alles importeren
    btnAll.textContent = "📥 Toch alles importeren";           // label
    btnAll.style.cssText = "padding:8px 16px;cursor:pointer;background:#5bc0de;border:none;border-radius:4px;color:#fff;font-size:14px"; // blauw stijl

    // Knop 4: Annuleren (import afbreken, niets opslaan)
    const btnCancel = document.createElement("button");        // knop annuleren
    btnCancel.textContent = "✖ Annuleren";                     // label
    btnCancel.style.cssText = "padding:8px 16px;cursor:pointer;background:#ccc;border:none;border-radius:4px;color:#333;font-size:14px"; // grijs stijl

    // Modal samenvoegen
    modalButtons.append(btnSkip, btnOverwrite, btnAll, btnCancel); // knoppen in rij
    modalBox.append(modalTitle, modalBody, modalButtons);           // kaart opbouwen
    modal.appendChild(modalBox);                                    // kaart in overlay
    document.body.appendChild(modal);                              // modal in pagina

    // ======================= HULPFUNCTIE: MODAL TONEN =======================
    // Toont de modal en returnt een Promise die resolvet met de gebruikerskeuze
    // Keuzes: "skip" | "overwrite" | "all" | "cancel"

    function showDuplicateModal(duplicateIDs, totalNew){
        return new Promise(function(resolve){ // Promise zodat we kunnen awaiten

            const count = duplicateIDs.length;  // aantal duplicaten
            const idList = duplicateIDs.join(", "); // komma-gescheiden lijst van IDs

            // Stel de body-tekst in met details over de duplicaten
            modalBody.innerHTML =
                `<strong>${count} van de ${totalNew} te importeren personen</strong> ` +
                `heeft een ID dat al bestaat in de stamboom.<br><br>` +
                `<strong>Betreffende IDs:</strong><br>` +
                `<code style="font-size:12px;word-break:break-all">${idList}</code><br><br>` +
                `Kies hoe je wil verdergaan:`; // instructie voor gebruiker

            modal.style.display = "flex"; // modal zichtbaar maken als flexbox

            // Klik-handlers per knop — elk resolvet de Promise en sluit modal
            function closeModal(choice){
                modal.style.display = "none"; // modal verbergen
                // Verwijder event listeners om geheugenlek te voorkomen
                btnSkip.onclick     = null;
                btnOverwrite.onclick = null;
                btnAll.onclick      = null;
                btnCancel.onclick   = null;
                resolve(choice); // geef keuze terug aan aanroeper
            }

            btnSkip.onclick      = function(){ closeModal("skip"); };      // overslaan gekozen
            btnOverwrite.onclick = function(){ closeModal("overwrite"); }; // overschrijven gekozen
            btnAll.onclick       = function(){ closeModal("all"); };       // alles importeren gekozen
            btnCancel.onclick    = function(){ closeModal("cancel"); };    // annuleren gekozen
        });
    }

    // ======================= IMPORT KLIK-HANDLER =======================
    btn.addEventListener("click", async function() { // async zodat we await kunnen gebruiken

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
        const maxColumns = schema.maxColumns; // max kolommen totaal (22)

        const fileInput = document.getElementById("importFile"); // verborgen native input
        const file = fileInput.files[0];                         // geselecteerd bestand

        // Controleer of een bestand geselecteerd is
        if(!file){
            status.innerHTML = "❌ " + i18nModule.t("import:status.noFile"); // foutmelding geen bestand
            status.style.color = "red";
            return;
        }

        // Lees bestand als tekst via Promise-wrapper rond FileReader
        const text = await new Promise(function(resolve, reject){
            const reader = new FileReader(); // bestandslezer
            reader.onload  = function(e){ resolve(e.target.result); }; // bestand geladen
            reader.onerror = function()  { reject(new Error("Bestandsleesfout")); }; // leesfout
            reader.readAsText(file); // start lezen als tekst
        }).catch(function(err){
            status.innerHTML = "❌ Bestand kon niet gelezen worden."; // foutmelding
            status.style.color = "red";
            console.error("FileReader fout:", err); // debug
            return null; // geef null terug zodat we kunnen stoppen
        });

        if(!text) return; // stop als lezen mislukt is

        const cleanText = text.replace(/^\uFEFF/, ""); // verwijder BOM indien aanwezig

        // ======================= DELIMITER DETECTIE =======================
        function detectDelimiter(csv){
            const firstLine = csv.split(/\r?\n/)[0]; // eerste regel voor detectie
            const options = [",", ";", "\t"];         // mogelijke delimiters
            let best = ",";                           // standaard delimiter
            let bestScore = 0;                        // hoogste kolomtelling
            options.forEach(function(d){
                const score = firstLine.split(d).length; // tel kolommen per delimiter
                if(score > bestScore){ bestScore = score; best = d; } // bewaar beste
            });
            return best; // geef gedetecteerde delimiter terug
        }

        const delimiter = detectDelimiter(cleanText); // detecteer delimiter van dit bestand

        // ======================= SPLIT LINES =======================
        const lines = cleanText
            .split(/\r?\n/)       // split op newline (unix en windows)
            .map(function(l){ return l.trim(); })   // trim whitespace per regel
            .filter(function(l){ return l.length; }); // verwijder lege regels

        // Controleer of CSV minimaal een header + 1 datarij bevat
        if(lines.length < 2){
            status.innerHTML = "❌ " + i18nModule.t("import:status.noData"); // foutmelding leeg bestand
            status.style.color = "red";
            return;
        }

        // ======================= HEADER DETECTIE =======================
        const headerLine = lines[0];                           // eerste regel = header
        const headerInfo = schema.normalizeHeader(headerLine); // detecteer type

        console.log("Import header type:", headerInfo.type, headerInfo.header); // debug info

        // ======================= CSV SPLIT HULPFUNCTIE =======================
        function splitLine(line){
            let values = [];          // resultaat array
            let current = "";         // huidige cel
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
            return values.map(function(v){
                return v.replace(/^"(.*)"$/,"$1").replace(/""/g,'"').trim();
            });
        }

        // ======================= FASE 1: PARSEN =======================
        // Bouw newRows array uit CSV regels, nog zonder duplicate check

        const newRows = []; // geïmporteerde personen (geparsed maar nog niet opgeslagen)

        lines.slice(1).forEach(function(line){ // sla headerrij over, loop door datarijen

            if(!line.trim()) return; // lege regel overslaan

            const values = splitLine(line); // splits CSV-regel in waarden

            let obj; // persoonsobject

            if(headerInfo.type === "legacy"){
                // Legacy structuur: schema.fromCSV gebruikt migrateLegacyRow
                // Velden buiten schema.fields (huwelijksdatum etc.) worden genegeerd
                obj = schema.fromCSV(line, headerInfo); // migreer via schema module

            } else {
                // Huidige of onbekende structuur: bouw object via schema.fields
                obj = schema.empty(); // start met leeg schema object

                schema.fields.forEach(function(field, i){
                    obj[field] = values[i] !== undefined ? values[i] : ""; // vul kernvelden
                });

                // Extra kolommen 15–22 bewaren als _extra array
                obj._extra = values.slice(schema.coreFieldCount, maxColumns); // buiten schema
            }

            newRows.push(obj); // voeg toe aan importlijst
        });

        // ======================= FASE 2: DUPLICATE CHECK =======================
        // Vergelijk elk geïmporteerd ID met bestaande IDs in StamboomStorage

        const existing = StamboomStorage.get(); // haal huidige stamboomdata op

        // Bouw een Set van bestaande IDs voor snelle lookup (O(1) per check)
        const existingIDSet = new Set(
            existing
                .map(function(p){ return p.ID; })   // haal ID uit elk persoonsobject
                .filter(function(id){ return id; })  // verwijder lege/undefined IDs
        );

        // Verzamel alle geïmporteerde IDs die al bestaan
        const duplicateIDs = newRows
            .map(function(p){ return p.ID; })                           // alle geïmporteerde IDs
            .filter(function(id){ return id && existingIDSet.has(id); }); // behoud duplicaten

        // Verwijder dubbele waarden in de duplicatenlijst zelf (als CSV zelf duplicaten heeft)
        const uniqueDuplicateIDs = [...new Set(duplicateIDs)]; // unieke duplicate IDs

        console.log("Duplicaten gevonden:", uniqueDuplicateIDs.length, uniqueDuplicateIDs); // debug

        // ======================= FASE 3: GEBRUIKERSKEUZE (indien duplicaten) =======================

        let choice = "none"; // standaard: geen duplicaten aanwezig

        if(uniqueDuplicateIDs.length > 0){
            // Toon modal en wacht op gebruikerskeuze (async/await)
            choice = await showDuplicateModal(uniqueDuplicateIDs, newRows.length);
            console.log("Gebruikerskeuze bij duplicaten:", choice); // debug
        }

        // Annuleren: stop import zonder opslaan
        if(choice === "cancel"){
            status.innerHTML = "ℹ️ Import geannuleerd."; // informatieve melding
            status.style.color = "gray";
            return; // stop hier
        }

        // ======================= FASE 4: OPSLAAN OP BASIS VAN KEUZE =======================

        let finalRows = []; // de uiteindelijk op te slaan rijen

        if(choice === "skip"){
            // Overslaan: importeer alleen rijen waarvan het ID NIET al bestaat
            finalRows = newRows.filter(function(p){
                return !existingIDSet.has(p.ID); // alleen nieuwe IDs doorlaten
            });

            const skippedCount = newRows.length - finalRows.length; // aantal overgeslagen
            console.log("Overgeslagen duplicaten:", skippedCount); // debug

            // Voeg alleen nieuwe records toe achteraan bestaande data
            StamboomStorage.set(existing.concat(finalRows)); // opslaan zonder duplicaten

            status.innerHTML =
                "✅ " + i18nModule.t("import:status.success", { count: finalRows.length }) +
                ` (${skippedCount} dubbele overgeslagen)`; // melding met detail
            status.style.color = "green";

        } else if(choice === "overwrite"){
            // Overschrijven: vervang bestaande records door geïmporteerde versie
            // Bouw Map van geïmporteerde personen op ID voor snelle opzoek
            const importMap = new Map(
                newRows
                    .filter(function(p){ return p.ID; })         // alleen rijen met ID
                    .map(function(p){ return [p.ID, p]; })        // [ID, object] paren
            );

            // Loop bestaande records: vervang als ID in importMap zit
            const updatedExisting = existing.map(function(p){
                return importMap.has(p.ID) ? importMap.get(p.ID) : p; // vervang of bewaar
            });

            // Voeg geïmporteerde rijen toe die NIEUW zijn (nog niet in bestaand)
            const brandNewRows = newRows.filter(function(p){
                return !existingIDSet.has(p.ID); // alleen echt nieuwe IDs
            });

            StamboomStorage.set(updatedExisting.concat(brandNewRows)); // opslaan met overschrijving

            status.innerHTML =
                "✅ " + i18nModule.t("import:status.success", { count: newRows.length }) +
                ` (${uniqueDuplicateIDs.length} overschreven)`; // melding met detail
            status.style.color = "green";

        } else {
            // "all" of geen duplicaten: voeg alles toe zonder filter
            // Bij "all": gebruiker wil bewust alles importeren inclusief duplicaten
            StamboomStorage.set(existing.concat(newRows)); // simpele concatenatie

            status.innerHTML = "✅ " + i18nModule.t("import:status.success", { count: newRows.length });
            status.style.color = "green";
        }

        console.log("Import voltooid. Keuze:", choice, "| Opgeslagen:", finalRows.length || newRows.length, "| Type:", headerInfo.type); // debug
    });
});
