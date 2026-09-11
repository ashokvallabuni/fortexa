# Production Deployment

## Architecture

The Vite/TanStack Start application serves the frontend and backend routes together. Supabase provides authentication, PostgreSQL, private Storage, row-level security, and audit persistence.

## Vercel

Build command: `npm run build` (or `bun run build` if the Vercel project is explicitly configured for Bun)

Output directory: managed by the TanStack Start Nitro Vercel preset (`.output`)

Environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `SUPABASE_URL` (server-side Vercel API routes)
- `SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_ANON_KEY` (server-side Vercel API routes)
- `SUPABASE_SERVICE_ROLE_KEY` (server-side admin routes only; never expose as `VITE_*`)

The repository no longer uses a catch-all `/index.html` rewrite. TanStack Start's Nitro preset owns SSR and server-function routing. API routes use the server Supabase client for all database and Storage operations.

## Backend API

- `GET /api/health` - Supabase configuration health
- `GET /api/datasets`
- `GET /api/network/states`
- `GET /api/network/flows`
- `GET /api/graph`
- `GET /api/alerts`
- `GET /api/uploads`
- `POST /api/uploads`
- `GET /api/admin`
- `POST /api/admin`

All protected routes validate Supabase bearer tokens and query Supabase PostgreSQL or private Storage.

For local development, configure the Supabase variables in `.env` and run `npm run dev` or the repository's configured Bun equivalent.