# FORTEXA Supabase Setup

## Required environment

Copy `.env.example` to the deployment environment and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` for browser requests and cookie-backed server requests
- `SUPABASE_SERVICE_ROLE_KEY` only in the server/runtime environment

Never expose `SUPABASE_SERVICE_ROLE_KEY` through public variables or client code.

## Database migrations

Apply migrations with the Supabase CLI from the repository root:

```powershell
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

The migrations create the organization, membership, role-permission, audit, ingestion, network, model, and access-control structures. The migrations are ordered so the enum values are committed before `SUPER_ADMIN` and workspace permissions are inserted.

## Authentication

Enable Email provider in Supabase Authentication. Configure the Site URL and redirect URLs for:

- `http://localhost:3000/login`
- `http://localhost:3000/workspace`
- the production `/login` and `/workspace` URLs

Google OAuth is optional. When enabled, configure the Google client ID/secret in Supabase and add the production callback URL shown by Supabase.

FORTEXA uses `@supabase/ssr` browser and server clients with cookie-backed sessions. Credentials remain in Supabase Auth; application tables never store plaintext passwords.

## First administrator bootstrap

The database bootstrap maps the authenticated Supabase user with email `ashokvallabhuni28@gmail.com` to:

- profile: Ashok Vallabhuni
- role: `SUPER_ADMIN`
- organization: `FORTEXA Platform`
- permission: `admin.console`

If the Auth identity already exists, the migration promotes it. If it does not exist, create or invite the user through Supabase Auth or the secured admin invitation API. The trigger promotes the identity when it is created or its email is updated. No password or secret is embedded in the repository.

## Roles and workspaces

- `SUPER_ADMIN` -> `/admin`
- `SECURITY_MANAGER` -> `/security`
- `SOC_ANALYST` -> `/soc`
- `NETWORK_SECURITY_ADMIN` -> `/network`
- `RESEARCHER` -> `/research`

Legacy roles remain supported for existing data: `admin`, `viewer`, `analyst`, and `researcher` map to the corresponding workspace where applicable.

Every workspace route checks the `can_access_admin` database function. Server APIs independently validate the bearer token and required permission. Frontend role labels are never used as an authorization boundary.

## Storage

The ingestion migration creates the private `network-uploads` bucket. PCAP, CSV, NetFlow, and IPFIX files are stored in Supabase Storage and represented by `datasets` and `uploads` rows. The server performs validation and processing; private files are not public. Add signed download URLs only in an authorized server endpoint when evidence or reports need to be downloaded.

## RLS and audit

RLS is enabled for profiles, memberships, organizations, role permissions, datasets, uploads, network data, alerts, models, and audit logs. Service-role access is restricted to server modules. Administrative mutations write audit records containing actor ID/email, action, resource, timestamp, outcome, request metadata, and safe before/after values. Passwords, access tokens, and service keys must never be written to audit detail.

## Local development

```powershell
bun install --frozen-lockfile
bun run dev
```

## Production deployment

1. Configure server-only Supabase variables in the hosting provider.
2. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for project `amrzlzjxwonyzuhncdfk`.
3. Run `supabase db push` against the target project.
4. Enable the Auth providers and redirect URLs.
5. Verify the private Storage bucket exists.
6. Sign in with the approved administrator email and confirm `/admin`.
7. Test each workspace with a separate Auth identity and membership.
8. Confirm unauthenticated API requests return `401` and unauthorized workspace/admin requests return `403` or redirect to the resolver.

## Troubleshooting

- `Access configuration required`: the Auth user has no organization membership/role permission.
- `Administrator permission required`: the user is authenticated but lacks `admin.console`.
- Repeated login redirects: check the Supabase Site URL, redirect URLs, persistent browser storage, and that migrations are applied.
- Upload authorization failures: confirm the user has the appropriate organization permission and the private `network-uploads` bucket exists.
- Missing live metrics: an empty state is expected until authorized datasets, network states, alerts, or processing jobs exist.
