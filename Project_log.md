# MyFamTreeCollab — Project Log
## Bijgewerkt: 2026-04-24

> Chronologisch overzicht van alle sessies en wijzigingen.

---

## Sessie 16 — Fase 6 rolmodel implementatie (code aanpassingen)

**Datum:** 2026-04-24
**Doel:** Alle code aanpassingen voor het nieuwe rolmodel doorvoeren in auth.js, cloudSync.js, shareModule.js, accessGuard.js, storage.js, versionControl.js, storage.html en demo.js. Handleiding, BACKLOG en PROJECT_LOG bijgewerkt.

### Uitgevoerd

#### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `js/auth.js` | v2.4.0 | v2.4.1 | `getTier()` fallback `'free'` → `'viewer'`, JSDoc Returns bijgewerkt naar nieuw rolmodel |
| `js/cloudSync.js` | v2.1.2 | v2.2.0 | `CLOUD_TIERS` → `['owner','admin']`, `_checkCloudAccess()` `'free'` check → `['viewer','editor']` |
| `js/shareModule.js` | v1.0.1 | v1.1.0 | Tier-check uitnodigende gebruiker (alleen owner/admin), tier-check uitgenodigde gebruiker verwijderd (elke ingelogde gebruiker mag worden uitgenodigd) |
| `js/accessGuard.js` | v1.0.0 | v1.1.0 | Rolnamen waren al correct — dubbele bestandsinhoud verwijderd (440 → 223 regels) |
| `js/storage.js` | v2.1.0 | v2.2.0 | `canAdd()` viewer/editor zelfde limiet als gast (60), owner/admin onbeperkt. Fallback `'free'` → `'viewer'`. MAX_LOCAL_FREE comment gecorrigeerd naar 60 |
| `js/versionControl.js` | v1.0.0 | v1.1.0 | MAX_VERSIONS = 5, `restoreVersion()` tier-check toegevoegd als Step 0 — alleen owner en admin mogen terugzetten |
| `stamboom/storage.html` | v2.6.0 | v2.7.1 | Actieve stamboom balk op "Mijn data" tabblad (F6-13), upgrade-prompt voor viewer/editor (F6-12), Ko-fi link bijgewerkt, uitnodigingstekst bijgewerkt, bugfix verwijderStamboom() + resetBtn |
| `bronnen/handleiding.html` | v1.7.0 | v1.8.0 | Demo-melding sectie 1, actieve balk sectie 8, cloud verwijderen sectie 10, uitnodiging sectie 14, roltabel bijgewerkt |

#### Nieuw bestand

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `js/demo.js` | v1.0.0 | Hardcoded fictieve demo stamboom voor gasten. 37 personen, 2 families (De Vries + Martens), 6 generaties, ex-partners, kinderen van beide relaties. Publieke API: `loadDemo(force?)`, `isDemo()`, `getPersons()` |

#### Bugfixes deze sessie

| ID | Omschrijving | Oplossing |
|----|-------------|-----------|
| BF-15 | `verwijderStamboom()` wiste actieve ID/naam niet na verwijdering — cloud lijst toonde nog 'actief' badge | `setActiveTreeId(null)` + `setActiveTreeName(null)` toegevoegd in `verwijderStamboom()` na success |
| BF-16 | `resetBtn` wiste actieve ID/naam niet — ACTIEF-balk bleef zichtbaar na reset | Zelfde fix in resetBtn click handler |

#### Ontwerpbeslissingen

| Vraag | Beslissing |
|-------|-----------|
| Mag viewer worden uitgenodigd voor gedeelde stamboom? | Ja — elke ingelogde gebruiker mag worden uitgenodigd. Viewer heeft geen eigen cloud opslag maar kan via uitnodiging toegang krijgen tot een specifieke stamboom. RLS regelt de toegang. |
| Fallback tier bij fout of niet-ingelogd | `'viewer'` (was `'free'`) — consistent met nieuw rolmodel, `'free'` bestaat niet meer |
| Lokale limiet viewer/editor | Zelfde als gast: 60 personen. Owner/admin onbeperkt. |
| Demo stamboom structuur | 37 personen, ruim onder 60-limiet. Familie De Vries (6 generaties) + Familie Martens (2 generaties, verbonden via ex-partner Eva Smits). |

### Openstaande punten

