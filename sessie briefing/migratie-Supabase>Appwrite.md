# Briefing – Volledige migratie MyFamTreeCollab van Supabase naar Appwrite

## Doel

We migreren **MyFamTreeCollab** volledig van **Supabase** naar **Appwrite Cloud**.

De migratie omvat **de volledige applicatie**, inclusief de frontend, backend, administratie, gebruikersbeheer en analysetools.

Er mag **na afronding geen enkele afhankelijkheid van Supabase meer bestaan**.

---

# Scope

De migratie omvat alle onderdelen van het project, waaronder:

* Authenticatie
* Database
* Storage
* Gebruikersbeheer
* Adminfuncties
* Analytics
* Logging
* Dashboardpagina's
* Hulpscripts
* API's
* Configuratiebestanden

Alle bestaande functionaliteit moet behouden blijven.

---

# Belangrijke pagina's

Controleer en migreer expliciet ook:

* accountbeheer.html
* analytics.html
* supabase-analyse.html
* adminpagina's
* dashboardpagina's
* beheerpagina's

Indien **supabase-analyse.html** uitsluitend bedoeld is voor Supabase-diagnostiek, bepaal dan of deze:

* wordt verwijderd;
* wordt vervangen door **appwrite-analyse.html**;
* of wordt omgebouwd tot een generieke backend-analysepagina.

Maak hierover eerst een voorstel voordat de pagina wordt aangepast.

---

# Stap 1 – Volledige Analyse

Inventariseer alle Supabase-afhankelijkheden.

Zoek onder andere op:

* createClient
* supabase
* auth
* storage
* database
* realtime
* rpc
* functions
* buckets
* anonKey
* service_role
* environment variables

Maak een compleet overzicht van:

* bestand
* functie
* afhankelijkheid
* waarvoor gebruikt
* kan verwijderd worden?
* moet vervangen worden?

Wijzig in deze stap nog geen code.

---

# Stap 2 – Backend Architectuur

Maak een centrale backendlaag.

Voorstel:

/js/backend/

* appwrite.js
* config.js
* auth.js
* database.js
* storage.js
* users.js
* admin.js
* analytics.js

Alle communicatie met Appwrite verloopt uitsluitend via deze modules.

De rest van de applicatie mag geen directe Appwrite SDK-aanroepen bevatten.

---

# Stap 3 – Appwrite Configuratie

Configureer:

* Client
* Endpoint
* Project
* Database
* Collections
* Storage
* Authentication

Alle configuratie moet centraal staan.

---

# Stap 4 – Authenticatie

Migreer:

* Login
* Logout
* Registreren
* Sessies
* Huidige gebruiker
* Wachtwoord herstellen

Controleer tevens alle admincontroles.

---

# Stap 5 – Database

Vertaal alle Supabase-tabellen naar Appwrite Collections.

Controleer:

* attributen
* indexen
* relaties
* permissies

Maak generieke databasefuncties.

---

# Stap 6 – Storage

Migreer alle opslag.

Ondersteun:

* upload
* download
* verwijderen
* metadata

---

# Stap 7 – MyFamTreeCollab Structuur

Per gebruiker:

## Authentication

* account
* sessies

## Database

* profiel
* instellingen
* metadata

## Storage

Drie persoonlijke bestanden.

De database bewaart uitsluitend metadata.

De bestanden zelf staan in Storage.

---

# Stap 8 – Adminomgeving

Migreer alle beheerfunctionaliteit.

Controleer onder andere:

* accountbeheer.html
* admin-dashboard
* gebruikersoverzicht
* rollen
* permissies
* logging
* statistieken

Controleer dat alle beheerfuncties correct werken met Appwrite.

---

# Stap 9 – Analytics

Migreer analytics.

Controleer:

* gebruikersstatistieken
* opslaggebruik
* logins
* actieve gebruikers
* systeeminformatie

Vervang Supabase-afhankelijke statistieken door Appwrite-equivalenten.

---

# Stap 10 – Analysepagina

Controleer supabase-analyse.html.

Bepaal of deze:

* verwijderd wordt;
* hernoemd wordt naar appwrite-analyse.html;
* of een generieke backend-analysepagina wordt.

Maak eerst een voorstel.

---

# Stap 11 – Gefaseerde Migratie

Werk steeds volgens:

Analyse

↓

Implementatie

↓

Test

↓

Commit

↓

Volgende stap

Geen grote refactors ineens.

---

# Stap 12 – Opschonen

Na afronding:

* verwijder Supabase SDK
* verwijder Supabase configuratie
* verwijder oude helperfuncties
* verwijder ongebruikte imports
* verwijder oude environment variables

Controleer dat nergens nog Supabase voorkomt.

---

# Stap 13 – Testplan

Controleer minimaal:

## Authentication

* Registreren
* Login
* Logout
* Sessies
* Reset wachtwoord

## Database

* CRUD-operaties
* Query's
* Filters
* Zoekfuncties

## Storage

* Upload
* Download
* Verwijderen

## Admin

* Gebruikersbeheer
* Rollen
* Beheerfuncties

## Analytics

* Statistieken
* Dashboards
* Overzichten

## Security

* Iedere gebruiker ziet uitsluitend eigen gegevens.
* Bestanden zijn privé.
* Adminrechten functioneren correct.
* Permissions zijn correct ingesteld.

---

# Ontwikkelrichtlijnen

* Analyseer eerst, wijzig daarna.
* Maak geen aannames.
* Houd modules klein en overzichtelijk.
* Vermijd dubbele code.
* Centraliseer configuratie.
* Maak uitbreidbare wrappers.
* Documenteer belangrijke keuzes.

---

# Eindresultaat

Na afronding:

* Supabase is volledig verwijderd.
* Appwrite is de enige backend.
* Alle pagina's functioneren met Appwrite.
* De adminomgeving werkt volledig.
* Accountbeheer werkt volledig.
* Analytics werkt volledig.
* De opslag gebruikt uitsluitend Appwrite Storage.
* De database gebruikt uitsluitend Appwrite Database.
* De frontend communiceert uitsluitend via de centrale backendlaag.
* De codebase is modulair en voorbereid op toekomstige uitbreidingen of een eventuele backendwissel.
