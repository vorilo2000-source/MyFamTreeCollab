/* ======================= js/view.js v1.8.3 =======================
 * Stamboom Viewer: bestaande relatie-, zoek- en kleurlogica behouden.
 * Nieuw v1.8.3: Broers & Zussen heeft een eigen brede kolom met twee kaarten per rij.
 * v1.8.2: ID en naam op regel 1, geboortedatum op regel 2; portret over volle blokhoogte.
 * v1.8.1: portret vóór persoons-ID; zichtbare spaties tussen alle onderdelen.
 * PortretURL wordt uitsluitend uit het bestaande persoonsrecord gelezen.
 * ================================================================ */
(function () {
    'use strict';

    /* ======================= ELEMENTEN EN DATA ======================= */
    var treeBox = document.getElementById('treeContainer');
    var BZBox = document.getElementById('BZBox');
    var searchInput = document.getElementById('searchPerson');
    var dataset = window.StamboomStorage.get() || [];
    var selectedHoofdId = null;

    function safe(val) { return val == null ? '' : String(val).trim(); }
    function formatDate(d) {
        if (!d) return '';
        d = String(d).trim();
        var date = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d) :
            /^\d{2}[-/]\d{2}[-/]\d{4}$/.test(d) ? new Date(d.replace(/(\d{2})[-/](\d{2})[-/](\d{4})/, '$3-$2-$1')) :
            /^\d{4}-\d{2}$/.test(d) ? new Date(d + '-01') :
            /^\d{4}$/.test(d) ? new Date(d + '-01-01') : new Date(d);
        if (isNaN(date.getTime())) return d;
        return date.toLocaleDateString('nl-NL', {day:'2-digit', month:'short', year:'numeric'}).replace(/\./g, '');
    }
    function findPerson(id) {
        return dataset.find(function (p) { return safe(p.ID) === safe(id); });
    }
    function findMultiple(fieldValue) {
        return window.StamboomSchema.parsePartners(fieldValue || '')
            .map(function (id) { return findPerson(id); }).filter(Boolean);
    }

    /* ======================= PORTRET EN TYPOGRAFIE ======================= */
    function addStyles() {
        if (document.getElementById('view-portrait-styles')) return;
        var style = document.createElement('style');
        style.id = 'view-portrait-styles';
        style.textContent =
            /* Persoonsinhoud blijft compact; de afbeelding staat links over twee tekstregels. */
            '.tree-node .view-person-row{display:inline-flex;align-items:stretch;justify-content:center;gap:7px;max-width:100%;vertical-align:middle;}' +
            /* Tekstregels staan onder elkaar zonder extra brede blokmarges. */
            '.tree-node .view-person-text{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:2px;min-width:0;text-align:left;}' +
            /* De eerste regel bevat ID en volledige naam, met expliciete ruimte. */
            '.tree-node .view-person-primary{display:flex;align-items:baseline;justify-content:flex-start;flex-wrap:wrap;gap:0 6px;min-width:0;}' +
            /* Lange namen kunnen afbreken binnen een smalle familiekaart. */
            '.tree-node .view-person-primary>span,.tree-node .view-person-birth{white-space:normal;overflow-wrap:anywhere;}' +
            /* Werkelijke portretfoto vult de gehele hoogte van het tekstblok. */
            '.tree-node .view-portrait{width:38px;min-height:38px;height:auto;align-self:stretch;flex:0 0 38px;border-radius:5px;object-fit:cover;}' +
            /* Zonder geldige URL blijft de standaardbuste even groot als de portretpositie. */
            '.tree-node .view-portrait-fallback{width:38px;min-height:38px;align-self:stretch;flex:0 0 38px;display:inline-flex!important;align-items:center;justify-content:center;font-size:26px;line-height:1;}' +
            /* De stamboom en de rechterkolom mogen elkaars minimale inhoudsbreedte niet opdrijven. */
            '.stamboom-wrapper{display:flex;gap:16px;align-items:flex-start;min-width:0;}' +
            '.stamboom-wrapper>#treeContainer{flex:1 1 0;min-width:0;box-sizing:border-box;}' +
            /* Reserveer rechts op normale desktopbreedte voldoende ruimte voor twee kaarten naast elkaar. */
            '.stamboom-wrapper>div:last-child{flex:0 0 clamp(360px,35%,480px);min-width:0;box-sizing:border-box;}' +
            '#BZBox{width:100%!important;box-sizing:border-box;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;align-content:start;}' +
            /* Elke broer of zus vormt één grid-item en behoudt eventuele partnerkaart in dezelfde groep. */
            '#BZBox>.tree-kid-group{display:flex;flex-wrap:wrap;min-width:0;gap:4px;align-content:start;align-items:stretch;}' +
            '#BZBox .tree-node{display:flex;align-items:center;justify-content:center;flex:1 1 100%;min-width:0;width:auto!important;margin:0!important;box-sizing:border-box;padding:6px 5px;}' +
            '#BZBox .view-person-row{width:100%;justify-content:flex-start;gap:5px;}' +
            '#BZBox .view-person-primary{gap:0 4px;}' +
            /* ID's blijven heel; namen breken op woordgrenzen in plaats van letter voor letter. */
            '#BZBox .view-person-primary>.id{white-space:nowrap;overflow-wrap:normal;word-break:normal;}' +
            '#BZBox .view-person-primary>.name{overflow-wrap:break-word;word-break:normal;}' +
            '#BZBox .view-portrait,#BZBox .view-portrait-fallback{width:30px;flex-basis:30px;min-height:34px;}' +
            '#BZBox .view-portrait-fallback{font-size:23px;}' +
            /* Bij smallere vensters: kolommen onder elkaar; siblings krijgen ruimte voor twee kaarten. */
            '@media(max-width:850px){.stamboom-wrapper{flex-direction:column;}.stamboom-wrapper>#treeContainer,.stamboom-wrapper>div:last-child{width:100%;flex:0 0 auto;}.stamboom-wrapper>div:last-child{max-width:none;}}' +
            /* Smalle mobiele schermen tonen één kaart per rij in plaats van smalle tekststroken. */
            '@media(max-width:440px){#BZBox{grid-template-columns:minmax(0,1fr);}}';
        document.head.appendChild(style);
    }
    function isAllowedImageURL(url) {
        try {
            var parsed = new URL(url);
            return parsed.protocol === 'https:' || parsed.protocol === 'http:';
        } catch (e) { return false; }
    }
    function makePortrait(p) {
        var link = safe(p.PortretURL);
        var fallback = document.createElement('span');
        fallback.className = 'view-portrait-fallback';
        fallback.textContent = '👤';
        fallback.setAttribute('aria-label', 'Geen portret beschikbaar');
        if (!link || !isAllowedImageURL(link)) return fallback;
        var img = document.createElement('img');
        img.className = 'view-portrait';
        img.alt = 'Portret van ' + [safe(p.Roepnaam),safe(p.Achternaam)].filter(Boolean).join(' ');
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';
        img.addEventListener('error', function () { img.replaceWith(fallback); }, {once:true});
        img.src = link;
        return img;
    }
    function addTextPart(parent, cls, value) {
        var text = safe(value);
        if (!text) return;
        var el = document.createElement('span');
        el.className = cls;
        el.textContent = text;
        parent.appendChild(el);
    }
    function createTreeNode(p, rel, index) {
        var div = document.createElement('div');
        div.className = 'tree-node';
        if (rel) div.classList.add(rel);
        if (typeof index === 'number' && index > 0 && window.ColorHelper) {
            window.ColorHelper.applyRelationColor(div, rel, index);
        }
        /* Linkerzijde: persoonsportret of buste die de volledige inhoudshoogte inneemt. */
        var row = document.createElement('span');
        row.className = 'view-person-row';
        row.appendChild(makePortrait(p));

        /* Rechterzijde: een afzonderlijke tekstkolom met twee regels. */
        var text = document.createElement('span');
        text.className = 'view-person-text';
        var primary = document.createElement('span');
        primary.className = 'view-person-primary';
        addTextPart(primary, 'id', p.ID);
        addTextPart(primary, 'name', [safe(p.Roepnaam), safe(p.Prefix), safe(p.Achternaam)].filter(Boolean).join(' '));
        text.appendChild(primary);
        /* Geboortedatum staat op een nieuwe regel; leeg betekent geen extra tekst. */
        var birth = formatDate(p.Geboortedatum);
        if (birth) addTextPart(text, 'view-person-birth birth', birth);
        row.appendChild(text);
        div.appendChild(row);
        div.dataset.id = p.ID;
        div.addEventListener('click', function () {
            selectedHoofdId = safe(p.ID);
            renderTree();
        });
        return div;
    }

    /* ======================= BOOMOPBOUW ======================= */
    function buildTree(rootID) {
        treeBox.innerHTML = '';
        BZBox.innerHTML = '';
        if (!rootID) { treeBox.textContent = i18nModule.t('view:tree.selectPerson'); return; }
        var root = findPerson(rootID);
        if (!root) { treeBox.textContent = i18nModule.t('view:tree.notFound'); return; }
        var dataRel = window.RelatieEngine.computeRelaties(dataset, rootID);
        var rootWrapper = document.createElement('div');
        rootWrapper.className = 'tree-root-main';
        rootWrapper.appendChild(createTreeNode(root, 'HoofdID', 0));
        findMultiple(root.PartnerID).forEach(function (partner, idx) {
            rootWrapper.appendChild(createTreeNode(partner, 'PHoofdID', idx));
        });
        treeBox.appendChild(rootWrapper);

        var parents = document.createElement('div');
        parents.className = 'tree-parents';
        findMultiple(root.VaderID).forEach(function (v, idx) { parents.appendChild(createTreeNode(v, 'VHoofdID', idx)); });
        findMultiple(root.MoederID).forEach(function (m, idx) { parents.appendChild(createTreeNode(m, 'MHoofdID', idx)); });
        if (parents.children.length > 0) treeBox.prepend(parents);

        var children = dataRel.filter(function (d) { return ['KindID','HKindID','PHKindID'].includes(d.Relatie); });
        if (children.length > 0) {
            var kidsWrap = document.createElement('div');
            kidsWrap.className = 'tree-children';
            children.forEach(function (k) {
                var kidGroup = document.createElement('div');
                kidGroup.className = 'tree-kid-group';
                kidGroup.appendChild(createTreeNode(k, k.Relatie, 0));
                findMultiple(k.PartnerID).forEach(function (kPartner, idx) {
                    kidGroup.appendChild(createTreeNode(kPartner, 'PKindID', idx));
                });
                kidsWrap.appendChild(kidGroup);
            });
            treeBox.appendChild(kidsWrap);
        }
        var bzNodes = dataRel.filter(function (d) { return d.Relatie === 'BZID'; });
        bzNodes.forEach(function (b) {
            var bzGroup = document.createElement('div');
            bzGroup.className = 'tree-kid-group';
            bzGroup.appendChild(createTreeNode(b, 'BZID', 0));
            findMultiple(b.PartnerID).forEach(function (bPartner, idx) {
                bzGroup.appendChild(createTreeNode(bPartner, 'PBZID', idx));
            });
            BZBox.appendChild(bzGroup);
        });
    }

    /* ======================= ZOEKEN EN INITIALISEREN ======================= */
    searchInput.addEventListener('input', function () {
        liveSearch({searchInput:searchInput, dataset:dataset, displayType:'popup', renderCallback:function (selected) {
            selectedHoofdId = safe(selected.ID);
            renderTree();
        }});
    });
    function renderTree() { buildTree(selectedHoofdId); }
    function refreshView() {
        dataset = window.StamboomStorage.get() || [];
        selectedHoofdId = null;
        renderTree();
    }
    addStyles();
    refreshView();
})();
