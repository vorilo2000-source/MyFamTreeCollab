/* ======================= js/eventTimeline.js v0.1.0 ======================= */ // Alleen-lezen Event Timeline; geen dubbele opslag of zoekmodule.
(function () { // IIFE voorkomt globale naamconflicten.
    'use strict'; // Strikte modus voor JavaScript.

    /* ======================= ELEMENTEN EN STATE ======================= */
    var search = document.getElementById('searchPerson'); // Bestaand LiveSearch invoerveld.
    var output = document.getElementById('eventtlOutput'); // Container van de tijdlijn.
    var selected = document.getElementById('eventtlSelected'); // Geselecteerde persoon.
    var count = document.getElementById('eventtlCount'); // Aantal zichtbare gebeurtenissen.
    var buttonHorizontal = document.getElementById('eventtlHorizontal'); // Schakelknop horizontaal.
    var buttonVertical = document.getElementById('eventtlVertical'); // Schakelknop verticaal.
    var people = window.StamboomStorage ? window.StamboomStorage.get() : []; // Lees bestaande persoonsdata.
    var selectedId = null; // Nog geen persoon geselecteerd.
    var orientation = 'horizontal'; // Horizontaal is de standaardweergave.

    /* ======================= VEILIGE HELPERS ======================= */
    function asText(value) { // Zet onbekende data om naar een leesbare string.
        return value == null ? '' : String(value).trim(); // Null en undefined worden leeg.
    } // Sluit asText af.
    function addText(parent, tag, text, className) { // Maakt DOM-tekst zonder HTML-injectie.
        var element = document.createElement(tag); // Maak het gevraagde element.
        element.textContent = asText(text); // Gebruik textContent voor onbetrouwbare tekst.
        if (className) element.className = className; // Pas optionele CSS-klasse toe.
        parent.appendChild(element); // Voeg toe aan bestaande container.
        return element; // Geef het element terug.
    } // Sluit addText af.
    function safeExternalURL(value) { // Accepteert alleen browser-veilige HTTP(S)-adressen.
        try { // URL kan ongeldig zijn.
            var url = new URL(asText(value)); // Valideer absolute URL.
            return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''; // Blokkeer javascript en data URL's.
        } catch (error) { // Ongeldige URL afhandelen.
            return ''; // Geen klikbare link.
        } // Sluit try/catch af.
    } // Sluit safeExternalURL af.
    function dateKey(value) { // Bereken sorteersleutel zonder onbedoelde tijdzoneverschuiving.
        var input = asText(value); // Originele datumwaarde.
        var match = input.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/); // Ondersteunt ISO-datums en jaren.
        if (match) return Number(match[1]) * 10000 + Number(match[2] || 1) * 100 + Number(match[3] || 1); // Numerieke kalenderordening.
        var parsed = Date.parse(input); // Probeer andere datumformaten.
        if (!Number.isNaN(parsed)) { // Alleen geldige parseresultaten.
            var d = new Date(parsed); // Datumobject voor jaar, maand en dag.
            return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); // Kalenderordening.
        } // Sluit datumcontrole af.
        return null; // Onbekende datum apart tonen.
    } // Sluit dateKey af.
    function personName(person) { // Formatteert bestaande persoonsvelden.
        return [person.Roepnaam || person.Doopnaam, person.Prefix, person.Achternaam].map(asText).filter(Boolean).join(' ') || asText(person.ID); // Toon leesbare naam of ID.
    } // Sluit personName af.
    function sourceObjects(event) { // Leest de bestaande eventbronnen zonder aanpassing.
        return Array.isArray(event.sources) ? event.sources.filter(Boolean) : []; // EventStorage bewaart bronobjecten in array.
    } // Sluit sourceObjects af.
    function matchesPerson(event, id) { // Match uitsluitend op canonieke participant.person_id.
        return Array.isArray(event.participants) && event.participants.some(function (p) { // Controleer deelnemerslijst.
            return p && asText(p.person_id) === id; // Exact bestaand persoons-ID.
        }); // Sluit participant-check af.
    } // Sluit matchesPerson af.

    /* ======================= GEBEURTENISDETAILS ======================= */
    function buildCard(event) { // Maak een herbruikbare gebeurteniskaart voor beide richtingen.
        var card = document.createElement('article'); // Basis van de kaart.
        card.className = 'eventtl-card'; // Gebruik gedeelde styling.
        addText(card, 'div', event.start_date || 'Datum onbekend', 'eventtl-date'); // Startdatum als hoofddatum.
        addText(card, 'h3', event.title || event.type || 'Gebeurtenis'); // Toon titel of type.
        if (event.type && event.title && event.type !== event.title) addText(card, 'p', 'Type: ' + event.type); // Voeg afwijkend type toe.
        if (event.end_date) addText(card, 'p', 'Tot: ' + event.end_date); // Toon einddatum indien aanwezig.
        if (event.place) addText(card, 'p', 'Plaats: ' + event.place); // Toon plaats indien aanwezig.
        var details = document.createElement('details'); // Details blijven ingeklapt.
        var summary = document.createElement('summary'); // Klikbare detailskop.
        summary.textContent = 'Details en bronnen'; // Beknopte actie.
        details.appendChild(summary); // Plaats de kop.
        if (event.notes) addText(details, 'p', event.notes); // Toon eventuele opmerkingen.
        var participants = Array.isArray(event.participants) ? event.participants : []; // Lees deelnemers.
        if (participants.length) { // Toon alleen als deelnemers bestaan.
            addText(details, 'strong', 'Betrokken personen'); // Sectietitel.
            var names = participants.map(function (p) { // Bouw deelnemerslabels.
                var linked = people.find(function (person) { return asText(person.ID) === asText(p && p.person_id); }); // Zoek persoon via bestaande opslag.
                return linked ? personName(linked) : asText(p && (p.name || p.person_id)); // Fallback naar oorspronkelijke deelnemergegevens.
            }).filter(Boolean); // Sla lege deelnemersnamen over.
            addText(details, 'p', names.join(', ') || 'Niet gespecificeerd'); // Toon deelnemers als tekst.
        } // Sluit deelnemersweergave af.
        var sources = sourceObjects(event); // Lees bestaande bronnen.
        if (sources.length) { // Toon alleen wanneer broninformatie bestaat.
            addText(details, 'strong', 'Bronnen en media'); // Sectietitel.
            var list = document.createElement('ul'); // Lijst met bronnen.
            sources.forEach(function (source) { // Verwerk ieder bronobject.
                var item = document.createElement('li'); // Eén bronitem.
                var raw = typeof source === 'string' ? source : source.url; // Ondersteun bronobject en oudere stringwaarde.
                var url = safeExternalURL(raw); // Controleer veilig linkprotocol.
                var name = asText(typeof source === 'string' ? source : source.name) || 'Bron openen'; // Lees de bronnaam.
                if (url) { // Maak uitsluitend bij geldige URL een link.
                    var anchor = document.createElement('a'); // Klikbare externe verwijzing.
                    anchor.href = url; // URL wordt niet tijdens rendering opgehaald.
                    anchor.textContent = name; // Veilige linktekst.
                    anchor.target = '_blank'; // Open bron alleen na klik.
                    anchor.rel = 'noopener noreferrer'; // Beperk toegang vanuit externe website.
                    item.appendChild(anchor); // Voeg link toe.
                } else { // Bron heeft geen veilige URL.
                    item.textContent = name; // Alleen tekst tonen.
                } // Sluit URL-afhandeling af.
                list.appendChild(item); // Voeg bron toe aan lijst.
            }); // Sluit bronnenlus af.
            details.appendChild(list); // Plaats bronnenlijst.
        } // Sluit bronnenweergave af.
        if (!event.notes && !participants.length && !sources.length) addText(details, 'p', 'Geen aanvullende informatie.'); // Lege detailsmelding.
        card.appendChild(details); // Details standaard gesloten bewaren.
        return card; // Retourneer kaart zonder afbeeldingsverzoeken.
    } // Sluit buildCard af.

    /* ======================= RENDERING ======================= */
    function render() { // Teken vanuit de actuele eventopslag en selectie.
        output.replaceChildren(); // Ruim vorige weergave op.
        count.textContent = ''; // Reset de telling.
        if (!selectedId) { addText(output, 'div', 'Selecteer een persoon om gebeurtenissen te bekijken.', 'eventtl-empty'); return; } // Wacht op selectie.
        if (!window.EventStorage || typeof window.EventStorage.get !== 'function') { addText(output, 'div', 'EventStorage is niet beschikbaar. Controleer js/eventStorage.js.', 'eventtl-empty'); return; } // Meld ontbrekende module.
        var events = window.EventStorage.get().filter(function (event) { return event && matchesPerson(event, selectedId); }); // Lees alleen relevante events.
        var dated = events.filter(function (event) { return dateKey(event.start_date) !== null; }); // Datum bekende events.
        var undated = events.filter(function (event) { return dateKey(event.start_date) === null; }); // Events zonder datum.
        dated.sort(function (a, b) { return dateKey(a.start_date) - dateKey(b.start_date) || asText(a.id).localeCompare(asText(b.id)); }); // Oudste eerst, stabiel bij gelijke datum.
        count.textContent = events.length + ' gebeurtenis' + (events.length === 1 ? '' : 'sen') + ' gevonden.'; // Toon resultaten.
        if (!events.length) { addText(output, 'div', 'Geen gebeurtenissen gevonden voor deze persoon.', 'eventtl-empty'); return; } // Lege lijst.
        var timeline = document.createElement('div'); // Maak de tijdascontainer.
        timeline.className = orientation === 'horizontal' ? 'eventtl-horizontal' : 'eventtl-vertical'; // Richting bepalen.
        var track = orientation === 'horizontal' ? document.createElement('div') : timeline; // Binnenbaan alleen horizontaal.
        if (orientation === 'horizontal') { track.className = 'eventtl-track'; timeline.appendChild(track); } // Voeg horizontale baan toe.
        dated.forEach(function (event) { // Voeg ieder gedateerd event toe.
            var item = document.createElement('div'); // Container met tijdasmarkering.
            item.className = orientation === 'horizontal' ? 'eventtl-track-item' : 'eventtl-vertical-item'; // Richtingafhankelijke klasse.
            item.appendChild(buildCard(event)); // Hergebruik dezelfde detailskaart.
            track.appendChild(item); // Voeg event aan tijdas toe.
        }); // Sluit eventlus af.
        if (dated.length) output.appendChild(timeline); // Toon tijdas alleen bij gedateerde events.
        if (undated.length) { // Groepeer onbekende datums apart.
            var section = document.createElement('section'); // Sectie voor ongedateerde gebeurtenissen.
            section.className = 'eventtl-undated'; // Sectie CSS.
            addText(section, 'h2', 'Gebeurtenissen zonder datum'); // Duidelijke groepering.
            var grid = document.createElement('div'); // Responsive raster.
            grid.className = 'eventtl-undated-grid'; // Rasterstijl.
            undated.forEach(function (event) { grid.appendChild(buildCard(event)); }); // Voeg ongedateerde kaarten toe.
            section.appendChild(grid); // Raster in sectie.
            output.appendChild(section); // Sectie onder de tijdas.
        } // Sluit sectie zonder datum af.
    } // Sluit render af.

    /* ======================= SELECTIE EN BESTURING ======================= */
    function setOrientation(next) { // Wissel uitsluitend de presentatierichting.
        orientation = next; // Bewaar huidige richting.
        buttonHorizontal.setAttribute('aria-pressed', String(next === 'horizontal')); // Bijwerken knop horizontaal.
        buttonVertical.setAttribute('aria-pressed', String(next === 'vertical')); // Bijwerken knop verticaal.
        render(); // Teken dezelfde gebeurtenissen opnieuw.
    } // Sluit setOrientation af.
    buttonHorizontal.addEventListener('click', function () { setOrientation('horizontal'); }); // Horizontaal kiezen.
    buttonVertical.addEventListener('click', function () { setOrientation('vertical'); }); // Verticaal kiezen.
    if (typeof window.initLiveSearch === 'function') { // Gebruik de centrale Manage-zoekfunctie.
        window.initLiveSearch(search, people, function (personId) { // Callback krijgt geselecteerd persoons-ID.
            selectedId = asText(personId); // Houd canoniek persoons-ID aan.
            var person = people.find(function (p) { return asText(p.ID) === selectedId; }); // Zoek geselecteerd record.
            selected.textContent = person ? personName(person) + ' (' + selectedId + ')' : selectedId; // Toon actieve persoon.
            render(); // Toon gebeurtenissen.
        }); // Sluit LiveSearch-init af.
    } else { // Module ontbreekt.
        selected.textContent = 'LiveSearch is niet beschikbaar. Controleer js/LiveSearch.js.'; // Geef zichtbare fout.
    } // Sluit initialisatie af.
    document.addEventListener('click', function (event) { // Gedrag gelijk aan Manage voor zoekpopup.
        var popup = document.getElementById('searchPopup'); // Lees de bestaande popup.
        if (popup && event.target !== search && !popup.contains(event.target)) popup.remove(); // Sluit buiten popup.
    }); // Sluit documentlistener af.
})(); // Sluit IIFE af.
