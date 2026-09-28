# Model Policy — uFawkesDevX

> Grade-based model routing for uFawkesDevX. Referenced from `AGENTS.md §3` and `AI_STANCE.md`.
>
> **Design principle:** Task routing uses stable *grade definitions* (which rarely change). The *current model mapping* updates frequently as models improve. Model names are intentionally NOT hardcoded — configure per environment in `opencode.json`.

---

## Grade Definitions

Grades are defined by minimum benchmark requirements, not specific model names. Any model meeting the thresholds qualifies for that grade.

| Grade | Name | Min SWE-bench Verified | Min Context Window | When to Use |
|-------|------|------------------------|-------------------|-------------|
| **S** | Critical | ≥90% | ≥128k | High-stakes, complex reasoning: compose.yaml service structure, Score spec schema, CI pipeline structure, contracts (CONTRACTS.md) |
| **A** | Production | ≥70% | ≥64k | Standard development: Score API endpoints, Plugin Manager features, Gateway nginx config, Backstage catalog |
| **B** | Routine | ≥50% | ≥32k | Simple tasks: YAML edits, Backstage catalog entries, markdown, documentation |
| **C** | Lightweight | Any | Any | Trivial edits: label changes, typo fixes, whitespace, version bumps |
| **F** | Fallback | Free tier only | Any | Emergency: when all other providers are unavailable |

### Benchmark References

| Benchmark | What It Tests | Source | Update Frequency |
|-----------|---------------|--------|------------------|
| [SWE-bench Verified](https://www.swebench.com/) | Real GitHub bugs (500 problems) | vals.ai leaderboard | Monthly |
| [SWE-bench Pro](https://www.swebench.com/) | Harder enterprise bugs (1,865 problems) | Scale AI | Quarterly |
| [HumanEval](https://github.com/openai/human-eval) | Code generation (164 problems) | OpenAI | Static |
| [LiveCodeBench](https://livecodebench.github.io/) | Dynamic coding (contamination-resistant) | Academic | Monthly |

---

## Current Model Mapping

> **⚠️ Configure per environment.** Grade definitions above are stable; only this mapping updates. Model names live in `opencode.json`, not here.

| Grade | Primary Model | Provider | Fallbacks | Notes |
|-------|---------------|----------|-----------|-------|
| **S** | (configure per environment) | — | — | Use for critical paths: contracts, compose structure, CI stages |
| **A** | (configure per environment) | — | — | Standard development: Score, Plugin Manager, Gateway, Backstage |
| **B** | (configure per environment) | — | — | Routine tasks: docs, examples, simple YAML |
| **C** | (configure per environment) | — | — | Trivial edits only |
| **F** | (same as C) | — | — | Emergency fallback |

### Fallback Chain

```
Grade S → Grade A → Grade B → Grade F
```

Triggers: `rate_limit`, `timeout`, `server_error`

---

## Task → Grade Routing

> **Stable — rarely changes.**

| Task Type | Grade | Reason |
|-----------|-------|--------|
| **compose.yaml service structure change** | S | Cross-plane impact via CHANGE_IMPACT_MAP.md; multi-service coordination |
| **CI pipeline (.github/workflows) stage changes** | S | Pipeline gate changes affect every build; DORA logging critical |
| **CONTRACTS.md contract changes** | S | Breaking changes affect uFawkesRes/Obs/Pipe; requires coordination |
| **Score spec schema (**`scores.dev/v1beta1`**) changes** | S | Semantic validation logic; breaking changes block deploys |
| **Score Service CRUD API (FR-3.x)** | A | REST endpoint + PG persistence, known patterns |
| **Plugin Manager install/list/uninstall (FR-5.x)** | A | File-system registry + Backstage hot-reload integration |
| **Gateway nginx.conf routing (FR-6.x)** | A | Multi-service proxy config, needs accuracy |
| **Backstage catalog entity (catalog-info.yaml)** | B | Single YAML, must match Backstage schema |
| **Devcontainer toolchain version bump** | B | Single version string, but needs breaking change notes |
| **Documentation (Markdown, runbooks)** | B | Text generation, cross-repo links |
| **Single YAML edit (version bump, label, port)** | C | Trivial, any model works |
| **Typo fixes** | C | Trivial |

---

## Required Issue Body Format

Every issue assigned to the coding agent **must** include this block:

```
**Grade:** [S / A / B / C]
**Task type:** [compose / pipeline / contract / score-api / plugin-manager / gateway / catalog / docs / version-bump]
**Files to edit:** [explicit list — agent must not create new files unless listed here]
**Reference file:** [path to existing config to use as pattern]
**Do not touch:** [files or services outside the scope of this issue]
**Breaking changes to check:** [version-specific migration notes if applicable]
**Acceptance criteria:**
- [ ] [measurable criterion 1]
- [ ] [measurable criterion 2]
```

---

## Escalation Rule

If rework rate for a task type exceeds **20% after 5 completed PRs** with the recommended grade:

1. **First** — improve the issue body: add file targets, reference configs, breaking change notes
2. **If still above 20%** — escalate to the next grade tier
3. **Document** the decision in this section with date and evidence

---

## Grade Update Process

When a model updates or a new model appears:

1. **Check benchmarks:** Verify the model meets grade thresholds at [swebench.com](https://www.swebench.com/) or [vals.ai](https://vals.ai/benchmarks/swebench)
2. **Update mapping:** Change ONLY `opencode.json` — this file stays name-free
3. **Test:** Run 3 issues through the new model at the intended grade
4. **Validate:** Check PR revision count (target: ≤1 revision per PR)
5. **Document:** Add entry to escalation log below if grade changed

### Escalation Log

| Date | Task Type | Old Grade | New Grade | Reason | Evidence |
|------|-----------|-----------|-----------|--------|----------|
| 2026-09-14 | All | — | Grade-based | Initial policy (pre-alpha; no hardcoded models) | — |

---

## Model Policy Enforcement

- `opencode.json` configures the fallback chain and default model
- Agent YAML files specify grades for operational agents (test, review, etc.)
- See `AI_STANCE.md` for hard rules AI agents must not delegate

---

## See Also

- `AGENTS.md` §3 — Context Files (references this file)
- `AGENTS.md` §4 — Architecture Rules (compose/CI changes require Grade S)
- `AI_STANCE.md` — AI tooling policy, agent guardrails, hard vs. soft rules
- `docs/CONTRACTS.md` — Contract changes require Grade S
- `docs/CHANGE_IMPACT_MAP.md` — Cross-plane impact of compose/contract/pipeline changes
