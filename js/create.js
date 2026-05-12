// ======================= js/create.js v1.3.0 =======================
// Wijziging v1.3.0 (sessie 25):
// - Alle hardcoded statusmeldingen vervangen door i18nModule.t('create:status.*')
// - confirmBtn tekst via i18n hersteld na fout
// - limitReached melding gebruikt i18next interpolatie voor count/max
//
// Wijziging v1.2.0:
// - confirmBtn handler async gemaakt zodat await StamboomStorage.add() werkt
// - Navigatie naar manage.html pas NA het resolven van add()
// - Geblokkeerde add() (limiet bereikt) toont foutmelding i.p.v. stil te falen
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {               // Wacht tot de volledige HTML geladen is

    // ======================= DOM ELEMENTEN =======================
    const form           = document.getElementById('persoonForm');   // Het invulformulier
    const previewDiv     = document.getElementById('personPreview'); // Preview sectie
    const previewContent = document.getElementById('previewContent');// <pre> element met JSON-tekst
    const confirmBtn     = document.getElementById('confirmBtn');    // Bevestigingsknop
    const warningMessage = document.getElementById('warningMessage');// Waarschuwingsblok

    // ======================= FORM SUBMIT HANDLER =======================
    form.addEventListener('submit', function(e) {                    // Luister naar formulier-submit
        e.preventDefault();                                          // Voorkom pagina-herlaad

        const dataset = StamboomStorage.get();                       // Haal huidige personen op

        if (dataset.length > 0) {                                    // Al een persoon aanwezig?
            warningMessage.textContent = i18nModule.t('create:status.alreadyExists'); // Vertaalde waarschuwing
            warningMessage.style.display = 'block';                  // Toon waarschuwingsblok
            previewDiv.style.display = 'none';                       // Verberg preview
            return;                                                  // Stop functie
        }

        // ======================= FORMULIER WAARDEN OPHALEN =======================
        const doopnaam   = document.getElementById('doopnaam').value.trim();
        const roepnaam   = document.getElementById('roepnaam').value.trim();
        const prefix     = document.getElementById('prefix').value.trim();
        const achternaam = document.getElementById('achternaam').value.trim();
        const geboorte   = document.getElementById('geboortedatum').value;
        const geslacht   = document.getElementById('geslacht').value;

        // ======================= NIEUWE PERSOON OBJECT =======================
        const person = {
            ID: window.genereerCode(                                 // Uniek ID via idGenerator.js
                { Doopnaam: doopnaam, Roepnaam: roepnaam,
                  Achternaam: achternaam, Geslacht: geslacht },
                StamboomStorage.get()
            ),
            Doopnaam:      doopnaam,
            Roepnaam:      roepnaam,
            Prefix:        prefix,
            Achternaam:    achternaam,
            Geslacht:      geslacht,
            Geboortedatum: geboorte,
            Relatie:       'Hoofd-ID',                               // Eerste persoon is altijd Hoofd-ID
            PartnerID:     []                                        // Nog geen partners
        };

        // ======================= PREVIEW TONEN =======================
        previewContent.textContent = JSON.stringify(person, null, 2); // Leesbare JSON in preview
        previewDiv.style.display = 'block';                          // Toon preview sectie
    });

    // ======================= CONFIRM BUTTON HANDLER =======================
    confirmBtn.addEventListener('click', async function() {          // async: vereist voor await add()

        confirmBtn.disabled = true;                                  // Voorkom dubbelklik
        confirmBtn.textContent = i18nModule.t('create:status.busy'); // Vertaalde "Bezig…" tekst

        const person = JSON.parse(previewContent.textContent);       // Herstel object uit JSON-preview

        const result = await StamboomStorage.add(person);            // Wacht tot persoon opgeslagen is

        if (result === true) {
            // Succesvol opgeslagen — navigeer naar Manage
            window.location.href = '../stamboom/manage.html';

        } else if (result && result.blocked) {
            // Limiet bereikt — toon vertaalde melding met count en max
            warningMessage.textContent = i18nModule.t('create:status.limitReached', {
                count: result.count,
                max:   result.max
            });
            warningMessage.style.display = 'block';                  // Toon waarschuwingsblok
            confirmBtn.disabled = false;                             // Knop weer inschakelen
            confirmBtn.textContent = i18nModule.t('create:status.confirmBtn'); // Knoptekst herstellen

        } else {
            // Onverwachte fout
            warningMessage.textContent = i18nModule.t('create:status.saveError'); // Vertaalde foutmelding
            warningMessage.style.display = 'block';
            confirmBtn.disabled = false;
            confirmBtn.textContent = i18nModule.t('create:status.confirmBtn'); // Knoptekst herstellen
        }
    });

}); // Einde DOMContentLoaded
