/* ======================= js/colorHelper.js v1.0.0 =======================
   Centrale kleurberekening voor MyFamTreeCollab
   Exporteert: window.ColorHelper

   Verantwoordelijk voor:
   - Basiskleurwaarden per relatietype (gespiegeld van RelationColors.css)
   - Kleurgradiënt per index: 1e ID = basiskleur, 2e ID = 20% lichter, etc.
   - Consistente kleurweergave over manage.js, view.js en timeline.js

   Vereist: utils.js (voor window.ftSafe)
   Laadvolgorde: na utils.js, vóór view.js / manage.js / timeline.js

   Wijziging v1.0.0 (sessie 36):
   - Nieuw bestand — centrale kleurlogica voor multi-ID relaties
   ========================================================================= */

(function () {
    'use strict';

    /* ======================= BASISKLEUREN =======================
     * Gespiegeld van RelationColors.css — één bron van waarheid voor JS
     * CSS variabelen worden gebruikt voor DOM-nodes, deze constanten
     * worden gebruikt voor canvas (timeline) en dynamische kleurberekening
     */
    var BASE_COLORS = {
        HoofdID:        '#fff9c4',   // licht geel        — hoofdpersoon
        PHoofdID:       '#d1c4e9',   // licht paars       — eerste partner hoofdpersoon
        VHoofdID:       '#7ccc86',   // groen             — vader(s) van hoofdpersoon
        MHoofdID:       '#e8f5e9',   // licht groen       — moeder(s) van hoofdpersoon
        KindID:         '#2196f3',   // blauw             — kind van hoofd + partner
        HKindID:        '#90caf9',   // sky blauw         — kind van alleen hoofd
        MHKindID:       '#90caf9',   // sky blauw         — kind via MoederID=HoofdID
        PHKindID:       '#bbdefb',   // licht blauw       — kind van alleen partner
        BZID:           '#FFEAD5',   // licht oranje      — broer/zus
        BZPartnerID:    '#d7d7d7',   // lichtgrijs        — partner van broer/zus
        partner:        '#d7d7d7',   // lichtgrijs        — partner van kind/BZ
        today:          '#ee0055',   // rood              — vandaag-lijn (timeline)
    };

    /* ======================= HEX NAAR RGB =======================
     * Zet een hex kleurcode om naar een RGB object {r, g, b}
     * Ondersteunt zowel #rrggbb als #rgb formaat
     */
    function hexToRgb(hex) {
        hex = hex.replace(/^#/, '');                                       // Verwijder # prefix

        if (hex.length === 3) {                                            // Kort formaat #rgb → uitbreiden naar #rrggbb
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }

        return {
            r: parseInt(hex.substring(0, 2), 16),                         // Rood component
            g: parseInt(hex.substring(2, 4), 16),                         // Groen component
            b: parseInt(hex.substring(4, 6), 16)                          // Blauw component
        };
    }

    /* ======================= RGB NAAR HEX =======================
     * Zet een RGB object {r, g, b} terug naar een hex kleurcode
     */
    function rgbToHex(r, g, b) {
        return '#' +
            Math.round(r).toString(16).padStart(2, '0') +                 // Rood als 2-cijferig hex
            Math.round(g).toString(16).padStart(2, '0') +                 // Groen als 2-cijferig hex
            Math.round(b).toString(16).padStart(2, '0');                  // Blauw als 2-cijferig hex
    }

    /* ======================= KLEUR LICHTER MAKEN =======================
     * Maakt een hex kleur X% lichter door elke component richting 255 te verschuiven
     * percent: 0 = ongewijzigd, 20 = 20% lichter, 100 = wit
     * @param  {string} hex     - Basiskleur als hex string (bv. '#2196f3')
     * @param  {number} percent - Percentage lichter (0-100)
     * @returns {string}        - Lichtere kleur als hex string
     */
    function lightenColor(hex, percent) {
        if (!hex || percent <= 0) return hex;                              // Geen wijziging nodig

        var rgb   = hexToRgb(hex);                                        // Omzetten naar RGB
        var factor = percent / 100;                                        // Factor 0-1

        // Verschuif elke component richting 255 (wit) met de opgegeven factor
        var r = rgb.r + (255 - rgb.r) * factor;                           // Rood lichter
        var g = rgb.g + (255 - rgb.g) * factor;                           // Groen lichter
        var b = rgb.b + (255 - rgb.b) * factor;                           // Blauw lichter

        return rgbToHex(r, g, b);                                         // Terug naar hex
    }

    /* ======================= KLEUR OP BASIS VAN RELATIE + INDEX =======================
     * Geeft de juiste kleur terug voor een relatietype en een volgorde-index
     * Index 0 = basiskleur, index 1 = 20% lichter, index 2 = 40% lichter, etc.
     * Maximum verlichting: 60% (daarna blijft het op 60% om leesbaarheid te bewaren)
     *
     * @param  {string} relatie - Relatietype (bv. 'VHoofdID', 'PHoofdID')
     * @param  {number} index   - Volgorde-index van dit ID (0 = eerste, 1 = tweede, ...)
     * @returns {string}        - Hex kleurcode
     */
    function getRelationColor(relatie, index) {
        var base    = BASE_COLORS[relatie] || BASE_COLORS.partner;        // Basiskleur opzoeken, fallback naar grijs
        var percent = Math.min(index * 20, 60);                           // 20% per stap, max 60%
        return lightenColor(base, percent);                                // Bereken lichtere kleur
    }

    /* ======================= CSS KLASSE KLEUR INSTELLEN =======================
     * Stelt de achtergrondkleur in op een DOM element op basis van relatie + index
     * Gebruikt inline style zodat het CSS klassen overschrijft
     * Index 0: geen inline style — CSS klasse bepaalt de kleur (ongewijzigd gedrag)
     * Index 1+: inline style met berekende lichtere kleur
     *
     * @param {HTMLElement} element - Het DOM element om te stylen
     * @param {string}      relatie - Relatietype
     * @param {number}      index   - Volgorde-index
     */
    function applyRelationColor(element, relatie, index) {
        if (!element) return;                                              // Geen element → stop

        if (index === 0) {
            element.style.removeProperty('background-color');             // Index 0: CSS klasse bepaalt kleur
            return;
        }

        var color = getRelationColor(relatie, index);                     // Bereken kleur
        element.style.backgroundColor = color;                            // Stel inline in
    }

    /* ======================= EXPORTEER =======================  */
    window.ColorHelper = {
        BASE_COLORS:        BASE_COLORS,        // Basiskleurwaarden (ook bruikbaar in timeline.js)
        lightenColor:       lightenColor,        // Kleur X% lichter maken
        getRelationColor:   getRelationColor,    // Kleur op basis van relatie + index
        applyRelationColor: applyRelationColor   // Inline stijl op DOM element toepassen
    };

})();
