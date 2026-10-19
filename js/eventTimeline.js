/* ======================= js/eventTimeline.js v0.1.11 ======================= */ // Alleen-lezen Event Timeline; geen dubbele opslag of zoekmodule.
(function () { // IIFE voorkomt globale naamconflicten.
    'use strict'; // Strikte modus voor JavaScript.

    /* ======================= ELEMENTEN EN STATE ======================= */
    var search = document.getElementById('searchPerson'); // Bestaand LiveSearch invoerveld.
    var output = document.getElementById('eventtlOutput'); // Container van de tijdlijn.
    var selected = document.getElementById('eventtlSelected'); // Geselecteerde persoon.
    var count = document.getElementById('eventtlCount'); // Aantal zichtbare gebeurtenissen.
    var buttonHorizontal = document.getElementById('eventtlHorizontal'); // Schakelknop horizontaal.
    var buttonVertical = document.getElementById('eventtlVertical'); // Schakelknop verticaal.
    var people = window.StamboomStorage ? window.StamboomStorage.get().filter(function(p){return p.published !== false;}) : []; // Lees bestaande persoonsdata.
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
    /* ======================= ONAFHANKELIJKE FOTOPOPUPS ======================= */
    var photoPopupCount = 0;
    var photoPopupZ = 2000;
    function ensurePhotoPopupStyles() {
        if (document.getElementById('eventtl-photo-popup-styles')) return;
        var style = document.createElement('style');
        style.id = 'eventtl-photo-popup-styles';
        style.textContent =
            '.eventtl-photo-popup{position:fixed;z-index:2000;width:min(580px,calc(100vw - 24px));max-height:calc(100vh - 24px);background:#fff;color:#222;border:1px solid #888;border-radius:9px;box-shadow:0 12px 40px rgba(0,0,0,.35);display:flex;flex-direction:column;overflow:hidden;}' +
            '.eventtl-photo-popup-head{display:flex;align-items:center;gap:10px;background:#f3f4f6;padding:8px 10px;cursor:move;touch-action:none;user-select:none;}' +
            '.eventtl-photo-popup-title{flex:1;min-width:0;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
            '.eventtl-photo-popup-close{border:0;background:transparent;font-size:24px;line-height:1;cursor:pointer;padding:0 5px;color:#222;}' +
            '.eventtl-photo-popup-body{overflow:auto;padding:10px;text-align:center;min-height:0;}' +
            '.eventtl-photo-popup-body img{display:block;margin:auto;max-width:100%;max-height:calc(100vh - 130px);height:auto;width:auto;object-fit:contain;}' +
            '.eventtl-media-link{cursor:zoom-in;}';
        document.head.appendChild(style);
    }
    function openPhotoPopup(entry) {
        ensurePhotoPopupStyles();
        photoPopupCount++;
        var popup = document.createElement('section');
        popup.className = 'eventtl-photo-popup';
        popup.setAttribute('role', 'dialog');
        popup.setAttribute('aria-label', 'Foto: ' + entry.name);
        popup.style.zIndex = String(++photoPopupZ);
        // Een nieuwe popup overlapt niet volledig met de voorgaande.
        var offset = (photoPopupCount - 1) % 7 * 28;
        popup.style.left = Math.max(12, Math.min(65 + offset, window.innerWidth - 300)) + 'px';
        popup.style.top = Math.max(12, Math.min(65 + offset, window.innerHeight - 180)) + 'px';
        var head = document.createElement('div');
        head.className = 'eventtl-photo-popup-head';
        var title = document.createElement('span');
        title.className = 'eventtl-photo-popup-title';
        title.textContent = entry.name;
        var close = document.createElement('button');
        close.type = 'button';
        close.className = 'eventtl-photo-popup-close';
        close.textContent = '×';
        close.title = 'Foto sluiten';
        close.setAttribute('aria-label', 'Foto sluiten');
        close.addEventListener('click', function () { popup.remove(); });
        head.appendChild(title);
        head.appendChild(close);
        var body = document.createElement('div');
        body.className = 'eventtl-photo-popup-body';
        var img = document.createElement('img');
        img.src = entry.url;
        img.alt = entry.name;
        img.referrerPolicy = 'no-referrer';
        img.addEventListener('error', function () { body.textContent = 'Foto kon niet worden geladen.'; });
        body.appendChild(img);
        popup.appendChild(head);
        popup.appendChild(body);
        popup.addEventListener('pointerdown', function () { popup.style.zIndex = String(++photoPopupZ); });
        // Alleen de titelbalk is versleepbaar; foto blijft normaal selecteerbaar.
        head.addEventListener('pointerdown', function (event) {
            if (event.target === close || close.contains(event.target) || event.button !== 0) return;
            var startX = event.clientX, startY = event.clientY;
            var rect = popup.getBoundingClientRect();
            head.setPointerCapture(event.pointerId);
            function move(e) {
                var left = Math.max(0, Math.min(window.innerWidth - 65, rect.left + e.clientX - startX));
                var top = Math.max(0, Math.min(window.innerHeight - 44, rect.top + e.clientY - startY));
                popup.style.left = left + 'px'; popup.style.top = top + 'px';
            }
            function stop(e) { head.removeEventListener('pointermove', move); head.removeEventListener('pointerup', stop); head.removeEventListener('pointercancel', stop); try { head.releasePointerCapture(e.pointerId); } catch (_) {} }
            head.addEventListener('pointermove', move);
            head.addEventListener('pointerup', stop);
            head.addEventListener('pointercancel', stop);
        });
        document.body.appendChild(popup);
        close.focus();
    }
    function addMedia(card, sources) { // Maak een afzonderlijk uitklapbaar fotovak per gebeurtenis.
        var images = []; // Bewaar uitsluitend geldige afbeeldingsbronnen.
        sources.forEach(function (source) { // Lees bestaande EventStorage-bronnen zonder mutatie.
            var raw = typeof source === 'string' ? source : source && source.url; // URL uit bronvorm lezen.
            var url = safeExternalURL(raw); // Alleen HTTP(S)-bronnen accepteren.
            var name = asText(typeof source === 'string' ? source : source && source.name) || 'Foto'; // Bestaand bronlabel.
            if (url && isImageSource(url)) images.push({ url: url, name: name }); // Alleen afbeeldingsbronnen.
        }); // Bronnen zijn verwerkt.
        if (!images.length) return; // Geen leeg fotovak weergeven.
        var panel = document.createElement('details'); // Native uitklapbaar fotovak.
        panel.className = 'eventtl-photo-panel'; // Eigen CSS zonder de details voor bronnen te beïnvloeden.
        var summary = document.createElement('summary'); // Klikbare sectiekop.
        summary.textContent = "Foto's (" + images.length + ')'; // Aantal media vermelden.
        panel.appendChild(summary); // Sectiekop toevoegen.
        var media = document.createElement('div'); // Container voor de afbeeldingen.
        media.className = 'eventtl-media'; // Flexibele iconenstrook.
        panel.appendChild(media); // Leeg totdat gebruiker uitklapt.
        panel.addEventListener('toggle', function () { // Laad afbeeldingen pas na expliciet openen.
            if (!panel.open || panel.dataset.loaded === 'true') return; // Geen herhaalde netwerkrequests.
            panel.dataset.loaded = 'true'; // Eenmalig vullen.
            images.forEach(function (entry) { // Afbeeldingen omzetten naar aanklikbare pictogrammen.
                var link = document.createElement('a'); // Klik opent het origineel.
                link.href = entry.url; // Gevalideerde afbeeldings-URL blijft beschikbaar bij ontbreken van JavaScript.
                link.addEventListener('click', function (event) { // Foto in een eigen venster boven de tijdlijn.
                    event.preventDefault();
                    openPhotoPopup(entry); // Sluit andere foto-popups niet.
                });
                link.className = 'eventtl-media-link'; // Compact thumbnailkader.
                link.title = entry.name; // Toegankelijke naam.
                link.setAttribute('aria-label', 'Afbeelding openen: ' + entry.name); // Screenreader-label.
                var image = document.createElement('img'); // Pas nu wordt een afbeeldingselement aangemaakt.
                image.alt = entry.name; // Alternatieve tekst.
                image.loading = 'lazy'; // Browser laadt thumbnails indien nodig.
                image.decoding = 'async'; // Asynchrone decodering.
                image.referrerPolicy = 'no-referrer'; // Geen pagina-URL doorgeven.
                image.src = entry.url; // Alleen laden nadat het fotovak is geopend.
                image.addEventListener('error', function () { // Onbereikbare beelden opvangen.
                    link.classList.add('eventtl-media-error'); // Visuele foutmarkering.
                    image.remove(); // Verwijder kapotte thumbnail.
                    link.textContent = 'Foto'; // Bronlink blijft klikbaar.
                }); // Einde foutmelding.
                link.appendChild(image); // Afbeelding opnemen.
                media.appendChild(link); // Pictogram aan fotovak toevoegen.
            }); // Einde afbeeldingenlus.
        }); // Einde open-event.
        card.appendChild(panel); // Het fotovak staat onder de inhoud of rechts in verticale modus.
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
        // Toon uitsluitend de inhoud van de kolom Deelnemers (event.participants[].name).
        // person_id koppelt het event aan de geselecteerde persoon, maar is geen deelnemernaam.
        // Nooit automatisch de geselecteerde persoon, een naam uit de stamboom of een ID toevoegen.
        var participants = Array.isArray(event.participants) ? event.participants : [];
        var participantNames = participants.map(function (p) {
            return p ? asText(p.name) : '';
        }).filter(Boolean);
        if (participantNames.length) {
            var participantLine = addText(body, 'p', 'Deelnemers: ' + participantNames.join('\n'), 'eventtl-participants');
            participantLine.style.whiteSpace = 'pre-line';
        }
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
        var events = window.EventStorage.get().filter(function (event) { return event && event.published === true && matchesPerson(event, selectedId); }); // Lees alleen relevante events.
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
        if (undated.length) { // Zet ongedateerde gebeurtenissen IN DEZELFDE tekstregel als de telling, zonder afzonderlijk element.
            var labels = undated.map(function (event) { return asText(event.title || event.type) || 'Gebeurtenis'; }); // Titel per ongedateerd event.
            count.textContent += ' ' + undated.length + ' zonder datum: ' + labels.join(', ') + '.'; // Eén doorlopende regel die vanzelf afbreekt op smalle schermen.
        } // Geen apart blok of aparte lijst voor ongedateerde gebeurtenissen.
    } // Sluit render af.

    /* ======================= GESELECTEERD PERSOONSPORTRET ======================= */
    function renderSelectedPerson(person) { // Toon hetzelfde persoonsportret als in de Stamboom Viewer.
        selected.replaceChildren(); // Verwijder vorige naam en vorige foto zonder innerHTML.
        if (!person) { // Onbekend persoons-ID heeft geen gekoppelde afbeelding.
            addText(selected, 'span', selectedId || '', 'eventtl-selected-name'); // Behoud een leesbare selectie.
            return; // Klaar zonder persoonsgegevens.
        } // Einde ontbrekende persoon.
        var portrait = document.createElement('span'); // Container voor portret of standaardbuste.
        portrait.className = 'eventtl-person-avatar'; // Gebruik eigen compacte layoutklasse.
        var url = safeExternalURL(person.PortretURL); // Hergebruik de portretlink uit StamboomStorage.
        if (url && isImageSource(url)) { // Toon alleen herkenbare afbeeldingsadressen.
            var img = document.createElement('img'); // Maak miniatuur naast de naam.
            img.src = url; // Cloudinary of een andere geldige afbeeldingsprovider.
            img.alt = 'Portret van ' + personName(person); // Toegankelijke omschrijving.
            img.loading = 'lazy'; // Afbeelding laden wanneer zichtbaar.
            img.referrerPolicy = 'no-referrer'; // Deel geen pagina-URL met externe host.
            img.addEventListener('error', function () { // Val terug bij een onbereikbare bron.
                portrait.replaceChildren(); // Verwijder mislukte afbeelding.
                portrait.textContent = '👤'; // Toon dezelfde standaardbuste als fallback.
            }); // Einde foutafhandeling.
            portrait.appendChild(img); // Portret toevoegen.
        } else { // Nog geen bruikbare portretlink.
            portrait.textContent = '👤'; // Standaardbuste blijft zichtbaar.
        } // Einde portretkeuze.
        selected.appendChild(portrait); // Portret altijd vóór de naam.
        addText(selected, 'span', personName(person) + ' (' + selectedId + ')', 'eventtl-selected-name'); // Naam en ID naast buste.
    } // Sluit renderSelectedPerson af.

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
            renderSelectedPerson(person); // Toon buste of PortretURL vóór de geselecteerde naam.
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
