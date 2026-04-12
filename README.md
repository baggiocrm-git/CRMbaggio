<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/917ea9bd-16c4-424b-969c-8c05b4fc4078

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Access Control

The project now enforces role-based access in both the Next.js server layer and Supabase policies.

- Server-side authorization is centralized in [lib/server-auth.ts](lib/server-auth.ts).
- Authenticated client requests use [lib/auth-fetch.ts](lib/auth-fetch.ts) to send the current bearer token.
- Internal APIs such as documents, folders, chat, Google integration, and admin routes now validate the signed-in user before accessing privileged data.
- Admin-only operations are restricted in the API layer even if someone attempts to bypass the UI.

## Supabase Migration

To activate the restrictive database policies, apply:

- [supabase/migrations/20260412161000_restrictive_access_policies.sql](supabase/migrations/20260412161000_restrictive_access_policies.sql)

This migration adds helper SQL functions and replaces permissive policies for internal tables such as documents, folders, Google tokens, HR, finance, and internal chat.

## Profiles Validated

The following profiles were manually validated after the change:

- `Administrador`: full access, including `/users` and admin APIs
- `Auxiliar Administrativo Nível 1`: internal access allowed
- `Auxiliar Administrativo Nível 2`: internal access limited, no admin access
- `Usuário Comum`: no admin access
- `Cliente`: access to `/client/rdo/:projectId`, blocked from internal APIs
