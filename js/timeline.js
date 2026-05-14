/* ======================= js/timeline.js v2.4.0 =======================
 * Canvas-based family timeline renderer
 *
 * Wijzigingen v2.4.0 (sessie 26):
 *  - Alle hardcoded strings vervangen door i18nModule.t('timeline:...')
 *  - Generatie-labels (gen -3 t/m +n) via i18n namespace
 *  - Tooltip-velden (rel-labels, geboren, overleden, leeftijd) via i18n
 *  - Placeholder-meldingen via i18n
 *  - genLabel() leest uit timeline:gen.* keys
 *  - buildTooltipText() leest uit timeline:rel.* en timeline:tooltip.*
 *  - showPlaceholder() leest uit timeline:placeholder.*
 *
 * Wijzigingen v2.3.5:
 *  - Sticky generatiekolom: #tlStickyCol blijft zichtbaar bij horizontaal scrollen
 *  - updateGenLabels() schrijft labels naar #tlStickyCol
 *
 * Wijzigingen v2.3.1:
 *  - Bug fix: ancestor volgorde gecorrigeerd
 *  - collectAncestorLevel buffer-aanpak
 *
 * Dependencies:
 *   i18n.js          -> window.i18nModule.t()
 *   utils.js         -> window.ftSafe, window.ftParseBirthday, window.ftFormatDate
 *   storage.js       -> window.StamboomStorage.get()
 *   LiveSearch.js    -> window.initLiveSearch(inputEl, dataset, cb)
 *   relatieEngine.js -> window.RelatieEngine.computeRelaties(data, hoofdId)
 * ===================================================================== */

