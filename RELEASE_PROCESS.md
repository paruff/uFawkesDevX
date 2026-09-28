# Release Process — uFawkesDevX

**Status:** Active | **Owner:** Platform Team | **Review Cadence:** Per release

---

## Release Cadence

| Type | Frequency | Trigger | Automation |
|---|---|---|---|
| **Patch** (v0.2.x) | Weekly (or on-demand) | Bug fixes, docs updates | `release-please` (target: H3) |
| **Minor** (v0.x.0) | Monthly | New features, milestones | Manual trigger |
| **Major** (vx.0.0) | Per horizon | Breaking changes, new architecture | Manual trigger + ADR |

**Current Stage:** Pre-alpha — releases are informal; formal automation targets H3 (M3.3).

---

## Release Checklist (Manual — Pre-H3)

Execute these steps in order. Do not skip any step.

### Pre-Release

- [ ] **All CI stages pass on `main`:** `preflight → lint → security → build → test`
- [ ] **No secrets in Git history:** `gitleaks detect --source . --log-level=debug` exits 0
- [ ] **No `:latest` tags:** `grep -r ":latest" compose.yaml` returns nothing
- [ ] **CHANGELOG.md updated:** Entry for this version exists (manual for now)
- [ ] **README.md current:** All documented commands, ports, and diagrams reflect reality
- [ ] **docs/KNOWN_LIMITATIONS.md current:** Any new limitations added
- [ ] **docs/CHANGE_IMPACT_MAP.md current:** Any new co-changes documented
- [ ] **PR title follows Conventional Commits:** `type(scope): description`

### Tag & Release

- [ ] **Determine version:** `git log --oneline v<previous>..HEAD` to review scope
- [ ] **Update version in:** `compose.yaml` (comment header), `release-please-config.json`
- [ ] **Create tag:** `git tag -a v<semver> -m "Release v<semver>: <summary>"`
- [ ] **Push tag:** `git push origin v<semver>`
- [ ] **Create GitHub Release:** `gh release create v<semver> --generate-notes`

### Post-Release

- [ ] **Verify `make up` works from clean state:** `docker compose down -v && make up`
- [ ] **Verify health checks pass:** `make health`
- [ ] **Verify uFawkesObs integration (if wired):** Grafana shows service metrics
- [ ] **Notify team:** Slack/Discord message with release notes link
- [ ] **Update ufawkes.dev** (if applicable): Release notes published

---

## Versioning Scheme (SemVer)

| Component | Meaning | Example |
|---|---|---|
| **MAJOR** (vX.0.0) | Breaking architecture change; requires migration | `v1.0.0` — Kubernetes track graduation |
| **MINOR** (v0.X.0) | New feature or milestone; backward-compatible | `v0.3.0` — Plugin Manager install feature |
| **PATCH** (v0.2.x) | Bug fix, docs update, config tweak; no behavior change | `v0.2.1` — fix gitleaks false positive |

**Pre-Alpha Convention:** `v0.2.x` — the `.0` (v0.2.0) was the Compose stack v0.2 milestone.

---

## Rollback Process

If a release introduces a regression:

1. **Identify the breaking commit:** `git log --oneline` since last known-good tag
2. **Revert the commit:** `git revert <commit-hash>` on `main`
3. **Tag hotfix:** `git tag -a v<semver+1> -m "Hotfix: revert <brief description>"`
4. **Verify:** `docker compose down -v && make up && make health`
5. **Document:** Add entry to `docs/KNOWN_LIMITATIONS.md` with root cause

**Emergency bypass ( documented only ):** If CI is broken and a critical fix must ship, `git tag` can be pushed with a skip-ci flag. This requires two-person approval and must be documented in the PR with a retroactive CI fix.

---

## How This Connects

| Document | What It Answers |
|---|---|
| [VISION.md](VISION.md) | North star that releases serve |
| [MILESTONES.md](MILESTONES.md) | Milestones that define "what ships" |
| [AI_STANCE.md](AI_STANCE.md) | AI code that must pass release gates |
| [SECURITY.md](SECURITY.md) | Security gates in the release pipeline |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical context for release validation |
