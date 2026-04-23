# MyFamTreeCollab — Project Log
## Bijgewerkt: 2026-04-20

> Chronologisch overzicht van alle sessies en wijzigingen.

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
| `bronnen/handleiding.html` | v1.6.0 | v1.7.0 | Volledig herschreven naar nieuw rolmodel (zie wijzigingen) |
 
#### Bugfix — bevestigingsmail redirect
 
Supabase stuurde bevestigingslink naar `https://vorilo2000-source.github.io/#access_token=...` in plaats van naar `/MyFamTreeCollab/`. Opgelost door de Confirm signup e-mail template aan te passen:
 
**Oud:**
```html
<a href="{{ .ConfirmationURL }}"
```
**Nieuw:**
```html
<a href="{{ .SiteURL }}/#{{ .TokenHash }}&type=signup"
```
 
#### Ko-fi
Footer en handleiding bijgewerkt naar `https://ko-fi.com/vorilo`
 
#### GitHub
Repo overgezet naar `https://github.com/vorilo2000-source/MyFamTreeCollab`
GitHub Pages live op `https://vorilo2000-source.github.io/MyFamTreeCollab`
 
### Openstaande punten
 
| Punt | Actie |
|------|-------|
| Invite user e-mail template | `{{ .ConfirmationURL }}` ook vervangen door `{{ .SiteURL }}/#{{ .TokenHash }}&type=invite` |
| Reset password e-mail template | Controleren of redirect correct werkt na fix |
| Admin beheerpagina | Toegevoegd als FA-14 in backlog |
| Fase 6 rolmodel | Volgende prioriteit — F6-01 t/m F6-17 |
 
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

### Ontwerpbeslissingen

| Vraag | Beslissing |
|-------|-----------|
| Hoe landen editors op gedeelde stamboom | Laden via storage.html → zelfde localStorage flow als eigen bomen |
| Wie mag uitnodigen | Alleen owner. Editor/viewer kunnen zichzelf verwijderen (verlaat samenwerking) |
| Gratis account blokkeren bij uitnodigen | Via `profiles.tier = 'free'` check in shareModule.js |
| Tier-bron | `profiles` voor tier, `user_profiles` voor display_name |
| Pagina geblokkeerd UI | Foutblok op pagina, `<main>` verborgen — geen redirect |
| collab_messages boom_id | UUID (was TEXT) — gemigreerd |
| Realtime polling collab | Nee — laden bij paginaöpening en na eigen bericht |

### Rolmatrix geïmplementeerd

| Pagina | Owner | Editor | Viewer | Gratis |
|--------|-------|--------|--------|--------|
| view.html | ✅ | ✅ | ✅ | ✅ eigen |
| timeline.html | ✅ | ✅ | ✅ | ✅ eigen |
| stats.html | ✅ | ✅ | ✅ | ✅ eigen |
| storage.html | ✅ | ✅ | ✅ | ✅ lokaal |
| collab.html | ✅ | ✅ | ✅ | ❌ |
| manage.html | ✅ | ✅ | ❌ | ✅ eigen |
| create.html | ✅ | ❌ | ❌ | ✅ |
| import.html | ✅ | ❌ | ❌ | ✅ |
| export.html | ✅ | ❌ | ❌ | ✅ |

### Backlog wijzigingen

- F5-04 → ✅ Gedaan
- F5-05 → ✅ Gedaan (collab.html berichtenboard uitgewerkt)

---

## Sessie 12 — Fase A+: Tier systeem, admin beveiliging & e-mail templates

**Datum:** april 2026
**Doel:** Tier/rollen systeem opzetten, admin dropdown beveiligen, e-mail templates in huisstijl.

### Nieuwe bestanden

