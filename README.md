# ClearContent CMS

Supabase-backed CMS + public website with Netlify Functions for inquiry email notifications.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Supabase (Postgres, Auth, RLS)
- Netlify (static hosting + serverless functions)

## Local development

1. Install dependencies:
```bash
npm install
```

2. Create local env file from template:
```bash
cp .env.example .env
```
If you are on Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

3. Fill `.env` values with your real project configuration.

4. Start dev server:
```bash
npm run dev
```

5. Build check:
```bash
npm run build
```

## Supabase setup + migrations

1. Create a Supabase project.
2. Open SQL Editor (or Supabase CLI migrations) and run:
   - `supabase/migrations/202603010001_init_cms.sql`
3. This migration creates:
   - CMS tables (`teams`, `sites`, `pages`, `blocks`, `menus`, `forms`, `seo`)
   - pipeline tables (`inquiries`, `audit_log`, `revisions`)
   - auth roles table (`user_roles`)
   - indexes, helper functions, RLS policies, and seed content
4. In Supabase Auth, create at least one user for CMS login.
5. Insert/assign role rows in `user_roles` for that user and site.

## Netlify deploy steps

1. Push repository to GitHub.
2. In Netlify, create a new site from that repo.
3. Netlify picks up `netlify.toml`:
   - build command: `npm run build`
   - publish dir: `dist`
   - functions dir: `netlify/functions`
   - SPA redirect: `/* -> /index.html`
4. Add environment variables in Netlify Site Settings:
   - Public/client:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_TEAM_SLUG`
     - `VITE_STUDENT_NAME`
   - Server-only/functions:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `RESEND_API_KEY`
     - `NOTIFY_EMAIL_TO`
     - `TEAM_SLUG`
5. Trigger deploy.
6. Verify:
   - app routes work (SPA redirect)
   - functions work at `/.netlify/functions/send-inquiry-email`
   - static `ai-web-2026.txt` is served at `/ai-web-2026.txt`

## CMS access (login flow)

1. Open `/cms`.
2. Login using Supabase Auth email/password.
3. Access is enforced via RLS + `user_roles`:
   - `Superadmin`: full access
   - `Admin`: full site access + user/role management
   - `Editor`: content editing without user/role management
4. If login works but data access is denied, verify role assignment in `user_roles`.

## Security and secrets

- Never commit real secrets.
- `.gitignore` excludes:
  - `node_modules`
  - `dist`
  - `.netlify`
  - `.env*` (except `.env.example`)
- Keep only placeholders in `.env.example`.
