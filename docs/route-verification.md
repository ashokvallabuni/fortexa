# Route Verification

The route checker uses Node.js native `fetch`, does not follow redirects, enforces a 2-second response limit, and fails on HTTP 5xx responses or connection errors. Node.js 18 or newer is required.

## Run locally

Start the app in one terminal:

```powershell
npm run dev
```

Run the checks in another terminal:

```powershell
npm run test:routes
```

The local checks cover `/`, `/auth/callback`, the OAuth denial callback, and `/dashboard`.

## Run against production

PowerShell:

```powershell
$env:ROUTE_TEST_PRODUCTION_URL = "https://yourdomain.com"
npm run test:routes
```

Bash or CI:

```bash
ROUTE_TEST_PRODUCTION_URL=https://yourdomain.com npm run test:routes
```

Use the deployed application URL, not the `yourdomain.com` placeholder. The script rejects that placeholder to prevent a false CI configuration.

## Inspect redirects with cURL

PowerShell and Windows cURL (`curl.exe`):

```powershell
curl.exe -sS -D - -o NUL --max-redirs 0 http://localhost:3000/
curl.exe -sS -D - -o NUL --max-redirs 0 http://localhost:3000/dashboard
curl.exe -sS -D - -o NUL --max-redirs 0 http://localhost:3000/auth/callback
curl.exe -sS -D - -o NUL --max-redirs 0 "http://localhost:3000/auth/callback?error=access_denied&error_description=User+denied"
```

The protected and callback requests should show a `3xx` status and a `Location` header whose path is `/login`. The home page should show `200 OK`.

For production, replace `http://localhost:3000` with the deployed origin.

## CI checklist

- Start the server before `npm run test:routes`, or run the checker against the deployed URL.
- Set `ROUTE_TEST_PRODUCTION_URL` to the real HTTPS origin for deployment checks.
- Keep `ROUTE_TEST_TIMEOUT_MS=2000` unless the environment has a documented latency budget.
- Confirm `/dashboard` never becomes a 500 when Supabase configuration is missing or unavailable.
- Confirm callback requests without `code`, with `error=access_denied`, and with an invalid code remain controlled redirects.
- Confirm OAuth provider redirect URLs include the deployed `/auth/callback` URL and the local callback URL used for development.