(function () {
    'use strict';

    /* ------------------------------------------------------------------
     * SECTION 1 — DOM REFERENCES
     * ------------------------------------------------------------------ */
    var container   = document.getElementById('timelineContainer');  // Buitenste wrapper
    var stickyCol   = document.getElementById('tlStickyCol');        // Sticky generatiekolom links
    var scrollArea  = document.getElementById('tlScrollArea');       // Scrollgebied rechts
    var canvas      = document.getElementById('timelineCanvas');     // Canvas voor balkjes
    var placeholder = document.getElementById('timelinePlaceholder'); // Melding zonder selectie
    var tooltip     = document.getElementById('timelineTooltip');    // Hover-tooltip
    var searchInput = document.getElementById('sandboxSearch');      // Zoekveld

    /* ------------------------------------------------------------------
     * SECTION 2 — LAYOUT CONSTANTS
     * ------------------------------------------------------------------ */
    var ROW_H        = 28;  // Hoogte van één persoons-rij in pixels
    var ROW_GAP      = 4;   // Ruimte tussen rijen binnen dezelfde familiegroep
    var GROUP_GAP    = 12;  // Ruimte tussen familiegroepen
    var RIGHT_PAD    = 32;  // Rechter marge na tijdas-einde
    var TICK_AREA_H  = 40;  // Hoogte gereserveerd voor tijdas bovenaan
    var BAR_H        = 16;  // Hoogte van een levensbalk
    var RADIUS       = 3;   // Afronding van balkjes
    var DEFAULT_SPAN = 50;  // Aangenomen levensduur als overlijdensdatum onbekend
    var TICK_INTERVAL= 10;  // Jaren tussen tikmarkeringen
    var UNKNOWN_BAR_W= 60;  // Breedte voor balkjes zonder geboortedatum
    var LABEL_COL_W  = 155; // Overeenkomstig CSS width van #tlStickyCol
    var MIN_PX_YEAR  = 5;   // Minimum pixels per jaar
    var SECTION_H    = 20;  // Hoogte van generatie-header rij
    var YEAR_PAD     = 5;   // Pixels tussen jaarlabel en balkrand

    /* ------------------------------------------------------------------
     * SECTION 3 — COLOUR PALETTE
     * ------------------------------------------------------------------ */
    var COLOR = {
        HoofdID:     '#c8960c',
        PHoofdID:    '#7b56c2',
        VHoofdID:    '#2d7d46',
        MHoofdID:    '#2d7d46',
        BZID:        '#c8741a',
        BZPartnerID: '#9e9e9e',
        partner:     '#9e9e9e',
        today:       '#ee0055',
        tick:        '#bbbbbb',
        barText:     '#ffffff',
        barTextDark: '#1a1a1a',
        birthLabel:  '#555555',
        unknown:     '#cccccc',
        unknownText: '#666666',
        connLine:    '#cccccc',
        genSep:      '#e8e8e8',
        sectionText: '#888888'
    };

    function descendantColor(genDepth) {
        if (genDepth <= 1) return '#2196f3';
        if (genDepth === 2) return '#00897b';
        var steps  = genDepth - 2;
        var factor = Math.min(steps * 0.20, 0.80);
        var r = Math.round(0   + (255 - 0)   * factor);
        var g = Math.round(137 + (255 - 137) * factor);
        var b = Math.round(123 + (255 - 123) * factor);
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    /* ------------------------------------------------------------------
     * SECTION 4 — STATE
     * ------------------------------------------------------------------ */
    var dataset    = [];
    var rootId     = null;
    var hitRects   = [];
    var dynMinYear = 1800;
    var dynMaxYear = new Date().getFullYear();
    var TODAY      = new Date().getFullYear();

    /* ------------------------------------------------------------------
     * SECTION 5 — DATE UTILITIES
     * ------------------------------------------------------------------ */
    function resolveQ(s) { return String(s).replace(/\?/g, '0'); }

    function parseYear(dateStr) {
        if (!dateStr) return null;
        var d = resolveQ(String(dateStr).trim());

        var dmyA = d.match(/^(\d{1,2})[-/\s]([a-zA-Z]+)[-/\s](\d{4})$/);
        if (dmyA) { var yr1 = parseInt(dmyA[3], 10); return (yr1 >= 100 && yr1 <= TODAY + 5) ? yr1 : null; }

        var ymdA = d.match(/^(\d{4})[-/\s]([a-zA-Z]+)[-/\s](\d{1,2})$/);
        if (ymdA) { var yr2 = parseInt(ymdA[1], 10); return (yr2 >= 100 && yr2 <= TODAY + 5) ? yr2 : null; }

        var yOnly = d.match(/^(\d{4})$/);
        if (yOnly) { var yr3 = parseInt(yOnly[1], 10); return (yr3 >= 100 && yr3 <= TODAY + 5) ? yr3 : null; }

        try {
            var obj = window.ftParseBirthday(d);
            if (!obj || isNaN(obj.getTime())) return null;
            var yr4 = obj.getFullYear();
            return (yr4 >= 100 && yr4 <= TODAY + 5) ? yr4 : null;
        } catch (e) { return null; }
    }

    function fmtDate(dateStr) {
        if (!dateStr) return '\u2014'; // Em-dash
        var r = resolveQ(String(dateStr).trim());
        return window.ftFormatDate ? window.ftFormatDate(r) : r;
    }

    /* ------------------------------------------------------------------
     * SECTION 6 — UTILITY HELPERS
     * ------------------------------------------------------------------ */
    function safe(val) { return window.ftSafe(val); }

    function findPerson(id) {
        var sid = safe(id);
        if (!sid) return null;
        return dataset.find(function (p) { return safe(p.ID) === sid; }) || null;
    }

    function displayName(p) {
        return [safe(p.Roepnaam), safe(p.Prefix), safe(p.Achternaam)].filter(Boolean).join(' ');
    }

    function needsDarkText(hexOrRgb) {
        if (!hexOrRgb) return false;
        var rgb = hexOrRgb.match(/\d+/g);
        if (!rgb) return false;
        var lum = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
        return lum > 160;
    }

    /* ------------------------------------------------------------------
     * SECTION 7 — TIME AXIS MATH
     * ------------------------------------------------------------------ */
    function yearToX(year, timeW) {
        return ((year - dynMinYear) / (dynMaxYear - dynMinYear)) * timeW;
    }

    /* ------------------------------------------------------------------
     * SECTION 8 — DYNAMIC YEAR RANGE
     * ------------------------------------------------------------------ */
    function setDynamicRange(rootPerson) {
        var rb = parseYear(rootPerson.Geboortedatum);
        if (rb) {
            dynMinYear = rb - 200;
            dynMaxYear = Math.max(rb + 200, TODAY);
        } else {
            var years  = dataset.map(function (p) { return parseYear(p.Geboortedatum); }).filter(Boolean);
            dynMinYear = years.length ? Math.min.apply(null, years) - 10 : TODAY - 200;
            dynMaxYear = TODAY;
        }
    }

    /* ------------------------------------------------------------------
     * SECTION 9 — GENERATIE-LABEL HELPER
     * Labels worden nu via i18nModule.t() opgehaald uit de timeline namespace.
     * ------------------------------------------------------------------ */
    function genLabel(depth, shownGenLabels) {
        if (shownGenLabels.has(depth)) return null; // Al getoond voor deze diepte
        shownGenLabels.add(depth);

        // Vaste keys voor bekende generatiediepten
        var fixedKeys = [
            null,                                    // 0 = root — apart afgehandeld
            'timeline:gen.children',                 // +1
            'timeline:gen.grandchildren',            // +2
            'timeline:gen.greatgrandchildren',       // +3
            'timeline:gen.greatgreatgrandchildren'   // +4
        ];

        if (depth === 0) return null; // Root heeft eigen label via buildRows
        if (depth >= 1 && depth <= 4 && fixedKeys[depth]) {
            return i18nModule.t(fixedKeys[depth]); // Vertaald via i18n
        }
        // Diepte > 4: dynamisch label met interpolatie
        return i18nModule.t('timeline:gen.furtherDescendants', { n: depth });
    }

    /* ------------------------------------------------------------------
     * SECTION 10 — ROW BUILDER
     * ------------------------------------------------------------------ */
    function buildRows(rootPerson) {
        var relaties = window.RelatieEngine.computeRelaties(dataset, safe(rootPerson.ID));
        var seen     = new Set();
        var rows     = [];

        function makeEntry(person, relatie, color) {
            var by = parseYear(person.Geboortedatum);
            var dy = parseYear(person.Overlijdensdatum);
            return { person: person, relatie: relatie, color: color,
                     birthYear: by, deathYear: dy,
                     isDead: dy !== null, isUnknown: by === null,
                     isRoot: safe(person.ID) === safe(rootPerson.ID) };
        }

        function addRow(id, relatie, color, genNum, isDescendant, genDepth, sectionLabel, isLastInUnit) {
            var sid = safe(id);
            if (!sid || seen.has(sid)) return false;
            var p = findPerson(sid);
            if (!p) return false;
            seen.add(sid);
            rows.push({ entry: makeEntry(p, relatie, color), isDescendant: isDescendant,
                        genDepth: genDepth, genNum: genNum,
                        sectionLabel: sectionLabel, isLastInUnit: isLastInUnit });
            return true;
        }

        function collectAncestorLevel(parentIds, sectionLabel, genNum) {
            var buffer    = [];
            var nextLevel = [];
            parentIds.forEach(function (pid) {
                var parent = findPerson(pid);
                if (!parent || seen.has(safe(pid))) return;
                seen.add(safe(pid));
                var rootFatherId = safe(rootPerson.VaderID);
                var relatie = genNum === -1
                    ? (safe(parent.ID) === rootFatherId ? 'VHoofdID' : 'MHoofdID')
                    : 'VHoofdID';
                buffer.push({ id: pid, relatie: relatie, color: COLOR[relatie], genNum: genNum, sectionLabel: sectionLabel });
                var partnerId = safe(parent.PartnerID);
                if (partnerId && !seen.has(partnerId)) {
                    seen.add(partnerId);
                    buffer.push({ id: partnerId, relatie: 'PHoofdID', color: COLOR.PHoofdID, genNum: genNum, sectionLabel: null });
                }
                [safe(parent.VaderID), safe(parent.MoederID)]
                    .filter(function (id) { return id && !seen.has(id); })
                    .forEach(function (id) { nextLevel.push(id); });
            });
            return { buffer: buffer, nextLevel: Array.from(new Set(nextLevel)) };
        }

        // Voorouders — labels via i18n
        var gen1Ids = [safe(rootPerson.VaderID), safe(rootPerson.MoederID)].filter(Boolean);
        var col1    = collectAncestorLevel(gen1Ids, i18nModule.t('timeline:gen.parents'),            -1);
        var col2    = collectAncestorLevel(col1.nextLevel, i18nModule.t('timeline:gen.grandparents'), -2);
        var col3    = collectAncestorLevel(col2.nextLevel, i18nModule.t('timeline:gen.greatgrandparents'), -3);

        [col3.buffer, col2.buffer, col1.buffer].forEach(function (buffer) {
            buffer.forEach(function (item) {
                var p = findPerson(item.id);
                if (!p) return;
                rows.push({ entry: makeEntry(p, item.relatie, item.color), isDescendant: false,
                            genDepth: 0, genNum: item.genNum,
                            sectionLabel: item.sectionLabel, isLastInUnit: false });
            });
        });

        // Hoofdpersoon — label via i18n
        addRow(rootPerson.ID, 'HoofdID', COLOR.HoofdID, 0, false, 0,
               i18nModule.t('timeline:gen.root'), false);

        if (safe(rootPerson.PartnerID)) {
            addRow(rootPerson.PartnerID, 'PHoofdID', COLOR.PHoofdID, 0, false, 0, null, false);
        }

        // Broers en zussen
        relaties
            .filter(function (r) { return safe(r.Relatie) === 'BZID'; })
            .sort(function (a, b) { return (parseYear(a.Geboortedatum) || 9999) - (parseYear(b.Geboortedatum) || 9999); })
            .forEach(function (r) {
                addRow(r.ID, 'BZID', COLOR.BZID, 0, false, 0, null, false);
                var sib = findPerson(r.ID);
                if (sib && safe(sib.PartnerID)) {
                    addRow(sib.PartnerID, 'BZPartnerID', COLOR.BZPartnerID, 0, false, 0, null, false);
                }
            });

        // Nakomelingen — labels via genLabel() → i18n
        var childRelaties = new Set(['KindID', 'HKindID', 'PHKindID']);
        var rootChildren  = relaties
            .filter(function (r) { return childRelaties.has(safe(r.Relatie)); })
            .sort(function (a, b) { return (parseYear(a.Geboortedatum) || 9999) - (parseYear(b.Geboortedatum) || 9999); });

        var shownGenLabels = new Set();

        function addDescendantGroup(personId, genDepth) {
            var person = findPerson(personId);
            if (!person || seen.has(safe(personId))) return;
            var lbl = genLabel(genDepth, shownGenLabels); // Vertaald label
            addRow(safe(personId), 'KindID', descendantColor(genDepth), genDepth, true, genDepth, lbl, false);
            var partnerId = safe(person.PartnerID);
            if (partnerId) addRow(partnerId, 'PHoofdID', COLOR.partner, genDepth, true, genDepth, null, false);
            dataset
                .filter(function (p) { return safe(p.VaderID) === safe(personId) || safe(p.MoederID) === safe(personId); })
                .sort(function (a, b) { return (parseYear(a.Geboortedatum) || 9999) - (parseYear(b.Geboortedatum) || 9999); })
                .forEach(function (child) { if (!seen.has(safe(child.ID))) addDescendantGroup(safe(child.ID), genDepth + 1); });
        }

        rootChildren.forEach(function (r, idx) {
            addDescendantGroup(safe(r.ID), 1);
            if (idx !== rootChildren.length - 1 && rows.length > 0) rows[rows.length - 1].isLastInUnit = true;
        });

        if (rows.length > 0) rows[rows.length - 1].isLastInUnit = true;
        return rows;
    }

    /* ------------------------------------------------------------------
     * SECTION 11 — CANVAS RENDERER
     * ------------------------------------------------------------------ */
    function renderCanvas(rows) {
        if (!rows || rows.length === 0) return;

        // Bereken canvas hoogte
        var totalH    = TICK_AREA_H;
        var prevLabel = null;
        rows.forEach(function (row) {
            if (row.sectionLabel && row.sectionLabel !== prevLabel) { totalH += SECTION_H; prevLabel = row.sectionLabel; }
            totalH += ROW_H + (row.isLastInUnit ? GROUP_GAP : ROW_GAP);
        });
        totalH += 20;

        // Canvas breedte — gebaseerd op scrollArea breedte
        var yearSpan  = dynMaxYear - dynMinYear;
        var available = Math.max(scrollArea.clientWidth - RIGHT_PAD, 400);
        var pxPerYear = Math.max(available / yearSpan, MIN_PX_YEAR);
        var timeW     = yearSpan * pxPerYear;

        canvas.height = totalH;
        canvas.width  = timeW + RIGHT_PAD;
        stickyCol.style.height = totalH + 'px'; // Sticky kolom hoogte gelijkstellen

        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        hitRects = [];
        var barPositions = {};
        var genLabelY    = {}; // genNum/genDepth -> Y pixel voor sticky kolom

        // Pass 1: tijdas
        drawTimeAxis(ctx, timeW);

        // Pass 2: rijen
        var curY  = TICK_AREA_H;
        prevLabel = null;

        rows.forEach(function (row) {
            if (row.sectionLabel && row.sectionLabel !== prevLabel && !row.isDescendant) {
                ctx.fillStyle = COLOR.genSep;
                ctx.fillRect(0, curY, canvas.width, 1);
                curY += 1;
            }

            if (row.sectionLabel && row.sectionLabel !== prevLabel) {
                var gn0 = row.isDescendant ? row.genDepth : row.genNum;
                if (gn0 !== null && gn0 !== undefined && !(gn0 in genLabelY)) genLabelY[gn0] = curY;
                curY     += SECTION_H;
                prevLabel = row.sectionLabel;
            }

            var gn1 = row.isDescendant ? row.genDepth : row.genNum;
            if (gn1 !== null && gn1 !== undefined && !(gn1 in genLabelY)) genLabelY[gn1] = curY;

            var rowY  = curY;
            var barY  = rowY + (ROW_H - BAR_H) / 2;
            var barCY = barY + BAR_H / 2;

            if (row.entry.isUnknown) {
                drawUnknownBar(ctx, barY, barCY, row.entry);
                barPositions[safe(row.entry.person.ID)] = { barX: 4, barEndX: 4 + UNKNOWN_BAR_W, barCY: barCY };
            } else {
                drawLifeBar(ctx, barY, barCY, row.entry, timeW);
                var bx    = yearToX(row.entry.birthYear, timeW);
                var endYr = row.entry.isDead ? row.entry.deathYear : Math.min(row.entry.birthYear + DEFAULT_SPAN, TODAY);
                var ex    = yearToX(Math.min(endYr, dynMaxYear), timeW);
                barPositions[safe(row.entry.person.ID)] = { barX: bx, barEndX: Math.max(ex, bx + 4), barCY: barCY };
            }

            hitRects.push({ x: 0, y: rowY, w: canvas.width, h: ROW_H, entry: row.entry });
            curY += ROW_H + (row.isLastInUnit ? GROUP_GAP : ROW_GAP);
        });

        // Pass 3: connectors
        rows.forEach(function (row) {
            var p = row.entry.person;
            [safe(p.VaderID), safe(p.MoederID)].forEach(function (parentId) {
                if (!parentId) return;
                var cp = barPositions[safe(p.ID)];
                var pp = barPositions[parentId];
                if (!cp || !pp) return;
                drawConnector(ctx, pp, cp);
            });
        });

        // Pass 4: vandaag-lijn
        drawTodayLine(ctx, timeW);

        // Pass 5: sticky kolom
        updateGenLabels(rows, genLabelY, totalH);
    }

    /* ------------------------------------------------------------------
     * SECTION 12 — DRAW FUNCTIONS
     * ------------------------------------------------------------------ */
    function drawTimeAxis(ctx, timeW) {
        ctx.strokeStyle = COLOR.tick;
        ctx.lineWidth   = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, TICK_AREA_H - 4);
        ctx.lineTo(timeW, TICK_AREA_H - 4);
        ctx.stroke();
        ctx.font         = '9px sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'bottom';
        var firstTick = Math.ceil(dynMinYear / TICK_INTERVAL) * TICK_INTERVAL;
        for (var y = firstTick; y <= dynMaxYear; y += TICK_INTERVAL) {
            var x       = yearToX(y, timeW);
            var isMajor = y % 50 === 0;
            ctx.strokeStyle = COLOR.tick;
            ctx.lineWidth   = isMajor ? 1 : 0.5;
            ctx.beginPath();
            ctx.moveTo(x, TICK_AREA_H - 4);
            ctx.lineTo(x, TICK_AREA_H - (isMajor ? 14 : 8));
            ctx.stroke();
            if (y % 25 === 0) { ctx.fillStyle = COLOR.tick; ctx.fillText(String(y), x, TICK_AREA_H - 16); }
        }
    }

    function drawTodayLine(ctx, timeW) {
        var x = yearToX(TODAY, timeW);
        if (x < 0 || x > timeW) return;
        ctx.save();
        ctx.strokeStyle = COLOR.today;
        ctx.lineWidth   = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, TICK_AREA_H - 4);
        ctx.lineTo(x, canvas.height - 10);
        ctx.stroke();
        ctx.restore();
    }

    function drawLifeBar(ctx, barY, barCY, entry, timeW) {
        var person    = entry.person;
        var color     = entry.color;
        var birthYear = entry.birthYear;
        var deathYear = entry.deathYear;
        var isDead    = entry.isDead;

        var startX    = yearToX(birthYear, timeW);
        var endYear   = isDead ? deathYear : Math.min(birthYear + DEFAULT_SPAN, TODAY);
        var solidEndX = yearToX(Math.min(endYear, dynMaxYear), timeW);
        var solidW    = Math.max(solidEndX - startX, 4);

        ctx.fillStyle = color;
        roundedRect(ctx, startX, barY, solidW, BAR_H, RADIUS);
        ctx.fill();

        if (!isDead) {
            var todayX = yearToX(Math.min(TODAY, dynMaxYear), timeW);
            if (todayX > solidEndX + 2) {
                ctx.save();
                ctx.strokeStyle = color;
                ctx.lineWidth   = 1.5;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(solidEndX, barCY);
                ctx.lineTo(todayX, barCY);
                ctx.stroke();
                ctx.restore();
            }
        }

        ctx.fillStyle    = COLOR.birthLabel;
        ctx.font         = '9px sans-serif';
        ctx.textAlign    = 'right';
        ctx.textBaseline = 'middle';
        if (birthYear) ctx.fillText(String(birthYear), startX - YEAR_PAD, barCY);
        if (isDead && deathYear) { ctx.textAlign = 'left'; ctx.fillText(String(deathYear), solidEndX + YEAR_PAD, barCY); }
        drawBarLabel(ctx, displayName(person), startX, barY, solidW, needsDarkText(color));
        if (entry.isRoot) drawRootIndicator(ctx, startX + solidW / 2, barY);
    }

    function drawUnknownBar(ctx, barY, barCY, entry) {
        var barX = 4;
        ctx.fillStyle = COLOR.unknown;
        roundedRect(ctx, barX, barY, UNKNOWN_BAR_W, BAR_H, RADIUS);
        ctx.fill();
        ctx.fillStyle    = COLOR.unknownText;
        ctx.font         = 'bold 10px sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', barX + 10, barCY);
        ctx.font      = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(clipText(ctx, displayName(entry.person), UNKNOWN_BAR_W - 18), barX + 18, barCY);
    }

    function drawBarLabel(ctx, name, barX, barY, barW, darkText) {
        var pad  = 5;
        var maxW = barW - pad * 2;
        if (maxW < 8) return;
        ctx.fillStyle    = darkText ? COLOR.barTextDark : COLOR.barText;
        ctx.font         = '9px sans-serif';
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(clipText(ctx, name, maxW), barX + pad, barY + BAR_H / 2);
    }

    function clipText(ctx, text, maxW) {
        if (ctx.measureText(text).width <= maxW) return text;
        var t = text;
        while (t.length > 0 && ctx.measureText(t + '\u2026').width > maxW) t = t.slice(0, -1);
        return t + '\u2026';
    }

    function drawRootIndicator(ctx, cx, barY) {
        ctx.fillStyle = COLOR.HoofdID;
        ctx.beginPath();
        ctx.moveTo(cx, barY - 5);
        ctx.lineTo(cx - 4, barY - 1);
        ctx.lineTo(cx + 4, barY - 1);
        ctx.closePath();
        ctx.fill();
    }

    function drawConnector(ctx, parentPos, childPos) {
        var px = parentPos.barEndX;
        var py = parentPos.barCY;
        var cx = childPos.barX;
        var cy = childPos.barCY;
        if (px >= cx - 2) return;
        ctx.save();
        ctx.strokeStyle = COLOR.connLine;
        ctx.lineWidth   = 0.8;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(cx, py);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = COLOR.connLine;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 3);
        ctx.lineTo(cx - 3, cy - 7);
        ctx.lineTo(cx + 3, cy - 7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function roundedRect(ctx, x, y, w, h, r) {
        var rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.lineTo(x + w - rr, y);
        ctx.arcTo(x + w, y,     x + w, y + rr,     rr);
        ctx.lineTo(x + w, y + h - rr);
        ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
        ctx.lineTo(x + rr, y + h);
        ctx.arcTo(x,     y + h, x,     y + h - rr, rr);
        ctx.lineTo(x,     y + rr);
        ctx.arcTo(x,     y,     x + rr, y,          rr);
        ctx.closePath();
    }

    /* ------------------------------------------------------------------
     * SECTION 13 — STICKY GEN-LABEL KOLOM
     * ------------------------------------------------------------------ */
    function updateGenLabels(rows, genLabelY, totalH) {
        stickyCol.innerHTML = ''; // Verwijder bestaande labels

        var placed    = new Set();
        var prevLabel = null;

        rows.forEach(function (row) {
            if (!row.sectionLabel || row.sectionLabel === prevLabel) return;
            prevLabel = row.sectionLabel;
            if (placed.has(row.sectionLabel)) return;
            placed.add(row.sectionLabel);

            var gn = row.isDescendant ? row.genDepth : row.genNum; // Generatienummer als Y-sleutel
            var y  = (gn !== null && gn !== undefined && genLabelY[gn] !== undefined)
                ? genLabelY[gn] : 0;

            var lbl = document.createElement('div');
            Object.assign(lbl.style, {
                position:     'absolute',
                top:          y + 'px',
                left:         '5px',
                right:        '4px',
                height:       SECTION_H + 'px',
                lineHeight:   SECTION_H + 'px',
                fontWeight:   'bold',
                whiteSpace:   'nowrap',
                overflow:     'hidden',
                textOverflow: 'ellipsis'
            });
            lbl.textContent = row.sectionLabel; // Label tekst (al vertaald via genLabel())
            stickyCol.appendChild(lbl);
        });
    }

    /* ------------------------------------------------------------------
     * SECTION 14 — HIT DETECTION & TOOLTIP
     * Tooltip-tekst volledig via i18nModule.t()
     * ------------------------------------------------------------------ */
    function getHitAt(mx, my) {
        for (var i = hitRects.length - 1; i >= 0; i--) {
            var r = hitRects[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return r;
        }
        return null;
    }

    function buildTooltipText(entry) {
        var p    = entry.person;
        // Relatie-labels via i18n — fallback naar ruwe sleutel als niet gevonden
        var relKey = 'timeline:rel.' + entry.relatie;
        var rel    = i18nModule.t(relKey);
        if (!rel || rel === relKey) rel = entry.relatie || '\u2014'; // Fallback

        var name  = displayName(p) || i18nModule.t('timeline:tooltip.noName'); // Vertaald fallback
        var geb   = fmtDate(p.Geboortedatum);
        var overl = p.Overlijdensdatum
            ? fmtDate(p.Overlijdensdatum)
            : i18nModule.t('timeline:tooltip.alive'); // "nog in leven"

        var life = '';
        if (entry.birthYear && entry.deathYear) {
            // Exacte leeftijd: "Leeftijd: 72 jaar"
            life = '\n' + i18nModule.t('timeline:tooltip.age') + ': ' +
                   (entry.deathYear - entry.birthYear) + ' ' +
                   i18nModule.t('timeline:tooltip.years');
        } else if (entry.birthYear) {
            // Geschatte leeftijd: "Leeftijd: ~45 jaar"
            life = '\n' + i18nModule.t('timeline:tooltip.age') + ': ' +
                   i18nModule.t('timeline:tooltip.approx', { age: TODAY - entry.birthYear });
        }

        return name + '  [' + rel + ']' +
               '\nID: ' + (safe(p.ID) || '\u2014') +
               '\n' + i18nModule.t('timeline:tooltip.born')  + ': ' + geb +
               '\n' + i18nModule.t('timeline:tooltip.died')  + ': ' + overl +
               life;
    }

    function canvasCoords(e) {
        var rect = canvas.getBoundingClientRect();
        return {
            mx: (e.clientX - rect.left) * (canvas.width  / rect.width),
            my: (e.clientY - rect.top)  * (canvas.height / rect.height)
        };
    }

    canvas.addEventListener('mousemove', function (e) {
        var coords = canvasCoords(e);
        var hit    = getHitAt(coords.mx, coords.my);
        if (hit) {
            canvas.style.cursor   = 'pointer';
            tooltip.style.display = 'block';
            tooltip.textContent   = buildTooltipText(hit.entry);
            var tipW  = tooltip.offsetWidth || 220;
            var flipL = (e.offsetX + tipW + 20 > scrollArea.clientWidth);
            tooltip.style.left = (flipL ? e.offsetX - tipW - 8 : e.offsetX + 14) + 'px';
            tooltip.style.top  = Math.max(e.offsetY - 10, 0) + 'px';
        } else {
            canvas.style.cursor   = 'default';
            tooltip.style.display = 'none';
        }
    });

    canvas.addEventListener('mouseleave', function () {
        tooltip.style.display = 'none';
        canvas.style.cursor   = 'default';
    });

    canvas.addEventListener('click', function (e) {
        var coords = canvasCoords(e);
        var hit    = getHitAt(coords.mx, coords.my);
        if (hit) { rootId = safe(hit.entry.person.ID); searchInput.value = ''; draw(); }
    });

    /* ------------------------------------------------------------------
     * SECTION 15 — MAIN DRAW + PLACEHOLDER
     * ------------------------------------------------------------------ */
    function draw() {
        if (!rootId) return;
        var root = findPerson(rootId);
        if (!root) {
            showPlaceholder(i18nModule.t('timeline:placeholder.notFound')); // Vertaald
            return;
        }
        setDynamicRange(root);
        var rows = buildRows(root);
        if (rows.length === 0) {
            showPlaceholder(i18nModule.t('timeline:placeholder.noFamily')); // Vertaald
            return;
        }
        placeholder.style.display = 'none';
        canvas.style.display      = 'block';
        renderCanvas(rows);
    }

    function showPlaceholder(msg) {
        canvas.style.display      = 'none';
        placeholder.style.display = 'block';
        placeholder.textContent   = msg;   // Vertaald bericht
        stickyCol.innerHTML       = '';    // Reset sticky kolom
    }

    /* ------------------------------------------------------------------
     * SECTION 16 — INIT
     * ------------------------------------------------------------------ */
    function init() {
        dataset = window.StamboomStorage.get() || [];
        window.initLiveSearch(searchInput, dataset, function (selectedId) {
            rootId = safe(selectedId);
            draw();
        });
        if (dataset.length === 1) { rootId = safe(dataset[0].ID); draw(); }
        window.addEventListener('resize', function () { if (rootId) draw(); });
    }

    init();

})();
