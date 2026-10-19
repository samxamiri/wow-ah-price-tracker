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