| Punt | Bestand | Actie |
|------|---------|-------|
| Invite user e-mail template | Supabase auth templates | `{{ .ConfirmationURL }}` vervangen door `{{ .SiteURL }}/#{{ .TokenHash }}&type=invite` |
| Reset password template | Supabase auth templates | Controleren of redirect correct werkt |
| Admin beheerpagina | `develop/admin/` | FA-14 — na Fase 6 |
| `abonnementen/overzicht.html` | — | F6-17 — bijwerken naar nieuwe rollen |
| demo.js koppelen aan pagina's | `index.html` e.a. | Demo laden bij gast-sessie (DOMContentLoaded check) |

---

## Sessie 15 — Account overdracht & Supabase inrichting

**Datum:** 2026-04-23
**Doel:** Volledige overdracht van thvd64@gmail.com naar vorilo2000@gmail.com. Nieuw Supabase project ingericht, GitHub repo overgezet, Ko-fi bijgewerkt, handleiding herschreven naar nieuw rolmodel.

### Uitgevoerd

#### Supabase nieuw project (oihzuwlcgyyeuhghjahp)
Alle tabellen, RLS policies, triggers en functies opnieuw aangemaakt:

| Onderdeel | Actie |
|-----------|-------|
| Tabellen | `profiles`, `stambomen`, `stamboom_gedeeld`, `collab_messages`, `user_profiles` aangemaakt |
| RLS | Alle policies ingesteld per tabel |
| Trigger | `handle_new_user` — profiel aanmaken bij registratie |
| RPC | `get_user_id_by_email(email)` — security definer |
| Auth URLs | Site URL + Redirect URL ingesteld op nieuwe GitHub Pages URL |
| SMTP | Gmail App Password ingesteld voor vorilo2000@gmail.com |
| E-mail templates | Alle 5 templates bijgewerkt naar nieuwe GitHub Pages URL |

#### Testaccounts aangemaakt

| Account | Gebruikersnaam | Tier |
|---------|---------------|------|
| vorilo2000@gmail.com | Vorilo | admin |
| buddy00@live.nl | Buddy | viewer |
| thvd64@gmail.com | Theo | owner |
| thvd64@icloud.com | Theo (icloud) | editor |

#### Code aanpassingen

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `js/auth.js` | v2.3.0 | v2.3.1 | SUPABASE_URL + SUPABASE_ANON + redirectTo bijgewerkt naar nieuw project |
| `js/topbar.js` | v2.2.1 | v2.2.2 | `_showAdminDropdown()` uitgebreid met `developDropdown` |
| `bronnen/handleiding.html` | v1.6.0 | v1.7.0 | Volledig herschreven naar nieuw rolmodel |

#### Bugfix — bevestigingsmail redirect

Supabase stuurde bevestigingslink naar `https://vorilo2000-source.github.io/#access_token=...` in plaats van naar `/MyFamTreeCollab/`. Opgelost door de Confirm signup e-mail template aan te passen:

**Oud:** `<a href="{{ .ConfirmationURL }}"`
**Nieuw:** `<a href="{{ .SiteURL }}/#{{ .TokenHash }}&type=signup"`

#### Ko-fi
Footer en handleiding bijgewerkt naar `https://ko-fi.com/vorilo`

#### GitHub
Repo overgezet naar `https://github.com/vorilo2000-source/MyFamTreeCollab`
GitHub Pages live op `https://vorilo2000-source.github.io/MyFamTreeCollab`

---

## Sessie 13 — F5-04: Stamboom delen, toegangsbeveiliging & collab berichtenboard

**Datum:** 2026-04-20
**Doel:** Stamboom delen met viewer/editor rollen, pagina-toegangsbeveiliging per rol, uitwerking collab.html berichtenboard.

### Nieuwe bestanden

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `js/shareModule.js` | v1.0.0 | Uitnodigen, lijst ophalen, intrekken, verlaten samenwerking, rolcheck per stamboom |
| `js/accessGuard.js` | v1.0.0 | Herbruikbare pagina-toegangsbeveiliging op basis van rol — verbergt main, toont foutblok |

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `stamboom/storage.html` | v2.5.0 | v2.6.0 | Delen knop + inline deelpaneel per rij, tabblad "🔗 Gedeeld met mij" |
| `stamboom/manage.html` | v2.2.3 | v2.3.0 | AccessGuard: alleen editor + owner |
| `home/create.html` | v2.0.1 | v2.0.2 | AccessGuard: alleen owner |
| `home/import.html` | v2.0.2 | v2.0.3 | AccessGuard: alleen owner + dubbele script-blokken opgeruimd |
| `home/export.html` | v2.1.2 | v2.1.3 | AccessGuard: alleen owner |
| `stamboom/collab.html` | v1.0.0 | v2.0.0 | Laadvolgorde uitgebreid: schema.js, storage.js, shareModule.js, accessGuard.js |
| `js/collab.js` | v1.0.0 | v2.0.0 | Herschreven: AuthModule client, ShareModule rolcheck, livesearch op StamboomStorage |
| `bronnen/handleiding.html` | v1.5.0 | v1.6.0 | Sectie 14 (stamboom delen) en 15 (berichtenboard) toegevoegd |

