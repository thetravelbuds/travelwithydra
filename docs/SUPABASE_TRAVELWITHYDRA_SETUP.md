# Supabase setup — travelwithhydra organization

Use the **travelwithydra** Supabase organization (dashboard may show as travelwithhydra — same account).

## Where credentials live today

| Location | Project | Notes |
|----------|---------|--------|
| `.env.local` | `ijtguirploawplzkwdin` | Old project — **not** your travelwithhydra org |
| Netlify env vars | Same old project | Imported during an earlier deploy |
| `public/env-config.js` | Generated at build | Built from `.env` / Netlify env — not committed with secrets |
| GitHub | None | `.env` files are gitignored (correct) |

The travelwithhydra dashboard screenshot shows **no projects yet** — the live site is still talking to the old database until you complete the steps below.

## Option A — Automated (recommended)

1. Open **https://supabase.com/dashboard/account/tokens** while logged in as **travelwithhydra**.
2. Create a token (e.g. name: `travelwithydra-cli`).
3. In PowerShell from the project root:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "sbp_your_token_here"
.\scripts\provision-supabase-travelwithydra.ps1
```

This script will:

- Create project `travelwithydra` in the **travelwithhydra** org (if missing)
- Push all migrations in `supabase/migrations/`
- Write new URL + keys to `.env.local`
- Update Netlify env vars (if Netlify CLI is logged into travelwithydra)
- Regenerate `public/env-config.js`

4. Redeploy:

```powershell
netlify deploy --prod
```

## Option B — Manual (dashboard)

1. In **travelwithhydra** org → **+ New project** → name: `travelwithydra`, region: `West EU (London)` or closest to you.
2. **Settings → API** — copy **Project URL** and **anon public** key.
3. **Settings → API** — copy **service_role** key (Netlify only — never in frontend).
4. Update `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

5. Link CLI and push schema:

```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
npm run generate-env
```

6. Set the same variables in **Netlify → travelwithydraa → Environment variables**, then redeploy.

## Auth URLs (required)

In **Authentication → URL Configuration** for the new project:

| Setting | Value |
|---------|--------|
| Site URL | `https://travelwithydra.com` |
| Redirect URLs | `https://travelwithydra.com/**`, `http://localhost:5173/**` |

## Migrations included

All schema is in `supabase/migrations/`:

- Core profiles, trips, visa applications
- Visa requirements data
- Admin email center + site settings
- Storage buckets (`user-documents`, `trip-documents`)
- travelwithydra email template branding

## Verify

After deploy, open the browser console on https://travelwithydra.com — you should **not** see “USING MOCK SUPABASE CLIENT”.
