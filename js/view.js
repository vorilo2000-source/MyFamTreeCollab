// ======================= js/view.js v1.8.0 =======================
// Boom rendering + Live search >> in LiveSearch.js + optimized code structure
// Relatie logica komt nu uit externe relatieEngine.js
//
// Wijziging v1.8.0 (sessie 36):
// - Kleurgradiënt voor meerdere VaderID/MoederID/PartnerID nodes
// - createTreeNode() krijgt index parameter mee
// - ColorHelper.applyRelationColor() past kleur toe op basis van volgorde
// - Vereist: colorHelper.js geladen vóór view.js
//
// Wijziging v1.7.0 (sessie 35 — F3-48):
// - findMultiple() helper: meerdere IDs via parsePartners()
// - Alle directe findPerson() calls vervangen door findMultiple().forEach()

(function () {
    'use strict';

    var treeBox     = document.getElementById('treeContainer');
    var BZBox       = document.getElementById('BZBox');
    var searchInput = document.getElementById('searchPerson');

    var dataset         = window.StamboomStorage.get() || [];
    var selectedHoofdId = null;

    function safe(val) {
        return val ? String(val).trim() : '';
    }

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

    function findPerson(id) {
        return dataset.find(function (p) { return safe(p.ID) === safe(id); });
    }

    // Splits |-gescheiden veld naar array van gevonden personen
    function findMultiple(fieldValue) {
        return window.StamboomSchema.parsePartners(fieldValue || '')
            .map(function (id) { return findPerson(id); })
            .filter(Boolean);
    }

    /* ======================= NODE CREATOR =======================
     * index: volgorde van dit ID binnen het veld (0 = eerste, 1 = tweede, ...)
     * Index 0 = basiskleur via CSS klasse, index 1+ = lichter via ColorHelper
     */
    function createTreeNode(p, rel, index) {
        var div = document.createElement('div');
        div.className = 'tree-node';

        if (rel) div.classList.add(rel);                                   // CSS klasse voor basiskleur (index 0)

        // Kleurgradiënt toepassen voor index 1 en hoger
        if (typeof index === 'number' && index > 0 && window.ColorHelper) {
            window.ColorHelper.applyRelationColor(div, rel, index);        // Inline stijl overschrijft CSS klasse
        }

        var fullName = [safe(p.Roepnaam), safe(p.Prefix), safe(p.Achternaam)]
            .filter(Boolean).join(' ').trim();
        var birth = formatDate(p.Geboortedatum);

        div.innerHTML =
            '<span class="id">'    + safe(p.ID) + '</span>' +
            '<span class="name">'  + fullName   + '</span>' +
            '<span class="birth">' + birth      + '</span>';

        div.dataset.id = p.ID;

        div.addEventListener('click', function () {
            selectedHoofdId = safe(p.ID);
            renderTree();
        });

        return div;
    }

    /* ======================= BOOM BUILDER ======================= */
    function buildTree(rootID) {
        treeBox.innerHTML = '';
        BZBox.innerHTML   = '';

        if (!rootID) {
            treeBox.textContent = i18nModule.t('view:tree.selectPerson');
            return;
        }

        var root = findPerson(rootID);
        if (!root) {
            treeBox.textContent = i18nModule.t('view:tree.notFound');
            return;
        }

        var dataRel = window.RelatieEngine.computeRelaties(dataset, rootID);

        // Hoofd + partners (meerdere via |, elk met oplopende index)
        var rootWrapper = document.createElement('div');
        rootWrapper.className = 'tree-root-main';
        rootWrapper.appendChild(createTreeNode(root, 'HoofdID', 0));      // Hoofd altijd index 0

        findMultiple(root.PartnerID).forEach(function (partner, idx) {
            rootWrapper.appendChild(createTreeNode(partner, 'PHoofdID', idx)); // idx 0 = eerste partner, 1 = tweede, ...
        });

        treeBox.appendChild(rootWrapper);

        // Ouders (meerdere via |, elk met oplopende index)
        var parents = document.createElement('div');
        parents.className = 'tree-parents';

        findMultiple(root.VaderID).forEach(function (v, idx) {
            parents.appendChild(createTreeNode(v, 'VHoofdID', idx));      // idx 0 = eerste vader
        });

        findMultiple(root.MoederID).forEach(function (m, idx) {
            parents.appendChild(createTreeNode(m, 'MHoofdID', idx));      // idx 0 = eerste moeder
        });

        if (parents.children.length > 0) treeBox.prepend(parents);

        // Kinderen + partners
        var children = dataRel.filter(function (d) {
            return ['KindID', 'HKindID', 'PHKindID'].includes(d.Relatie);
        });

        if (children.length > 0) {
            var kidsWrap = document.createElement('div');
            kidsWrap.className = 'tree-children';

            children.forEach(function (k) {
                var kidGroup = document.createElement('div');
                kidGroup.className = 'tree-kid-group';
                kidGroup.appendChild(createTreeNode(k, k.Relatie, 0));    // Kind altijd index 0

                findMultiple(k.PartnerID).forEach(function (kPartner, idx) {
                    kidGroup.appendChild(createTreeNode(kPartner, 'PKindID', idx)); // Partners oplopend
                });

                kidsWrap.appendChild(kidGroup);
            });

            treeBox.appendChild(kidsWrap);
        }

        // Broers/zussen + partners
        var bzNodes = dataRel.filter(function (d) { return d.Relatie === 'BZID'; });

        bzNodes.forEach(function (b) {
            var bzGroup = document.createElement('div');
            bzGroup.className = 'tree-kid-group';
            bzGroup.appendChild(createTreeNode(b, 'BZID', 0));            // BZ altijd index 0

            findMultiple(b.PartnerID).forEach(function (bPartner, idx) {
                bzGroup.appendChild(createTreeNode(bPartner, 'PBZID', idx)); // Partners oplopend
            });

            BZBox.appendChild(bzGroup);
        });
    }

    /* ======================= LIVE SEARCH ======================= */
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

    /* ======================= INIT ======================= */
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
