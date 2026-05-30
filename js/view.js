// ======================= js/view.js v1.7.0 =======================
// Boom rendering + Live search >> in LiveSearch.js + optimized code structure
// Relatie logica komt nu uit externe relatieEngine.js
//
// Wijziging v1.7.0 (sessie 35 — F3-48):
// - VaderID, MoederID, PartnerID ondersteunen nu meerdere waarden via | scheiding
// - Alle directe findPerson(safe(x.PartnerID)) vervangen door parsePartners() loop
// - Meerdere ouders, partners, kind-partners en BZ-partners worden correct getoond
//
// Wijziging v1.6.5 (sessie 26):
// - "Selecteer een persoon" en "Persoon niet gevonden" via i18nModule.t()
//
// Wijziging v1.6.4: lokale sortering verwijderd — relatieEngine.js sorteert centraal

(function () {
    'use strict'; // Dwingt strikte JavaScript modus af

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

    // Splits |-gescheiden ID-veld naar array van gevonden personen
    // Gebruikt schema.parsePartners() — zelfde helper als manage.js
    function findMultiple(fieldValue) {
        return window.StamboomSchema.parsePartners(fieldValue || '') // Splits op |
            .map(function (id) { return findPerson(id); })           // Zoek elk ID op
            .filter(Boolean);                                        // Verwijder niet-gevonden
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

        return div;
    }

    // =======================
    // BOOM BUILDER
    // =======================
    function buildTree(rootID) {
        treeBox.innerHTML = ''; // Reset boom container
        BZBox.innerHTML   = ''; // Reset broer/zus container

        if (!rootID) {
            treeBox.textContent = i18nModule.t('view:tree.selectPerson'); // Lege staat
            return;
        }

        var root = findPerson(rootID);
        if (!root) {
            treeBox.textContent = i18nModule.t('view:tree.notFound'); // Persoon onbekend
            return;
        }

        // =======================
        // RELATIE ENGINE CALL
        // =======================
        var dataRel = window.RelatieEngine.computeRelaties(dataset, rootID);

        // =======================
        // HOOFD + PARTNERS (meerdere via |)
        // =======================
        var rootWrapper = document.createElement('div');
        rootWrapper.className = 'tree-root-main';             // Horizontale rij: hoofd + partners

        rootWrapper.appendChild(createTreeNode(root, 'HoofdID')); // Hoofdpersoon altijd eerst

        // Alle partners ophalen via parsePartners() — was: findPerson(safe(root.PartnerID))
        findMultiple(root.PartnerID).forEach(function (partner) {
            rootWrapper.appendChild(createTreeNode(partner, 'PHoofdID')); // Elke partner als node
        });

        treeBox.appendChild(rootWrapper);

        // =======================
        // OUDERS (meerdere via |)
        // =======================
        var parents = document.createElement('div');
        parents.className = 'tree-parents';                   // Horizontale rij boven hoofdpersoon

        // Alle vaders — was: findPerson(safe(root.VaderID))
        findMultiple(root.VaderID).forEach(function (v) {
            parents.appendChild(createTreeNode(v, 'VHoofdID')); // Elke vader als node
        });

        // Alle moeders — was: findPerson(safe(root.MoederID))
        findMultiple(root.MoederID).forEach(function (m) {
            parents.appendChild(createTreeNode(m, 'MHoofdID')); // Elke moeder als node
        });

        if (parents.children.length > 0) treeBox.prepend(parents); // Ouders boven boom plaatsen

        // =======================
        // KINDEREN + partners (meerdere via |)
        // =======================
        var children = dataRel.filter(function (d) {
            return ['KindID', 'HKindID', 'PHKindID'].includes(d.Relatie); // Alle kindrollen
        });

        if (children.length > 0) {
            var kidsWrap = document.createElement('div');
            kidsWrap.className = 'tree-children';             // Wrapper voor alle kinder-nodes

            children.forEach(function (k) {
                var kidGroup = document.createElement('div');
                kidGroup.className = 'tree-kid-group';        // Horizontaal groepje: kind + partners

                kidGroup.appendChild(createTreeNode(k, k.Relatie)); // Kind toevoegen

                // Alle partners van het kind — was: findPerson(safe(k.PartnerID))
                findMultiple(k.PartnerID).forEach(function (kPartner) {
                    kidGroup.appendChild(createTreeNode(kPartner, 'PKindID')); // Partner van kind
                });

                kidsWrap.appendChild(kidGroup); // Groep toevoegen aan wrapper
            });

            treeBox.appendChild(kidsWrap); // Kinderen onder de boom plaatsen
        }

        // =======================
        // BROER / ZUS + partners (meerdere via |)
        // =======================
        var bzNodes = dataRel.filter(function (d) { return d.Relatie === 'BZID'; });

        bzNodes.forEach(function (b) {
            var bzGroup = document.createElement('div');
            bzGroup.className = 'tree-kid-group';             // Horizontaal groepje: BZ + partners

            bzGroup.appendChild(createTreeNode(b, 'BZID'));   // Broer/zus toevoegen

            // Alle partners van broer/zus — was: findPerson(safe(b.PartnerID))
            findMultiple(b.PartnerID).forEach(function (bPartner) {
                bzGroup.appendChild(createTreeNode(bPartner, 'PBZID')); // Partner van broer/zus
            });

            BZBox.appendChild(bzGroup); // Groep toevoegen aan BZ-container
        });
    }

    // =======================
    // LIVE SEARCH INTEGRATIE
    // =======================
    searchInput.addEventListener('input', function () {
        liveSearch({
            searchInput:    searchInput,
            dataset:        dataset,
            displayType:    'popup',
            renderCallback: function (selected) {
                selectedHoofdId = safe(selected.ID);
                renderTree();
            }
        });
    });

    // =======================
    // INIT
    // =======================
    function renderTree() {
        buildTree(selectedHoofdId);
    }

    function refreshView() {
        dataset         = window.StamboomStorage.get() || [];
        selectedHoofdId = null;
        renderTree();
    }

    refreshView();

})();