### Supabase wijzigingen

| Blok | Onderdeel | Wijziging |
|------|-----------|-----------|
| 1 | Tabel `stamboom_gedeeld` | Aangemaakt met kolommen: id, stamboom_id (UUID FK), eigenaar_id, viewer_id, rol (viewer/editor), gedeeld_op. Unique constraint op (stamboom_id, viewer_id). |
| 1 | RLS `stamboom_gedeeld` | 5 policies: eigenaar leest gedeeld, viewer leest eigen gedeeld, eigenaar deelt (insert), eigenaar trekt in (delete), gebruiker verlaat samenwerking (delete eigen rij) |
| 2 | RLS `stambomen` | 2 policies toegevoegd: viewer/editor leestoegang, editor schrijftoegang via stamboom_gedeeld |
| 3 | RPC functie | `get_user_id_by_email(email text)` — security definer, zoekt user_id op via auth.users |
| 4 | Tabel `collab_messages` | Opnieuw aangemaakt: boom_id gewijzigd van TEXT naar UUID (references stambomen.id on delete cascade). RLS: lezen/schrijven voor toegangsgerechtigden, verwijderen voor owner of eigen bericht |

---

## Sessie 12 — Fase A+: Tier systeem, admin beveiliging & e-mail templates

**Datum:** april 2026
**Doel:** Tier/rollen systeem opzetten, admin dropdown beveiligen, e-mail templates in huisstijl.

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `js/auth.js` | v2.2.0 | v2.3.0 | `getTier()` toegevoegd, `getProfile()` haalt nu ook tier, is_admin, is_premium op |
| `js/cloudSync.js` | v1.0.0 | v1.1.0 | Tiercontrole: alleen premium/admin mag cloud gebruiken |
| `js/storage.js` | v2.0.1 | v2.0.2 | `canAdd()` toegevoegd (lokaal limiet 100 voor free), `getModified()` voor conflictdetectie |
| `js/topbar.js` | v2.0.2 | v2.0.3 | `_showAdminDropdown()` toegevoegd — admin check na login |
| `Layout/Navbar.html` | v0.0.1 | v0.0.2 | `#adminDropdown` standaard `display:none` |
| `stamboom/storage.html` | v2.2.0 | v2.3.0 | Tier meldingen, FA+-06 conflictmelding, upgrade melding voor free gebruikers |

---

## Sessie 11 — Fase A+: Cloud backup

**Datum:** april 2026
**Doel:** Cloud backup implementeren via Supabase tabel `stambomen`.

### Nieuwe bestanden

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `js/cloudSync.js` | v1.0.0 | Cloud sync module: `saveToCloud()`, `loadFromCloud()`, `getCloudMeta()` |

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `stamboom/storage.html` | v2.0.2 | v2.2.0 | Tabbladen Mijn data + Cloud backup, cloud UI |
| `js/storage.js` | v1.0.0 | v2.0.1 | `replaceAll()` methode toegevoegd |

---

## Sessie 10 — Fase A: Auth, Login Modal, Ko-fi, SMTP & Wachtwoord Reset

**Datum:** april 2026
**Doel:** Supabase authenticatie opzetten, login modal bouwen, Ko-fi integreren, SMTP werkend krijgen en wachtwoord-reset flow implementeren.

### Nieuwe bestanden

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| `js/auth.js` | v2.2.0 | Supabase auth module: register, login, logout, resetPassword, updatePassword, getProfile |
| `js/topbar.js` | v2.0.2 | TopBar auth modal: login, registratie, wachtwoord vergeten tabs |
| `js/reset.js` | v1.0.0 | Wachtwoord reset logica voor reset.html |
| `home/reset.html` | v1.0.0 | Wachtwoord instellen pagina na resetlink uit mail |
| `bronnen/handleiding.html` | v1.0.0 | Gebruikershandleiding |

---

## Sessies 1–9 — Zie eerdere PROJECT_LOG.md entries
