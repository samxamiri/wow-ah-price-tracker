# Study log

A running record of what I studied, what clicked, and what's still confusing.
Newest session at the top.

**Template**

```
## YYYY-MM-DD: <topic>
**Studied:** files / concepts
**Clicked:** what I now understand
**Still confusing:** questions to come back to
**Built/changed:** features or fixes (link commits)
**Next:** what to study or build next session
```

---

## 2026-10-19: Going live for free

**Studied:** how the three parts get hosted when they're split across services: static files (Vercel) vs. an always-running server (Render) vs. a database (Neon). Also why the AWS plan was dropped (it costs money).

**Clicked:**
- A React build is just files, so any static host can serve it. The API is a running program, so it needs a real server.
- **CORS:** when the site and the API are on different domains, the browser blocks the response unless the API sends `Access-Control-Allow-Origin`.
- `VITE_*` env vars get baked into the JavaScript at **build** time, not read at runtime.
- Secrets (the Neon connection string) live in GitHub/Render settings, never in the code.

**Built/changed:** `render.yaml`, `web/vercel.json`, `.github/workflows/worker.yml`, CORS in `api/src/app.ts`, `docs/DEPLOY_FREE.md`. Pushed to GitHub; first CI run passed (including all 3 Docker builds).

**Live:** https://wow-ah-price-tracker.vercel.app · API https://wow-ah-api.onrender.com/health

**Next:** read `docs/DEPLOY_FREE.md` and the commit "Add free deployment". Then Docker Desktop, to run `docker compose` and the `k8s/` manifests locally.

---

## 2026-10-19: Project kickoff

**Studied:** picked the project. An Auction House price tracker uses every technology on my resume list in a way that makes sense (see README "Tech stack").

**Built/changed:** the whole first version, committed in layers so the Git history is a study path:
1. Database schema + Python worker
2. Node.js REST API
3. React frontend
4. Docker
5. CI (GitHub Actions)
6. Kubernetes
7. CD to AWS
8. Docs + Agile process

Run `git log --oneline` to see them, and `git show <commit>` to study one layer at a time.

**Verified:** all unit tests pass; ran the API, worker and frontend end to end against a real PostgreSQL.
**Not verified yet:** Docker, Kubernetes and AWS (Docker isn't installed yet).

**Next:**
- [ ] Install Docker Desktop and run `docker compose up --build`
- [ ] Create a GitHub repo, push, and watch CI run
- [ ] Study step 1 of the README study guide: `api/sql/schema.sql`
