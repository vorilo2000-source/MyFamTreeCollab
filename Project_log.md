MyFamTreeCollab — Project Log
## Bijgewerkt: 2026-05-09

> Chronologisch overzicht van alle sessies en wijzigingen.

---

## Sessie 23 — Manuele bevestiging + admin-notificatie + trigger fix

**Datum:** 2026-05-09
**Doel:** Confirm-knop toevoegen in accountbeheer, notificatie-mail naar admin bij bevestiging, trigger handle_new_user gerepareerd.

### Uitgevoerde acties

#### Accountbeheer — confirm-knop
- `admin_users` view herbouwd met JOIN op `auth.users` — `email_confirmed_at` toegevoegd
- RPC `confirm_user(target_id uuid)` aangemaakt — zet `email_confirmed_at = NOW()` via SECURITY DEFINER
- `accountbeheer.js` v1.2.0 → v1.3.0: confirm-knop in Acties-kolom voor onbevestigde accounts
- `renderTable()` uitgebreid: toont "Bevestigen" knop wanneer `email_confirmed_at` null is
- `confirmUser(uid, email)` toegevoegd: RPC aanroepen + Edge Function voor mail

#### Edge Function — dynamic-responder
- Edge Function `dynamic-responder` aangemaakt in Supabase dashboard
- v1.0.0: mail via Resend naar `vorilo2000@gmail.com` bij bevestiging
- v1.1.0: JWT verificatie uitgeschakeld (`verify_jwt = false`) — anon key gaf 401
- v1.2.0: ook bevestigingsmail naar het bevestigde account zelf toegevoegd
- Secret `RESEND_API_KEY` ingesteld in Supabase Edge Functions secrets
- Afzendadres: `onboarding@resend.dev` (Resend testadres — geen eigen domein vereist)

#### confirm.html — automatische flow
- `confirm.html` v1.0.0 → v1.2.0: `notifyAdmin()` toegevoegd na succesvolle `verifyOtp()`
- Authorization header verwijderd uit `notifyAdmin()` — veroorzaakte 401

#### Trigger fix
- `handle_new_user` herschreven — RLS blokkeerde INSERT via `auth.uid()` mismatch
- SECURITY DEFINER + `search_path = public` zorgt nu dat nieuwe accounts altijd profiel krijgen
- Testaccounts (Harmonica, Bike, Sax, Piano) handmatig verwijderd uit `profiles` en `auth.users`

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `js/accountbeheer.js` | v1.2.0 | v1.3.0 | confirmUser(), renderTable() confirm-knop, email_confirmed_at laden |
| `home/confirm.html` | v1.0.0 | v1.2.0 | notifyAdmin() toegevoegd, Authorization header verwijderd |

### Supabase wijzigingen

| Onderdeel | Actie |
|-----------|-------|
| `admin_users` view | Herbouwd met JOIN op `auth.users` — `email_confirmed_at` toegevoegd |
| RPC `confirm_user` | Nieuw — zet `email_confirmed_at = NOW()` via SECURITY DEFINER |
| Edge Function `dynamic-responder` | Nieuw — mail via Resend naar admin + bevestigd account |
| Secret `RESEND_API_KEY` | Ingesteld in Edge Functions secrets |
| `handle_new_user` trigger | Herschreven — SECURITY DEFINER fix voor RLS blokkade bij INSERT |

### Verificatie
- Confirm-knop zichtbaar voor onbevestigde accounts ✅
- Bevestigen via knop werkt — `email_confirmed_at` gezet ✅
- Knop verdwijnt na bevestiging ✅
- Admin ontvangt mail op `vorilo2000@gmail.com` ✅
- Bevestigd account ontvangt bevestigingsmail ✅
- Nieuwe accounts krijgen automatisch profiel via trigger ✅
- `confirm.html` stuurt notificatie na automatische bevestiging ✅

---

## Sessie 22 — Authenticatie herstel + tier model fixes

**Datum:** 2026-05-07
**Doel:** Registratie en e-mailbevestiging repareren, tier model corrigeren in database en accountbeheer.

### Uitgevoerde acties