| Bestand | Versie | Omschrijving |
|---------|--------|--------------|
| — | — | Geen nieuwe bestanden |

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `js/auth.js` | v2.2.0 | v2.3.0 | `getTier()` toegevoegd, `getProfile()` haalt nu ook tier, is_admin, is_premium op |
| `js/cloudSync.js` | v1.0.0 | v1.1.0 | Tiercontrole: alleen premium/admin mag cloud gebruiken |
| `js/storage.js` | v2.0.1 | v2.0.2 | `canAdd()` toegevoegd (lokaal limiet 100 voor free), `getModified()` voor conflictdetectie |
| `js/topbar.js` | v2.0.2 | v2.0.3 | `_showAdminDropdown()` toegevoegd — admin check na login |
| `Layout/Navbar.html` | v0.0.1 | v0.0.2 | `#adminDropdown` standaard `display:none` |
| `stamboom/storage.html` | v2.2.0 | v2.3.0 | Tier meldingen, FA+-06 conflictmelding, upgrade melding voor free gebruikers |
| `bronnen/handleiding.html` | v1.0.0 | v1.1.0 | Tekstverbeteringen doorgevoerd |

### Supabase wijzigingen

| Onderdeel | Wijziging |
|-----------|-----------|
| `profiles` tabel | Kolommen toegevoegd: `is_admin`, `is_premium`, `tier`, `tier_until` |
| Constraint | `profiles_tier_check` — geldige tiers: free, viewer, supporter, personal, family, researcher, admin |
| Admin account | `thvd64@gmail.com` ingesteld als `is_admin=true, is_premium=true, tier=admin` |
| SQL bestand | "MyFamTreeCollab — roles & tiers" opgeslagen in PRIVATE queries |

### E-mail templates (alle bijgewerkt in huisstijl)

| Template | Status |
|----------|--------|
| Confirm signup | ✅ Huisstijl toegepast |
| Reset password | ✅ Huisstijl toegepast |
| Invite user | ✅ Huisstijl toegepast |
| Magic Link | ✅ Huisstijl toegepast |
| Change Email | ✅ Huisstijl toegepast |

### Tier structuur vastgelegd

| Tier | Lokaal | Cloud | Opmerkingen |
|------|--------|-------|-------------|
| free | 100 personen | ❌ | Gratis, geen account vereist |
| viewer | — | ❌ eigen | ✅ gedeelde stambomen bekijken (Fase 5) |
| supporter | Onbeperkt | ✅ | Ko-fi donateur |
| personal | Onbeperkt | ✅ | Betaald abonnement |
| family | Onbeperkt | ✅ | Betaald abonnement |
| researcher | Onbeperkt | ✅ | Betaald abonnement |
| admin | Onbeperkt | ✅ geen limiet | thvd64@gmail.com |

### Toekomstige beslissingen vastgelegd

- Meerdere stambomen per gebruiker → Fase 5 (F5-07)
- account.html → Fase 5 (F5-08)
- Promotiecodes → Fase 5 (F5-09)
- Abonnementsprijzen → nog te definiëren (F5-10)

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

### Supabase wijzigingen

| Tabel | Kolommen | RLS |
|-------|----------|-----|
| `stambomen` | `id, user_id, data (jsonb), updated_at` | Aan — eigen rij per gebruiker |
| Constraint | `stambomen_user_id_unique` | Één rij per gebruiker — vereist voor upsert |

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

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `Layout/TopBar.html` | v0.2 | v0.4 | Auth slot + Ko-fi knop toegevoegd |
| `Layout/Footer.html` | v1.4 | v1.5 | Ko-fi knop toegevoegd |
| `home/about.html` | v2.0.2 | v2.0.3 | Ko-fi sectie toegevoegd |
| `home/create.html` | v2.0.0 | v2.0.1 | Supabase scripts + correcte laadvolgorde |
| `home/export.html` | v2.1.0 | v2.1.1 | Supabase scripts + correcte laadvolgorde |
| `index.html` | v2.0.1 | v2.0.2 | Supabase scripts + correcte laadvolgorde |

### Supabase configuratie

| Onderdeel | Waarde |
|-----------|--------|
| Project URL | `https://xpufzrjncivyzyukwcmn.supabase.co` |
| Tabel | `profiles` (id, username, avatar_id, created_at) |
| RLS | Aan — gebruiker ziet alleen eigen profiel |
| Trigger | `handle_new_user` — maakt profiel aan bij registratie |
| SMTP | Gmail App Password |
| Redirect URL | `https://thvd64-cyber.github.io/MyFamTreeCollab/home/reset.html` |
| Site URL | `https://thvd64-cyber.github.io/MyFamTreeCollab` |

---

## Sessies 1–9 — Zie eerdere PROJECT_LOG.md entries
