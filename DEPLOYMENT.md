# Production Deployment

## Architecture

Vercel serves the Vite/TanStack Start frontend. Render runs the Python FastAPI service. The browser calls the Render service through `VITE_API_URL`; Vercel is not a second FastAPI deployment.

## Vercel

Build command: `npm run build` (or `bun run build` if the Vercel project is explicitly configured for Bun)

Output directory: managed by the TanStack Start Nitro Vercel preset (`.output`)

Environment variables:

- `VITE_API_URL=https://<actual-render-service>.onrender.com`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `SUPABASE_URL` (server-side Vercel API routes)
- `SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_ANON_KEY` (server-side Vercel API routes)
- `SUPABASE_SERVICE_ROLE_KEY` (server-side admin routes only; never expose as `VITE_*`)

The actual Render URL must be used. Do not set `VITE_API_URL` to localhost, `127.0.0.1`, or `0.0.0.0` in Vercel.

The repository no longer uses a catch-all `/index.html` rewrite. TanStack Start's Nitro Vercel preset owns SSR and server-function routing. The existing Vercel API routes are Supabase workspace helpers, not a duplicate FastAPI backend, and require the server-side Supabase variables configured in Vercel when those routes are used.

## Render

Runtime: Python 3.11

Build command:

```text
pip install -r requirements.txt
```

Start command:

```text
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

Health check: `/health`

Environment variables:

- `PYTHON_VERSION=3.11.11`
- `CIC_DATASET_DIR=/data/CIC-IDS2018`
- `CIC_CACHE_DIR=/data/cache`
- `CIC_CHUNK_SIZE=50000`
- `CIC_TRAINING_ROWS=200000`
- `CIC_CACHE_TTL_SECONDS=3600`
- `FRONTEND_URL=https://net-state-loom.vercel.app`
- `ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://net-state-loom.vercel.app`

Do not put Supabase service-role credentials in Render unless the backend later requires them; the current FastAPI service does not use Supabase.

The Render service must use the `runtime: python` service in `render.yaml`. If the Render dashboard is manually configured with `bun install`, change it to the commands above; Bun is only the frontend toolchain.

The persistent disk is mounted at `/data`. The CIC-IDS2018 CSV files are not committed to Git and must be placed under `/data/CIC-IDS2018` before data-dependent endpoints can return analytics. `/health` remains fast and does not require the dataset.

## Backend API

- `GET /health` - lightweight Render health check
- `GET /docs` - OpenAPI documentation
- `GET /api/health` - health plus dataset availability metadata
- `GET /api/dataset/summary`
- `GET /api/traffic/summary`
- `GET /api/attacks/distribution`
- `GET /api/traffic/timeline`
- `GET /api/features`
- `GET /api/model/status`
- `GET /api/model/metrics`
- `POST /api/model/train`
- `POST /api/predict`
- `GET /api/dashboard`

Data-dependent endpoints return a structured `503` when the Render disk has no dataset. Model training is on-demand and cached under `CIC_CACHE_DIR`; prediction trains only when the model artifact is absent.

## Local verification

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
\.venv\Scripts\Activate.ps1
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

In another terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
Invoke-WebRequest http://127.0.0.1:8000/docs -UseBasicParsing
```

For the frontend, set `VITE_API_URL=http://localhost:8000` in local `.env`, then run `npm run dev` or the repository's configured Bun equivalent.