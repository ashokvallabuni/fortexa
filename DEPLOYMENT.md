# Production Deployment

## Architecture

The Next.js App Router application serves the frontend and Route Handlers together. Supabase provides authentication, PostgreSQL, private Storage, row-level security, and audit persistence.

## Vercel

Build command: `npm run build` (or `bun run build` if the Vercel project is explicitly configured for Bun)

Output directory: managed by Next.js (`.next`)

Environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side admin routes only; never expose publicly)

The App Router owns SSR and Route Handler routing. API routes use the server Supabase client for all database and Storage operations.

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