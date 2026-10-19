# Deploying for free (Neon + Render + Vercel + GitHub Actions)

The live site runs entirely on free tiers. No credit card needed.

```
Browser ──loads the site──▶ Vercel (React build: HTML/CSS/JS)
   │
   └──fetch /api/*──▶ Render (Node API, built from api/Dockerfile) ──SQL──▶ Neon (PostgreSQL)
                                                                              ▲
                     GitHub Actions, every hour (Python worker, worker.yml) ──┘
```

| Piece | Host | Config in this repo |
|---|---|---|
| Database | Neon | none (the API creates the tables on startup) |
| API | Render | [`render.yaml`](../render.yaml) |
| Website | Vercel | [`web/vercel.json`](../web/vercel.json), env var `VITE_API_URL` |
| Worker | GitHub Actions | [`.github/workflows/worker.yml`](../.github/workflows/worker.yml) |
| Tests | GitHub Actions | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |

## 1. Neon (database)

1. Create a project (Postgres 16, region close to Render's, e.g. US East).
2. Copy the **connection string**. It looks like
   `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`.
   This is a password: never commit it.

## 2. Render (API)

1. **New → Blueprint**, connect GitHub, pick this repo. Render reads `render.yaml`.
2. Paste the Neon connection string when it asks for `DATABASE_URL`.
3. When it's live, open `https://<service>.onrender.com/health`. You should see `{"status":"ok"}`.

## 3. GitHub Actions (worker)

1. Repo **Settings → Secrets and variables → Actions → New repository secret**:
   `DATABASE_URL` = the Neon connection string.
2. **Actions → Worker → Run workflow.** The first run fills 30 days of mock history.
   After that it runs hourly by itself.

## 4. Vercel (website)

1. **Add New → Project**, import this repo.
2. **Root Directory:** `web`. Vercel detects Vite.
3. **Environment variable:** `VITE_API_URL` = `https://<service>.onrender.com` (no trailing slash).
4. Deploy, then open the `*.vercel.app` URL.

From then on, every push to `main` redeploys automatically: Vercel rebuilds the site,
and Render rebuilds the API once CI passes.

## Free-tier limits (good interview talking points)

- **Render sleeps** after ~15 minutes idle; the first visit then waits ~30–60 s while it wakes up.
- **Neon** also scales to zero when idle and wakes in about a second.
- **GitHub disables scheduled workflows** after 60 days with no commits. Push something or re-enable it under Actions.
- **Why CORS?** On Vercel the site and the API are on different domains, so the API sends
  `Access-Control-Allow-Origin` (see `api/src/app.ts`). In Docker/Kubernetes, nginx puts both
  under one domain instead, so CORS isn't needed there.
- **Kubernetes** isn't used in this deployment (free managed Kubernetes doesn't really exist).
  The manifests in `k8s/` run on a local cluster, e.g. Docker Desktop's built-in Kubernetes.