#### Authenticatie
- Oorzaak gevonden: SUPABASE_ANON JWT key had `iat` in de toekomst (2026-06-20) — Supabase weigerde auth-calls
- Key vervangen door nieuw `sb_publishable_` formaat
- Registratie getest via console — `{ user: {...}, error: null }` bevestigd ✅
- Supabase custom SMTP (Resend) uitgeschakeld — ingebouwde Supabase mailserver hersteld
- `confirm.html` aangemaakt — verwerkt `token_hash` via `verifyOtp()` en redirect naar `index.html`
- Supabase email template `Confirm signup` bijgewerkt met nieuwe `token_hash` link naar `confirm.html`
- Supabase → Authentication → URL Configuration: Site URL en Redirect URLs ingesteld
- E-mailbevestiging getest — mail ontvangen, bevestiging werkt ✅

#### Tier model — database
- `profiles_tier_check` constraint uitgebreid met `'guest'`
- Bestaande gebruikers bijgewerkt: `tier = 'viewer'` → `'guest'` via UPDATE
- `handle_new_user` database functie bijgewerkt: `tier = 'guest'` toegevoegd aan INSERT

#### Accountbeheer UI
- `accountbeheer.html` v2.2.0 → v2.3.0: stat-cards viewer/editor vervangen door guest, tier filter aangepast
- `accountbeheer.js` v1.1.0 → v1.2.0: statViewer/statEditor → statGuest, dropdown opties guest/owner/admin, updateStats() gecorrigeerd

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `js/auth.js` | v2.5.0 | v2.5.1 | SUPABASE_ANON key → sb_publishable_ formaat |
| `home/confirm.html` | — | v1.0.0 | Nieuw — verwerkt token_hash, toont succes/fout, redirect |
| `admin/accountbeheer.html` | v2.2.0 | v2.3.0 | Stat-cards en filter: viewer/editor → guest |
| `js/accountbeheer.js` | v1.1.0 | v1.2.0 | statGuest, dropdown guest/owner/admin, updateStats() |

### Supabase wijzigingen

| Onderdeel | Actie |
|-----------|-------|
| SUPABASE_ANON key | Vervangen door `sb_publishable_` formaat |
| Custom SMTP (Resend) | Uitgeschakeld — ingebouwde mailserver actief |
| Email template Confirm signup | Bijgewerkt met `token_hash` link naar `confirm.html` |
| URL Configuration | Site URL + Redirect URLs ingesteld |
| `profiles_tier_check` | Constraint uitgebreid met `'guest'` |
| `profiles.tier` | Bestaande `viewer` rijen → `guest` via UPDATE |
| `handle_new_user` functie | `tier = 'guest'` toegevoegd aan INSERT |

### Verificatie
- Registratie werkt — user verschijnt in Supabase Authentication → Users ✅
- Bevestigingsmail wordt ontvangen ✅
- `confirm.html` verwerkt token en toont succesbericht ✅
- Nieuwe gebruikers krijgen automatisch `tier = 'guest'` ✅
- Accountbeheer toont correcte stat-cards: Totaal / Guest / Owner / Admin ✅
- Tier dropdown in accountbeheer: guest / owner / admin ✅

---

## Sessie 21 — Analytics dashboard uitbreidingen + bugfixes

**Datum:** 2026-05-04
**Doel:** Analytics dashboard verbeteren, tracking debuggen, e-mail tracking toevoegen, tier definitie corrigeren.

### Gewijzigde bestanden

| Bestand | Van | Naar | Wijziging |
|---------|-----|------|-----------|
| `js/siteAnalytics.js` | v2.0.0 | v2.6.0 | Hersteld als zelfstandig bestand, getCurrentTier() gecorrigeerd, getCurrentEmail() via getUser(), GoTrueClient fix |
| `admin/analytics-dashboard.js` | v3.0.0 | v3.9.0 | Globale filter, e-mail kolom tabel, tier e-maillijst dropdown, SiteAnalytics.trackPage() prefix fix |
| `admin/analytics.html` | v2.0.0 | v2.7.0 | Filter bar, tabel stijlen, tier e-mail lijst CSS |
| `js/auth.js` | v2.4.2 | v2.5.0 | getTier() fallback 'viewer' → 'guest', viewer/editor check toegevoegd |

---

## Sessies 1–21 — Zie eerdere PROJECT_LOG.md entries
