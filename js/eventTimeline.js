/* ======================= js/eventTimeline.js v0.1.2 ======================= */ // Alleen-lezen Event Timeline; geen dubbele opslag of zoekmodule.
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

    /* ======================= MEDIA EN BRONNEN ======================= */
    function isImageSource(url) { // Herken uitsluitend plausibele directe afbeeldings-URL's.
        try { // Parse de bron-URL zonder netwerkaanroep.
            var parsed = new URL(url); // Gebruik genormaliseerde hostname en pathname.
            var path = parsed.pathname.toLowerCase(); // Vergelijk extensies zonder hoofdletterverschil.
            return /\.(?:png|jpe?g|gif|webp|avif|bmp|svg)$/.test(path) || // Herken bestandslinks van verschillende providers.
                (parsed.hostname === 'res.cloudinary.com' && /\/image\/upload\//.test(path)); // Cloudinary levert vaak beelden zonder extensie.
        } catch (error) { return false; } // Een ongeldige URL is nooit afbeeldingsbron.
    } // Sluit isImageSource af.
    function displaySourceLink(parent, name, url) { // Bouw een externe bronlink zonder HTML-injectie.
        var anchor = document.createElement('a'); // Maak echte hyperlink.
        anchor.href = url; // Alleen reeds gevalideerde URL.
        anchor.target = '_blank'; // Open in nieuw tabblad na gebruikersactie.
        anchor.rel = 'noopener noreferrer'; // Beperk toegang vanuit externe site.
        anchor.textContent = name; // Naam veilig als tekst.
        parent.appendChild(anchor); // Plaats in kaart.
    } // Sluit displaySourceLink af.
    function addMedia(card, sources) { // Toon beeldbronnen compact en overige bronnen als links.
        var images = []; // Afbeeldingen met directe URL.
        var others = []; // Overige bronnen, waaronder documenten.
        sources.forEach(function (source) { // Beoordeel iedere bestaande source zonder opslag te veranderen.
            var raw = typeof source === 'string' ? source : source && source.url; // Ondersteun oudere strings.
            var url = safeExternalURL(raw); // Verbied onveilige protocollen.
            var name = asText(typeof source === 'string' ? source : source && source.name) || 'Bron openen'; // Toon bronlabel.
            (url && isImageSource(url) ? images : others).push({ url: url, name: name }); // Sorteer media van documenten.
        }); // Sluit bronnenverwerking af.
        if (images.length) { // Alleen afbeeldingen tonen wanneer links aanwezig zijn.
            var media = document.createElement('div'); // Flexibele thumbnailstrip.
            media.className = 'eventtl-media'; // Layout verschilt per tijdlijnrichting.
            images.forEach(function (entry) { // Bouw compacte fotokaart.
                var link = document.createElement('a'); // Klik toont originele afbeelding.
                link.href = entry.url; // Veilige directe afbeeldings-URL.
                link.target = '_blank'; // Voor volledige weergave in apart tabblad.
                link.rel = 'noopener noreferrer'; // Veilige externe navigatie.
                link.className = 'eventtl-media-link'; // CSS thumbnailkader.
                link.title = entry.name; // Benoem het bronbestand.
                link.setAttribute('aria-label', 'Afbeelding openen: ' + entry.name); // Toegankelijke linknaam.
                var image = document.createElement('img'); // Miniatuur opbouwen.
                image.alt = entry.name; // Alternatieve tekst.
                image.loading = 'lazy'; // Haal pas afbeeldingen op wanneer zichtbaar.
                image.decoding = 'async'; // Decodeer afbeeldingen buiten de hoofdthread.
                image.referrerPolicy = 'no-referrer'; // Deel geen pagina-URL als referer.
                image.src = entry.url; // Publieke bron: browser laadt thumbnail pas bij zichtbaarheid.
                image.addEventListener('error', function () { // Fout bij ontbrekend of verboden beeld.
                    link.classList.add('eventtl-media-error'); // Gebruik neutraal gebroken afbeeldingspictogram.
                    image.remove(); // Verwijder gebroken img-pictogram van browser.
                    link.textContent = 'Afbeelding'; // Link naar bron blijft beschikbaar.
                }); // Sluit foutcallback af.
                link.appendChild(image); // Plaats miniatuur in link.
                media.appendChild(link); // Plaats link in thumbnailstrip.
            }); // Sluit miniaturen af.
            card.appendChild(media); // Onder kaartinhoud; in verticale stand rechts via CSS.
        } // Sluit afbeeldingsweergave af.
        return others; // Niet-afbeeldingsbronnen worden in details weergegeven.
    } // Sluit addMedia af.

    /* ======================= GEBEURTENISDETAILS ======================= */
    function buildCard(event) { // Bouw dezelfde alleen-lezen kaart in beide richtingen.
        var card = document.createElement('article'); // Basis van een eventkaart.
        card.className = 'eventtl-card'; // Gedeelde presentatieregels.
        var body = document.createElement('div'); // Tekstgedeelte dat naast foto's kan staan.
        body.className = 'eventtl-card-body'; // Flexibele kolom voor verticale layout.
        addText(body, 'div', event.start_date || 'Datum onbekend', 'eventtl-date'); // Hoofddatum.
        addText(body, 'h3', event.title || event.type || 'Gebeurtenis'); // Eventtitel.
        if (event.type && event.title && event.type !== event.title) addText(body, 'p', 'Type: ' + event.type); // Alleen afwijkend type.
        if (event.end_date) addText(body, 'p', 'Tot: ' + event.end_date); // Einddatum indien beschikbaar.
        if (event.place) addText(body, 'p', 'Plaats: ' + event.place); // Plaatsnaam indien beschikbaar.
        var participants = Array.isArray(event.participants) ? event.participants : []; // Canonieke deelnemers.
        var extras = participants.filter(function (p) { // Onderdruk alleen de geselecteerde hoofdpersoon.
            return p && asText(p.person_id) !== selectedId && (asText(p.person_id) || asText(p.name)); // Andere gekoppelde of los benoemde deelnemers.
        }); // Sluit extra-deelnemersfilter af.
        if (extras.length) { // Toon uitsluitend andere deelnemers.
            var names = extras.map(function (p) { // Zet deelnemer om naar bestaande persoonsnaam.
                var linked = people.find(function (person) { return asText(person.ID) === asText(p.person_id); }); // Hergebruik persoonsdataset.
                var name = linked ? personName(linked) : asText(p.name || p.person_id); // Fallback voor losse deelnemers.
                return name + (p.role ? ' (' + asText(p.role) + ')' : ''); // Rol alleen indien bekend.
            }).filter(Boolean); // Onderdruk lege labels.
            if (names.length) addText(body, 'p', 'Deelnemers: ' + names.join(', '), 'eventtl-participants'); // Alleen extra personen.
        } // Sluit deelnemerweergave af.
        var details = document.createElement('details'); // Bronverwijzingen en notities uitklapbaar.
        var summary = document.createElement('summary'); // Samenvatting voor inklappen.
        summary.textContent = 'Details en bronnen'; // Beknopte actie.
        details.appendChild(summary); // Plaats uitklapbare kop.
        if (event.notes) addText(details, 'p', event.notes); // Eventnotities veilig tonen.
        var sources = sourceObjects(event); // Gebruik canonieke sources[] van EventStorage.
        var nonImages = sources.filter(function (source) { // Scheid bronnen zonder afbeeldings-URL.
            var raw = typeof source === 'string' ? source : source && source.url; // Lees URL uit bekende bronvorm.
            var url = safeExternalURL(raw); // Valideer HTTP(S).
            return !url || !isImageSource(url); // Afbeeldingen krijgen zichtbare miniaturen.
        }); // Sluit filtering af.
        if (nonImages.length) { // Alleen wanneer er overige bronnen zijn.
            addText(details, 'strong', 'Bronnen'); // Sectietitel.
            var list = document.createElement('ul'); // Eenvoudige bronnenlijst.
            nonImages.forEach(function (source) { // Toon elke gewone bron afzonderlijk.
                var item = document.createElement('li'); // Bronlijstitem.
                var raw = typeof source === 'string' ? source : source && source.url; // Bronadres.
                var url = safeExternalURL(raw); // Gevalideerde bronlink.
                var name = asText(typeof source === 'string' ? source : source && source.name) || 'Bron openen'; // Label.
                if (url) displaySourceLink(item, name, url); else item.textContent = name; // Maak link uitsluitend bij geldig adres.
                list.appendChild(item); // Voeg bron toe.
            }); // Sluit bronnenlus af.
            details.appendChild(list); // Bronnen staan in ingeklapte details.
        } // Sluit gewone bronnen af.
        if (!event.notes && !sources.length) addText(details, 'p', 'Geen aanvullende informatie.'); // Lege detailsmelding.
        body.appendChild(details); // Details in tekstdeel.
        card.appendChild(body); // Tekstdeel eerst.
        addMedia(card, sources); // Afbeeldingen onder of rechts naast het tekstdeel.
        return card; // Eventkaart gereed.
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
        timeline.dataset.orientation = orientation; // Markeer de richting expliciet voor inspectie en stylesheet.
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
