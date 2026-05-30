/* ======================= js/timeline.js v2.5.0 =======================
 * Canvas-based family timeline renderer
 *
 * Wijzigingen v2.5.0 (sessie 35 — F3-48):
 *  - VaderID, MoederID, PartnerID ondersteunen meerdere waarden via | scheiding
 *  - findMultiple() helper toegevoegd: splitst op | via parsePartners(), retourneert array
 *  - collectAncestorLevel(): partnerId via findMultiple() loop i.p.v. safe(parent.PartnerID)
 *  - collectAncestorLevel(): ouder-IDs via findMultiple() i.p.v. [safe(VaderID), safe(MoederID)]
 *  - rootFatherId check vervangen: rootPerson.VaderID via parsePartners() voor relatie-detectie
 *  - Hoofdpersoon partners: findMultiple(rootPerson.PartnerID).forEach() loop
 *  - Broer/zus partners: findMultiple(sib.PartnerID).forEach() loop
 *  - Nakomeling partners: findMultiple(person.PartnerID).forEach() loop
 *
 * Wijzigingen v2.4.0 (sessie 26):
 *  - Alle hardcoded strings vervangen door i18nModule.t('timeline:...')
 *
 * Wijzigingen v2.3.5:
 *  - Sticky generatiekolom: #tlStickyCol
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
    var container   = document.getElementById('timelineContainer');
    var stickyCol   = document.getElementById('tlStickyCol');
    var scrollArea  = document.getElementById('tlScrollArea');
    var canvas      = document.getElementById('timelineCanvas');
    var placeholder = document.getElementById('timelinePlaceholder');
    var tooltip     = document.getElementById('timelineTooltip');
    var searchInput = document.getElementById('sandboxSearch');

    /* ------------------------------------------------------------------
     * SECTION 2 — LAYOUT CONSTANTS
     * ------------------------------------------------------------------ */
    var ROW_H        = 28;
    var ROW_GAP      = 4;
    var GROUP_GAP    = 12;
    var RIGHT_PAD    = 32;
    var TICK_AREA_H  = 40;
    var BAR_H        = 16;
    var RADIUS       = 3;
    var DEFAULT_SPAN = 50;
    var TICK_INTERVAL= 10;
    var UNKNOWN_BAR_W= 60;
    var LABEL_COL_W  = 155;
    var MIN_PX_YEAR  = 5;
    var SECTION_H    = 20;
    var YEAR_PAD     = 5;

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
        if (!dateStr) return '\u2014';
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

    // Splits |-gescheiden veld naar array van gevonden personen
    // Gebruikt schema.parsePartners() — zelfde helper als manage.js en view.js
    function findMultiple(fieldValue) {
        return window.StamboomSchema.parsePartners(fieldValue || '') // Splits op |
            .map(function (id) { return findPerson(id); })           // Zoek elk ID op
            .filter(Boolean);                                        // Verwijder niet-gevonden
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
     * ------------------------------------------------------------------ */
    function genLabel(depth, shownGenLabels) {
        if (shownGenLabels.has(depth)) return null;
        shownGenLabels.add(depth);

        var fixedKeys = [
            null,
            'timeline:gen.children',
            'timeline:gen.grandchildren',
            'timeline:gen.greatgrandchildren',
            'timeline:gen.greatgreatgrandchildren'
        ];

        if (depth === 0) return null;
        if (depth >= 1 && depth <= 4 && fixedKeys[depth]) {
            return i18nModule.t(fixedKeys[depth]);
        }
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

            // Vaders van rootPersoon als Set voor relatie-detectie
            // Was: var rootFatherId = safe(rootPerson.VaderID)  — slechts één vader
            // Nu: alle vaders van rootPersoon via parsePartners()
            var rootFatherIds = new Set(
                window.StamboomSchema.parsePartners(rootPerson.VaderID || '')
            );

            parentIds.forEach(function (pid) {
                var parent = findPerson(pid);
                if (!parent || seen.has(safe(pid))) return;
                seen.add(safe(pid));

                // Relatie bepalen: is dit een vader of moeder van de rootpersoon?
                var relatie = genNum === -1
                    ? (rootFatherIds.has(safe(parent.ID)) ? 'VHoofdID' : 'MHoofdID')
                    : 'VHoofdID';                                     // Hogere generaties: altijd VHoofdID

                buffer.push({ id: pid, relatie: relatie, color: COLOR[relatie], genNum: genNum, sectionLabel: sectionLabel });

                // Partners van deze voorouder — meerdere via | scheiding
                // Was: var partnerId = safe(parent.PartnerID); if (partnerId && ...) { addRow... }
                findMultiple(parent.PartnerID).forEach(function (partner) {
                    var partnerId = safe(partner.ID);
                    if (!seen.has(partnerId)) {
                        seen.add(partnerId);
                        buffer.push({ id: partnerId, relatie: 'PHoofdID', color: COLOR.PHoofdID, genNum: genNum, sectionLabel: null });
                    }
                });

                // Ouders van deze voorouder voor volgende generatie — meerdere via |
                // Was: [safe(parent.VaderID), safe(parent.MoederID)].filter(...)
                var grandparentIds = window.StamboomSchema.parsePartners(parent.VaderID || '')
                    .concat(window.StamboomSchema.parsePartners(parent.MoederID || '')); // Combineer vaders en moeders

                grandparentIds
                    .filter(function (id) { return id && !seen.has(id); })
                    .forEach(function (id) { nextLevel.push(id); });   // Toevoegen aan volgende generatie
            });

            return { buffer: buffer, nextLevel: Array.from(new Set(nextLevel)) };
        }

        // Voorouders — labels via i18n
        var gen1Ids = window.StamboomSchema.parsePartners(rootPerson.VaderID  || '')
            .concat(window.StamboomSchema.parsePartners(rootPerson.MoederID || '')); // Alle directe ouders

        var col1 = collectAncestorLevel(gen1Ids,         i18nModule.t('timeline:gen.parents'),           -1);
        var col2 = collectAncestorLevel(col1.nextLevel,  i18nModule.t('timeline:gen.grandparents'),      -2);
        var col3 = collectAncestorLevel(col2.nextLevel,  i18nModule.t('timeline:gen.greatgrandparents'), -3);

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

        // Partners van hoofdpersoon — meerdere via |
        // Was: if (safe(rootPerson.PartnerID)) { addRow(rootPerson.PartnerID, ...) }
        findMultiple(rootPerson.PartnerID).forEach(function (partner) {
            addRow(safe(partner.ID), 'PHoofdID', COLOR.PHoofdID, 0, false, 0, null, false);
        });

        // Broers en zussen + hun partners
        relaties
            .filter(function (r) { return safe(r.Relatie) === 'BZID'; })
            .sort(function (a, b) { return (parseYear(a.Geboortedatum) || 9999) - (parseYear(b.Geboortedatum) || 9999); })
            .forEach(function (r) {
                addRow(r.ID, 'BZID', COLOR.BZID, 0, false, 0, null, false);
                var sib = findPerson(r.ID);

                // Partners van broer/zus — meerdere via |
                // Was: if (sib && safe(sib.PartnerID)) { addRow(sib.PartnerID, ...) }
                if (sib) {
                    findMultiple(sib.PartnerID).forEach(function (bzPartner) {
                        addRow(safe(bzPartner.ID), 'BZPartnerID', COLOR.BZPartnerID, 0, false, 0, null, false);
                    });
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
            var lbl = genLabel(genDepth, shownGenLabels);
            addRow(safe(personId), 'KindID', descendantColor(genDepth), genDepth, true, genDepth, lbl, false);

            // Partners van nakomeling — meerdere via |
            // Was: var partnerId = safe(person.PartnerID); if (partnerId) addRow(partnerId, ...)
            findMultiple(person.PartnerID).forEach(function (partner) {
                addRow(safe(partner.ID), 'PHoofdID', COLOR.partner, genDepth, true, genDepth, null, false);
            });

            dataset
                .filter(function (p) {
                    // Kind van deze persoon als vader of moeder — meerdere ouders via parsePartners()
                    var vaders  = window.StamboomSchema.parsePartners(p.VaderID  || '');
                    var moeders = window.StamboomSchema.parsePartners(p.MoederID || '');
                    return vaders.indexOf(safe(personId)) !== -1 || moeders.indexOf(safe(personId)) !== -1;
                })
                .sort(function (a, b) { return (parseYear(a.Geboortedatum) || 9999) - (parseYear(b.Geboortedatum) || 9999); })
                .forEach(function (child) {
                    if (!seen.has(safe(child.ID))) addDescendantGroup(safe(child.ID), genDepth + 1);
                });
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

        var totalH    = TICK_AREA_H;
        var prevLabel = null;
        rows.forEach(function (row) {
            if (row.sectionLabel && row.sectionLabel !== prevLabel) { totalH += SECTION_H; prevLabel = row.sectionLabel; }
            totalH += ROW_H + (row.isLastInUnit ? GROUP_GAP : ROW_GAP);
        });
        totalH += 20;

        var yearSpan  = dynMaxYear - dynMinYear;
        var available = Math.max(scrollArea.clientWidth - RIGHT_PAD, 400);
        var pxPerYear = Math.max(available / yearSpan, MIN_PX_YEAR);
        var timeW     = yearSpan * pxPerYear;

        canvas.height = totalH;
        canvas.width  = timeW + RIGHT_PAD;
        stickyCol.style.height = totalH + 'px';

        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        hitRects = [];
        var barPositions = {};
        var genLabelY    = {};

        drawTimeAxis(ctx, timeW);

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

        // Connectors — ouders via parsePartners() voor correcte multi-ouder links
        rows.forEach(function (row) {
            var p = row.entry.person;
            // Alle vaders en moeders ophalen via parsePartners()
            var ouderIds = window.StamboomSchema.parsePartners(p.VaderID  || '')
                .concat(window.StamboomSchema.parsePartners(p.MoederID || ''));

            ouderIds.forEach(function (parentId) {
                if (!parentId) return;
                var cp = barPositions[safe(p.ID)];
                var pp = barPositions[parentId];
                if (!cp || !pp) return;
                drawConnector(ctx, pp, cp);                             // Lijn van ouder naar kind
            });
        });

        drawTodayLine(ctx, timeW);
        updateGenLabels(rows, genLabelY, totalH);
    }

    /* ------------------------------------------------------------------
     * SECTION 12 — DRAW FUNCTIONS (ongewijzigd)
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
     * SECTION 13 — STICKY GEN-LABEL KOLOM (ongewijzigd)
     * ------------------------------------------------------------------ */
    function updateGenLabels(rows, genLabelY, totalH) {
        stickyCol.innerHTML = '';

        var placed    = new Set();
        var prevLabel = null;

        rows.forEach(function (row) {
            if (!row.sectionLabel || row.sectionLabel === prevLabel) return;
            prevLabel = row.sectionLabel;
            if (placed.has(row.sectionLabel)) return;
            placed.add(row.sectionLabel);

            var gn = row.isDescendant ? row.genDepth : row.genNum;
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
            lbl.textContent = row.sectionLabel;
            stickyCol.appendChild(lbl);
        });
    }

    /* ------------------------------------------------------------------
     * SECTION 14 — HIT DETECTION & TOOLTIP (ongewijzigd)
     * ------------------------------------------------------------------ */
    function getHitAt(mx, my) {
        for (var i = hitRects.length - 1; i >= 0; i--) {
            var r = hitRects[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return r;
        }
        return null;
    }

    function buildTooltipText(entry) {
        var p      = entry.person;
        var relKey = 'timeline:rel.' + entry.relatie;
        var rel    = i18nModule.t(relKey);
        if (!rel || rel === relKey) rel = entry.relatie || '\u2014';

        var name  = displayName(p) || i18nModule.t('timeline:tooltip.noName');
        var geb   = fmtDate(p.Geboortedatum);
        var overl = p.Overlijdensdatum
            ? fmtDate(p.Overlijdensdatum)
            : i18nModule.t('timeline:tooltip.alive');

        var life = '';
        if (entry.birthYear && entry.deathYear) {
            life = '\n' + i18nModule.t('timeline:tooltip.age') + ': ' +
                   (entry.deathYear - entry.birthYear) + ' ' +
                   i18nModule.t('timeline:tooltip.years');
        } else if (entry.birthYear) {
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
     * SECTION 15 — MAIN DRAW + PLACEHOLDER (ongewijzigd)
     * ------------------------------------------------------------------ */
    function draw() {
        if (!rootId) return;
        var root = findPerson(rootId);
        if (!root) {
            showPlaceholder(i18nModule.t('timeline:placeholder.notFound'));
            return;
        }
        setDynamicRange(root);
        var rows = buildRows(root);
        if (rows.length === 0) {
            showPlaceholder(i18nModule.t('timeline:placeholder.noFamily'));
            return;
        }
        placeholder.style.display = 'none';
        canvas.style.display      = 'block';
        renderCanvas(rows);
    }

    function showPlaceholder(msg) {
        canvas.style.display      = 'none';
        placeholder.style.display = 'block';
        placeholder.textContent   = msg;
        stickyCol.innerHTML       = '';
    }

    /* ------------------------------------------------------------------
     * SECTION 16 — INIT (ongewijzigd)
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
