/* ======================= js/relatieEngine.js v2.5.0 =======================
   Centrale relatie-berekening voor MyFamTreeCollab
   Berekent alle familierelaties rond een geselecteerde hoofdpersoon
   Exporteert: window.RelatieEngine.computeRelaties(data, hoofdId)

   Vereist: utils.js (voor safe()), schema.js (voor parsePartners())

   Wijziging v2.5.0 (sessie 35 — F3-48):
   - Alle directe string-vergelijkingen op VaderID/MoederID/PartnerID vervangen
     door parsePartners() + includes() voor correcte | ondersteuning
   - VHoofdID/MHoofdID: array via parsePartners() i.p.v. enkele string
   - PHoofdID: eerste partner via parsePartners()[0] (ongewijzigd gedrag)
   - Kind-scenario checks: parsePartners(p.VaderID/MoederID).includes()
   - BZID check: parsePartners(p.VaderID/MoederID).includes() voor zelfde ouder
   - BZPartnerID: parsePartners(s.PartnerID) voor meerdere BZ-partners
   - Relatie classificatie: VHoofdID/MHoofdID arrays via .includes()

   Wijziging v2.4.0:
   - PHoofdID bepaald via split('|')[0]: eerste partner als primaire partner

   Wijziging v2.3.0:
   - KindPartnerID verwijderd
   - Sortering onbekende geboortedatum gecorrigeerd

   Wijziging v2.2.0:
   - Secundaire sortering: binnen elke relatiegroep oud → jong

   Wijziging v2.1.0:
   - Kind-classificatie herschreven: 3 scenario's (KindID/HKindID/PHKindID)
   ========================================================================= */

