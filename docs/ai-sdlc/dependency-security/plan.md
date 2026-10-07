# Plan: clear dependency advisories with lockfile-only bumps

**Traces to:** uFawkes.dev [shift-left spec](https://github.com/paruff/uFawkes.dev/blob/main/docs/ai-sdlc/shift-left/spec.md)
R8 (a scanner's findings must be readable) and the Suite hygiene goal
(uFawkes.dev#155) | **Status:** In progress

CI's Security Scanning runs Trivy over the whole tree (`severity-threshold:
MEDIUM`, `fail-on-critical`). A new advisory in a lockfile therefore fails every
PR run after it appears, whatever the PR changes. Dependabot catches some and
not others (it raised no alert for CVE-2026-90711), so the scan is what notices.

When it does, the fix is a lockfile-only bump, as in #78 (fast-uri) and #97
(brace-expansion): update the one package within the range its parent allows,
so `package.json` doesn't change.

| Step | What                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------- |
| S1   | `proxy-addr` 2.0.7 to 2.0.8 in `score-service/package-lock.json` (CVE-2026-90711, CRITICAL), uFawkesDevX#103  |
| S2   | Make a failing scan name its findings in the log (uFawkesDevX#102), so the next one needs no local re-run     |

## Verification Strategy

| Check                                                  | How                                                                                                             |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| The advisory is gone                                   | `trivy fs --scanners vuln --severity MEDIUM,HIGH,CRITICAL .`: exit 1 before, exit 0 and 0 vulnerabilities after |
| The bump is within range and changes only the lockfile | `git diff --stat` shows `score-service/package-lock.json` only; the parent's range (`express` allows `^2.0.7`) includes the new version |
| The service still works                                | `npm ci && npm test` in `score-service/`: no failures                                                           |
| CI agrees                                              | Security Scanning and Pipeline Complete pass on the PR                                                          |
