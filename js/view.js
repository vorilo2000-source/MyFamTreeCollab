// ======================= js/view.js v1.6.5 =======================
// Boom rendering + Live search >> in LiveSearch.js + optimized code structure
// Relatie logica komt nu uit externe relatieEngine.js
//
// Wijziging v1.6.5 (sessie 26):
// - "Selecteer een persoon" en "Persoon niet gevonden" via i18nModule.t()
// - Afhankelijk van i18n.js (geladen via view.html <head>)
//
// Wijziging v1.6.4: lokale sortering verwijderd — relatieEngine.js sorteert nu centraal

(function () {
    'use strict'; // Dwingt strikte JavaScript modus af (voorkomt stille fouten)

    // =======================
    // DOM-elementen
    // =======================
    var treeBox     = document.getElementById('treeContainer'); // Container voor hoofdboom
    var BZBox       = document.getElementById('BZBox');         // Container voor broer/zus nodes
    var searchInput = document.getElementById('searchPerson');  // Zoekveld voor live search

    // =======================
    // State
    // =======================
    var dataset         = window.StamboomStorage.get() || []; // Dataset uit storage
    var selectedHoofdId = null;                               // ID van geselecteerde hoofdpersoon

    // =======================
    // HELPERS
    // =======================

    // Zorgt dat null/undefined nooit errors geven
    function safe(val) {
        return val ? String(val).trim() : '';
    }

    // Formatteer datum naar Nederlands formaat
    function formatDate(d) {
        if (!d) return '';
        d = String(d).trim();

        var date =
            /^\d{4}-\d{2}-\d{2}$/.test(d)          ? new Date(d) :
            /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(d)    ? new Date(d.replace(/(\d{2})[-/](\d{2})[-/](\d{4})/, '$3-$2-$1')) :
            /^\d{4}-\d{2}$/.test(d)                 ? new Date(d + '-01') :
            /^\d{4}$/.test(d)                       ? new Date(d + '-01-01') :
            new Date(d);

        if (isNaN(date.getTime())) return d;
        var options = { day: '2-digit', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('nl-NL', options).replace(/\./g, '');
    }

    // Zoek persoon in dataset op ID
    function findPerson(id) {
        return dataset.find(function (p) { return safe(p.ID) === safe(id); });
    }

    // =======================
    // NODE CREATOR
    // =======================
    function createTreeNode(p, rel) {
        var div = document.createElement('div'); // Maak nieuwe DOM node
        div.className = 'tree-node';             // Basis CSS class

        if (rel) div.classList.add(rel);         // Voeg relatie class toe voor kleur-styling

        var fullName = [safe(p.Roepnaam), safe(p.Prefix), safe(p.Achternaam)]
            .filter(Boolean).join(' ').trim();   // Bouw volledige naam

        var birth = formatDate(p.Geboortedatum); // Formatteer geboortedatum

        div.innerHTML =
            '<span class="id">'    + safe(p.ID) + '</span>' +
            '<span class="name">'  + fullName   + '</span>' +
            '<span class="birth">' + birth      + '</span>';

        div.dataset.id = p.ID; // Bewaar ID in dataset-attribuut

        div.addEventListener('click', function () { // Klik maakt persoon tot nieuw middelpunt
            selectedHoofdId = safe(p.ID);
            renderTree();
        });

        return div; // Geef node terug
    }

    // =======================
    // BOOM BUILDER
    // =======================
    function buildTree(rootID) {
        treeBox.innerHTML = ''; // Reset boom container
        BZBox.innerHTML   = ''; // Reset broer/zus container

        if (!rootID) {
            // Lege staat — vertaald via i18n
            treeBox.textContent = i18nModule.t('view:tree.selectPerson');
            return;
        }

        var root = findPerson(rootID);
        if (!root) {
            // Persoon onbekend — vertaald via i18n
            treeBox.textContent = i18nModule.t('view:tree.notFound');
            return;
        }

        // =======================
        // RELATIE ENGINE CALL
        // =======================
        var dataRel = window.RelatieEngine.computeRelaties(dataset, rootID);

        // =======================
        // HOOFD + PARTNER
        // =======================
        var rootWrapper = document.createElement('div');
        rootWrapper.className = 'tree-root-main';

        rootWrapper.appendChild(createTreeNode(root, 'HoofdID')); // Hoofdpersoon toevoegen

        if (root.PartnerID) {
            var partner = findPerson(safe(root.PartnerID)); // Partner zoeken
            if (partner) rootWrapper.appendChild(createTreeNode(partner, 'PHoofdID'));
        }

        treeBox.appendChild(rootWrapper);

        // =======================
        // OUDERS
        // =======================
        var parents = document.createElement('div');
        parents.className = 'tree-parents';

        if (root.VaderID) {
            var v = findPerson(safe(root.VaderID)); // Vader zoeken
            if (v) parents.appendChild(createTreeNode(v, 'VHoofdID'));
        }

        if (root.MoederID) {
            var m = findPerson(safe(root.MoederID)); // Moeder zoeken
            if (m) parents.appendChild(createTreeNode(m, 'MHoofdID'));
        }

        if (parents.children.length > 0) treeBox.prepend(parents); // Ouders boven hoofdpersoon

        // =======================
        // KINDEREN + partner (volgorde via relatieEngine.js: oud → jong)
        // =======================
        var children = dataRel.filter(function (d) {
            return ['KindID', 'HKindID', 'PHKindID'].includes(d.Relatie); // Alle kindrollen
        });

        if (children.length > 0) {
            var kidsWrap = document.createElement('div');
            kidsWrap.className = 'tree-children'; // Wrapper voor alle kinder-nodes

            children.forEach(function (k) {
                var kidGroup = document.createElement('div');
                kidGroup.className = 'tree-kid-group'; // Horizontaal groepje: kind + partner

                kidGroup.appendChild(createTreeNode(k, k.Relatie)); // Kind toevoegen

                if (k.PartnerID) {
                    var kPartner = findPerson(safe(k.PartnerID)); // Partner van kind zoeken
                    if (kPartner) kidGroup.appendChild(createTreeNode(kPartner, 'PKindID'));
                }

                kidsWrap.appendChild(kidGroup); // Groep toevoegen aan wrapper
            });

            treeBox.appendChild(kidsWrap); // Kinderen onder de boom plaatsen
        }

        // =======================
        // BROER / ZUS (volgorde via relatieEngine.js: oud → jong)
        // =======================
        var bzNodes = dataRel.filter(function (d) { return d.Relatie === 'BZID'; });

        bzNodes.forEach(function (b) {
            var bzGroup = document.createElement('div');
            bzGroup.className = 'tree-kid-group'; // Horizontaal groepje: broer/zus + partner

            bzGroup.appendChild(createTreeNode(b, 'BZID')); // Broer/zus toevoegen

            if (b.PartnerID) {
                var bPartner = findPerson(safe(b.PartnerID)); // Partner van broer/zus zoeken
                if (bPartner) bzGroup.appendChild(createTreeNode(bPartner, 'PBZID'));
            }

            BZBox.appendChild(bzGroup); // Groep toevoegen aan BZ-container
        });
    }

    // =======================
    // LIVE SEARCH INTEGRATIE
    // =======================
    searchInput.addEventListener('input', function () {
        liveSearch({
            searchInput:    searchInput,   // Input element
            dataset:        dataset,       // Huidige dataset
            displayType:    'popup',       // Popup weergave in view
            renderCallback: function (selected) {
                selectedHoofdId = safe(selected.ID); // Stel geselecteerde persoon in
                renderTree();                        // Update de boom
            }
        });
    });

    // =======================
    // INIT
    // =======================
    function renderTree() {
        buildTree(selectedHoofdId); // Bouw boom voor geselecteerde persoon
    }

    function refreshView() {
        dataset         = window.StamboomStorage.get() || []; // Dataset herladen
        selectedHoofdId = null;                               // Selectie resetten
        renderTree();                                         // Boom opnieuw renderen
    }

    refreshView(); // Initiële render bij laden pagina

})();
