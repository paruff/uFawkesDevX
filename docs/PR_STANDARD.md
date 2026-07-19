# PR Standards

## Branch Naming

```
feat/<slug>     # New feature
fix/<slug>      # Bug fix
chore/<slug>    # Maintenance, deps, tooling
docs/<slug>     # Documentation only
```

Slug is kebab-case, descriptive but concise.

## Commit Messages

Conventional Commits format:

```
type(scope): description
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`, `build`, `revert`.

Scope is optional but recommended (e.g. `ci`, `backstage`, `score`, `compose`).

Description is lowercase, imperative mood, max 72 chars.

## PR Titles

Same Conventional Commits format as commits. The PR title becomes the squash-merge commit message.

## CI Requirements

Before merge:
- [ ] All CI pipeline stages pass: preflight → lint → security → build → tests
- [ ] Main CI guard reports green
- [ ] No `:latest` tags in compose files
- [ ] No secrets detected (gitleaks clean)
- [ ] Branch is up to date with `main`

## Review

- At least one human review required for non-trivial changes.
- AI-assisted PRs must pass the AI-Assisted Review Block (see AGENTS.md §7).
