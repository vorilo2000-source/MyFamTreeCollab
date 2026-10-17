/* ======================= js/eventStorage.js v0.1.1 ======================= */ // Persistente lokale opslag voor Events v1.
(function () { // Start een afgeschermde module.
    'use strict'; // Activeert strikte JavaScript-validatie.

    var STORAGE_KEY = 'stamboomEvents'; // Sleutel waaronder events in localStorage staan.
    var MODIFIED_KEY = 'stamboomEvents_modified'; // Sleutel voor laatste lokale wijzigingstijd.

    function safeParse(json) { // Leest JSON veilig uit localStorage.
        if (!json) return []; // Geeft een lege array terug als geen data bestaat.
        try { // Probeert de JSON te ontleden.
            var parsed = JSON.parse(json); // Zet JSON-tekst om naar JavaScript-data.
            return Array.isArray(parsed) ? parsed : []; // Accepteert alleen arrays.
        } catch (e) { // Vangt corrupte JSON af.
            console.warn('eventStorage.js: corrupte JSON in localStorage, dataset gereset.'); // Logt de parsefout.
            return []; // Geeft bij een parsefout een lege array terug.
        } // Sluit foutafhandeling af.
    } // Sluit safeParse af.

    function _generateId() { // Genereert een lokaal uniek event-ID.
        return 'EVT-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8); // Combineert tijdstip en willekeurig deel.
    } // Sluit _generateId af.

    function _normalizeParticipant(participant) { // Normaliseert één deelnemer.
        return { // Bouwt het vaste deelnemersobject.
            person_id: participant && participant.person_id ? participant.person_id : null, // Bewaart gekoppeld persoon-ID of null.
            name: participant && participant.name ? participant.name : '', // Bewaart de naam.
            role: participant && participant.role ? participant.role : '' // Bewaart de rol.
        }; // Sluit deelnemerobject af.
    } // Sluit _normalizeParticipant af.

    function migrate(event) { // Migreert een event naar het actuele Events v1-model.
        if (!event || typeof event !== 'object') return null; // Weigert ongeldige records.

        var migrated = Object.assign({}, event); // Maakt een ondiepe kopie van het event.
        migrated.id = migrated.id || _generateId(); // Behoudt bestaand ID of maakt een nieuw ID.
        migrated.type = migrated.type || ''; // Vult ontbrekend type aan.
        migrated.title = migrated.title || ''; // Vult ontbrekende titel aan.
        migrated.start_date = migrated.start_date || ''; // Vult ontbrekende startdatum aan.
        migrated.end_date = migrated.end_date || ''; // Vult ontbrekende einddatum aan.
        migrated.place = migrated.place || ''; // Vult ontbrekende plaats aan.
        migrated.participants = Array.isArray(migrated.participants) ? migrated.participants.map(_normalizeParticipant) : []; // Normaliseert deelnemers.
        migrated.sources = Array.isArray(migrated.sources) ? migrated.sources : []; // Normaliseert bronnen naar een array.
        migrated.notes = migrated.notes || ''; // Vult ontbrekende notities aan.

        return migrated; // Geeft het genormaliseerde event terug.
    } // Sluit migrate af.

    function _updateModified() { // Werkt de laatste wijzigingstijd bij.
        try { // Start foutafhandeling.
            localStorage.setItem(MODIFIED_KEY, new Date().toISOString()); // Slaat de huidige tijd als ISO-string op.
        } catch (e) { // Vangt localStorage-fouten af.
            console.warn('eventStorage.js: kon modified timestamp niet opslaan:', e); // Logt de fout.
        } // Sluit foutafhandeling af.
    } // Sluit _updateModified af.

    function get() { // Haalt alle lokale events op.
        var raw = localStorage.getItem(STORAGE_KEY); // Leest de ruwe JSON uit localStorage.
        return safeParse(raw); // Parseert en geeft de eventlijst terug.
    } // Sluit get af.

    function getModified() { // Geeft de laatste wijzigingstijd terug.
        return localStorage.getItem(MODIFIED_KEY) || null; // Geeft null terug als nog nooit gewijzigd.
    } // Sluit getModified af.

    function importFromStamboom(persons) { // Importeert en synchroniseert vaste Geboorte- en Overlijden-events uit StamboomStorage-data.
        if (!Array.isArray(persons)) { // Controleert of de aangeleverde stamboomdata een array is.
            console.warn('eventStorage.js: importFromStamboom() verwacht een array.'); // Meldt ongeldige invoer.
            return { added: 0 }; // Er wordt niets geïmporteerd.
        } // Sluit invoercontrole af.

        var dataset = get(); // Leest eerst alle bestaande events zodat niets wordt overschreven.
        var existingIds = new Set(dataset.map(function (event) { // Bouwt een set van alle bestaande Event ID's.
            return event && event.id ? String(event.id) : ''; // Gebruikt alleen bestaande Event ID's.
        })); // Sluit ID-set af.
        var added = 0; // Telt hoeveel basis-events werkelijk zijn toegevoegd.
        var changed = 0; // Telt hoeveel bestaande datum- of plaatsvelden zijn bijgewerkt.

        persons.forEach(function (person) { // Verwerkt iedere persoon uit StamboomStorage.
            if (!person || !person.ID) return; // Personen zonder bestaand persoons-ID worden overgeslagen.

            var personId = String(person.ID).trim(); // Behoudt exact het bestaande StamboomStorage persoons-ID.
            if (!personId) return; // Lege persoons-ID's worden niet geïmporteerd.

            var baseEvents = [ // Definieert de twee vaste events die iedere persoon krijgt.
                {
                    id: personId + '-001', // -001 is altijd het Geboorte-event.
                    type: 'Geboorte', // Vast eventtype.
                    title: 'Geboorte', // Standaardtitel voor het basis-event.
                    start_date: person.Geboortedatum || '', // Neemt geboortedatum over of laat leeg.
                    end_date: '', // Geboorte heeft geen einddatum.
                    place: person.Geboorteplaats || '', // Neemt geboorteplaats over of laat leeg.
                    participants: [{ person_id: personId, name: '', role: '' }], // Bewaart alleen de koppeling naar het bestaande persoons-ID; geen naam in Deelnemers.
                    sources: [], // Bronnen blijven leeg voor latere aanvulling.
                    notes: '' // Notities blijven leeg voor latere aanvulling.
                },
                {
                    id: personId + '-002', // -002 is altijd het Overlijden-event.
                    type: 'Overlijden', // Vast eventtype.
                    title: 'Overlijden', // Standaardtitel voor het basis-event.
                    start_date: person.Overlijdensdatum || '', // Neemt overlijdensdatum over of laat leeg.
                    end_date: '', // Overlijden heeft geen einddatum.
                    place: person.Overlijdensplaats || '', // Neemt overlijdensplaats over of laat leeg.
                    participants: [{ person_id: personId, name: '', role: '' }], // Bewaart alleen de koppeling naar het bestaande persoons-ID; geen naam in Deelnemers.
                    sources: [], // Bronnen blijven leeg voor latere aanvulling.
                    notes: '' // Notities blijven leeg voor latere aanvulling.
                }
            ]; // Sluit definitie van de vaste basis-events af.

            baseEvents.forEach(function (event) { // Controleert Geboorte en Overlijden afzonderlijk.
                var existingIndex = dataset.findIndex(function (storedEvent) { // Zoek het vaste basis-event op Event ID.
                    return storedEvent && storedEvent.id === event.id; // Alleen exact -001 of -002 van deze persoon telt.
                }); // Sluit zoekactie af.

                if (existingIndex === -1) { // Ontbrekend basis-event wordt één keer aangemaakt.
                    dataset.push(event); // Voeg het volledige nieuwe basis-event toe.
                    existingIds.add(event.id); // Markeert het nieuwe ID direct als bestaand.
                    added++; // Verhoogt de importteller.
                    return; // Dit nieuwe event hoeft niet verder gesynchroniseerd te worden.
                } // Sluit aanmaak van ontbrekend basis-event af.

                var storedEvent = dataset[existingIndex]; // Lees het reeds bestaande Geboorte- of Overlijden-event.
                if ((storedEvent.start_date || '') !== event.start_date) { // Controleer of de stamboomdatum gewijzigd is.
                    storedEvent.start_date = event.start_date; // Synchroniseer alleen de datum vanuit StamboomStorage.
                    changed++; // Registreer een echte wijziging.
                } // Sluit datumsynchronisatie af.

                if ((storedEvent.place || '') !== event.place) { // Controleer of de stamboomplaats gewijzigd is.
                    storedEvent.place = event.place; // Synchroniseer alleen de plaats vanuit StamboomStorage.
                    changed++; // Registreer een echte wijziging.
                } // Sluit plaatssynchronisatie af.
            }); // Sluit basis-eventverwerking af.
        }); // Sluit personenverwerking af.

        if (added > 0 || changed > 0) set(dataset); // Schrijf alleen wanneer iets is toegevoegd of gesynchroniseerd.
        return { added: added, changed: changed }; // Geef terug hoeveel events zijn toegevoegd en bijgewerkt.
    } // Sluit importFromStamboom af.

    function set(dataset) { // Slaat een volledige eventdataset op.
        if (!Array.isArray(dataset)) { // Controleert of de invoer een array is.
            console.warn('eventStorage.js: set() verwacht een array.'); // Logt ongeldige invoer.
            return false; // Meldt mislukte opslag.
        } // Sluit validatie af.

        var migrated = dataset.map(migrate).filter(Boolean); // Normaliseert alle events en verwijdert ongeldige records.
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); // Slaat de eventlijst als JSON op.
        _updateModified(); // Werkt de wijzigingstijd bij.
        return true; // Meldt succesvolle opslag.
    } // Sluit set af.

    function add(event) { // Voegt één event toe.
        if (!event || typeof event !== 'object') { // Controleert de invoer.
            console.warn('eventStorage.js: add() verwacht een object.'); // Logt ongeldige invoer.
            return false; // Stopt bij ongeldige invoer.
        } // Sluit validatie af.

        var migrated = migrate(event); // Normaliseert het event.
        if (!migrated) return false; // Stopt als migratie mislukt.

        var dataset = get(); // Leest de huidige eventdataset.
        dataset.push(migrated); // Voegt het nieuwe event toe.
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset)); // Slaat de bijgewerkte eventlijst op.
        _updateModified(); // Werkt de wijzigingstijd bij.
        return true; // Meldt succesvolle toevoeging.
    } // Sluit add af.

    function update(eventID, updates) { // Werkt een bestaand event bij.
        var dataset = get(); // Leest de huidige eventdataset.
        var idx = dataset.findIndex(function (event) { return event.id === eventID; }); // Zoekt het event op ID.

        if (idx === -1) { // Controleert of het event bestaat.
            console.warn('eventStorage.js: update() event ' + eventID + ' niet gevonden.'); // Logt ontbrekend event.
            return false; // Stopt als het event niet bestaat.
        } // Sluit controle af.

        dataset[idx] = migrate(Object.assign({}, dataset[idx], updates)); // Voegt wijzigingen samen en normaliseert opnieuw.
        return set(dataset); // Slaat de bijgewerkte dataset op.
    } // Sluit update af.

    function remove(eventID) { // Verwijdert één event op ID.
        var dataset = get(); // Leest de huidige eventdataset.
        var filtered = dataset.filter(function (event) { return event.id !== eventID; }); // Verwijdert het gekozen event.

        if (filtered.length === dataset.length) { // Controleert of iets is verwijderd.
            console.warn('eventStorage.js: remove() event ' + eventID + ' niet gevonden.'); // Logt ontbrekend event.
            return false; // Meldt dat niets is verwijderd.
        } // Sluit controle af.

        return set(filtered); // Slaat de gefilterde dataset op.
    } // Sluit remove af.

    // v0.1.1 — Reset van de lokale events maakt de complete cloudstamboom niet langer 'geladen'.
    // De stamboom en de events op Supabase worden NIET verwijderd.
    function clear() { // Verwijdert uitsluitend de lokale events.
        localStorage.removeItem(STORAGE_KEY); // Wist de lokale eventdataset.
        _updateModified(); // Registreert het moment van wissen.
        // Verbreek alleen de actieve cloudkoppeling, omdat de lokale data
        // niet meer gelijk is aan de gezamenlijk geladen personen + events.
        if (window.StamboomStorage &&
            typeof window.StamboomStorage.setActiveTreeId === 'function' &&
            typeof window.StamboomStorage.setActiveTreeName === 'function') {
            window.StamboomStorage.setActiveTreeId(null);
            window.StamboomStorage.setActiveTreeName(null);
        } else {
            // Ook wanneer de stamboommodule niet op de Events-pagina geladen is.
            localStorage.removeItem('stamboomActiefId');
            localStorage.removeItem('stamboomActiefNaam');
        }
        // Andere paginaonderdelen in hetzelfde browservenster kunnen direct verversen.
        window.dispatchEvent(new CustomEvent('myfamtreecollab:events-reset'));
        return true;
    } // Sluit clear af.

    function replaceAll(dataset) { // Vervangt de volledige eventdataset.
        if (!Array.isArray(dataset)) { // Controleert of de invoer een array is.
            console.error('eventStorage.js: replaceAll() verwacht een array.'); // Logt ongeldige invoer.
            return false; // Stopt bij ongeldige invoer.
        } // Sluit validatie af.

        try { // Start foutafhandeling.
            return set(dataset); // Normaliseert en slaat de volledige dataset op.
        } catch (e) { // Vangt schrijffouten af.
            console.error('eventStorage.js: replaceAll() localStorage schrijffout:', e); // Logt de fout.
            return false; // Meldt mislukte opslag.
        } // Sluit foutafhandeling af.
    } // Sluit replaceAll af.

    window.EventStorage = { // Publiceert de Events-opslag API.
        get: get, // Haalt alle events op.
        set: set, // Slaat een volledige eventlijst op.
        add: add, // Voegt één event toe.
        update: update, // Werkt één event bij.
        remove: remove, // Verwijdert één event.
        clear: clear, // Wist alle events.
        replaceAll: replaceAll, // Vervangt alle events.
        getModified: getModified, // Geeft de laatste wijzigingstijd terug.
        importFromStamboom: importFromStamboom, // Importeert ontbrekende en synchroniseert bestaande Geboorte- en Overlijden-events uit stamboomdata.
        version: 'v0.1.1' // Publiceert de huidige moduleversie.
    }; // Sluit de publieke API af.
})(); // Sluit en voert de module direct uit.