(function () {
    'use strict';

    var safe          = window.ftSafe;                                     // Centrale safe() uit utils.js
    var parsePartners = window.StamboomSchema.parsePartners;               // | splitter uit schema.js

    /**
     * Berekent alle familierelaties van alle personen t.o.v. de hoofdpersoon.
     * @param  {Array}  data    - Volledige dataset van persoon-objecten
     * @param  {string} hoofdId - ID van de geselecteerde hoofdpersoon
     * @returns {Array}         - Kopie van dataset, elk persoon aangevuld met .Relatie en ._priority
     */
    function computeRelaties(data, hoofdId) {

        if (!hoofdId) return [];                                            // Geen hoofdpersoon → lege array

        var hoofd = data.find(function (p) { return safe(p.ID) === safe(hoofdId); });
        if (!hoofd) return [];                                              // Niet gevonden → stop

        var sid = safe(hoofdId);                                           // Veilige string van hoofdId

        // Ouders van hoofdpersoon als arrays — meerdere waarden via |
        // Was: const VHoofdID = safe(hoofd.VaderID) — slechts één vader
        var VHoofdIDs = parsePartners(hoofd.VaderID  || '');               // ['P010', 'P015'] of []
        var MHoofdIDs = parsePartners(hoofd.MoederID || '');               // ['P011'] of []

        // Primaire partner: eerste uit de | lijst — ongewijzigd gedrag voor scenario-logica
        var allPartners = parsePartners(hoofd.PartnerID || '');            // Alle partners
        var PHoofdID    = allPartners.length > 0 ? allPartners[0] : '';   // Eerste partner als primaire

        /* ======================= KINDEREN — 3 SCENARIO'S ======================= */
        /*
         * Scenario 1 — KindID  (kind van HoofdID + PHoofdID samen):
         *   (p.VaderIDs bevat HoofdID  EN p.MoederIDs bevat PHoofdID)
         *   OF (p.MoederIDs bevat HoofdID EN p.VaderIDs bevat PHoofdID)
         *
         * Scenario 2 — HKindID  (kind van alleen HoofdID):
         *   (p.VaderIDs bevat HoofdID  EN p.MoederIDs bevat PHoofdID NIET)
         *   OF (p.MoederIDs bevat HoofdID EN p.VaderIDs bevat PHoofdID NIET)
         *
         * Scenario 3 — PHKindID  (kind van alleen PHoofdID):
         *   (p.VaderIDs bevat PHoofdID  EN p.MoederIDs bevat HoofdID NIET)
         *   OF (p.MoederIDs bevat PHoofdID EN p.VaderIDs bevat HoofdID NIET)
         */

        var KindID   = []; // Scenario 1
        var HKindID  = []; // Scenario 2
        var PHKindID = []; // Scenario 3

        data.forEach(function (p) {
            var pid = safe(p.ID);
            if (pid === sid) return;                                        // Hoofdpersoon zelf overslaan

            // Ouders van dit kind als arrays — meerdere waarden via |
            // Was: const vader = safe(p.VaderID) — slechts één vader als string
            var vaderIDs  = parsePartners(p.VaderID  || '');               // Array van vader-IDs
            var moederIDs = parsePartners(p.MoederID || '');               // Array van moeder-IDs

            // Controleer of hoofdpersoon of partner ouder is via .includes()
            var hoofdIsVader    = vaderIDs.includes(sid);                  // Hoofd staat in vaderlijst
            var hoofdIsMoeder   = moederIDs.includes(sid);                 // Hoofd staat in moederlijst
            var partnerIsVader  = PHoofdID && vaderIDs.includes(PHoofdID); // Partner staat in vaderlijst
            var partnerIsMoeder = PHoofdID && moederIDs.includes(PHoofdID);// Partner staat in moederlijst

            var hoofdIsOuder   = hoofdIsVader   || hoofdIsMoeder;         // Hoofd is minstens één ouder
            var partnerIsOuder = partnerIsVader || partnerIsMoeder;       // Partner is minstens één ouder

            if (!hoofdIsOuder && !partnerIsOuder) return;                  // Geen relatie met dit kind

            if (hoofdIsOuder && partnerIsOuder) {
                KindID.push(pid);                                          // Scenario 1: beide ouders

            } else if (hoofdIsOuder && !partnerIsOuder) {
                HKindID.push(pid);                                         // Scenario 2: alleen hoofd

            } else if (partnerIsOuder && !hoofdIsOuder) {
                PHKindID.push(pid);                                        // Scenario 3: alleen partner
            }
        });

        /* ======================= BROERS EN ZUSSEN ======================= */

        var alleKinderen = KindID.concat(HKindID).concat(PHKindID);       // Alle kindtypen voor exclusie

        var BZID = data
            .filter(function (p) {
                var pid = safe(p.ID);
                if (pid === sid)                        return false;       // Hoofdpersoon zelf
                if (pid === PHoofdID)                   return false;       // Partner
                if (alleKinderen.indexOf(pid) !== -1)   return false;       // Kinderen

                // Zelfde vader of moeder als hoofdpersoon — via includes() op arrays
                // Was: safe(p.VaderID) === VHoofdID — slechts één vader als string
                var pVaderIDs  = parsePartners(p.VaderID  || '');          // Vaders van dit persoon
                var pMoederIDs = parsePartners(p.MoederID || '');          // Moeders van dit persoon

                // Broer/zus als minstens één gedeelde vader of moeder
                var gedeeldeVader  = VHoofdIDs.some(function (vid) { return pVaderIDs.includes(vid);  });
                var gedeeldeMoeder = MHoofdIDs.some(function (mid) { return pMoederIDs.includes(mid); });

                return gedeeldeVader || gedeeldeMoeder;
            })
            .map(function (p) { return safe(p.ID); });

        /* ======================= PARTNERS VAN BROERS/ZUSSEN ======================= */

        var BZPartnerID = [];
        BZID.forEach(function (id) {
            var s = data.find(function (p) { return safe(p.ID) === id; });
            if (!s) return;
            // Alle partners van broer/zus — meerdere via |
            // Was: return (s && safe(s.PartnerID)) ? safe(s.PartnerID) : null
            parsePartners(s.PartnerID || '').forEach(function (pid) {
                if (pid && BZPartnerID.indexOf(pid) === -1) {
                    BZPartnerID.push(pid);                                 // Uniek toevoegen
                }
            });
        });

        /* ======================= RELATIE CLASSIFICATIE ======================= */

        return data
            .map(function (p) {
                var pid   = safe(p.ID);
                var clone = Object.assign({}, p);                          // Ondiepe kopie

                clone.Relatie   = '';
                clone._priority = 99;

                if (pid === sid) {
                    clone.Relatie = 'HoofdID';  clone._priority = 1;

                // VHoofdID: hoofd staat in VHoofdIDs array
                // Was: else if (pid === VHoofdID)
                } else if (VHoofdIDs.includes(pid)) {
                    clone.Relatie = 'VHoofdID'; clone._priority = 0;

                // MHoofdID: hoofd staat in MHoofdIDs array
                // Was: else if (pid === MHoofdID)
                } else if (MHoofdIDs.includes(pid)) {
                    clone.Relatie = 'MHoofdID'; clone._priority = 0;

                } else if (pid === PHoofdID) {
                    clone.Relatie = 'PHoofdID'; clone._priority = 2;

                } else if (KindID.indexOf(pid) !== -1) {
                    clone.Relatie = 'KindID';   clone._priority = 3;

                } else if (HKindID.indexOf(pid) !== -1) {
                    clone.Relatie = 'HKindID';  clone._priority = 3;

                } else if (PHKindID.indexOf(pid) !== -1) {
                    clone.Relatie = 'PHKindID'; clone._priority = 3;

                } else if (BZID.indexOf(pid) !== -1) {
                    clone.Relatie = 'BZID';     clone._priority = 4;

                } else if (BZPartnerID.indexOf(pid) !== -1) {
                    clone.Relatie = 'BZPartnerID'; clone._priority = 4.5;
                }

                return clone;
            })
            .sort(function (a, b) {
                if (a._priority !== b._priority) return a._priority - b._priority; // Op relatievolgorde
                var da = a.Geboortedatum ? new Date(a.Geboortedatum) : new Date(9999, 0); // Onbekend → achteraan
                var db = b.Geboortedatum ? new Date(b.Geboortedatum) : new Date(9999, 0);
                return da - db;                                                     // Oud → jong
            });
    }

    /* ======================= EXPORTEER ======================= */
    window.RelatieEngine = { computeRelaties: computeRelaties };

})();
