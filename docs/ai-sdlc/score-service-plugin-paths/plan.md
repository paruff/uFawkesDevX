# Plan: keep score-service plugin loading inside the plugins directory

**Traces to:** uFawkesDevX#82 (SQLite-backed score-service, no external database)
| **Status:** In progress

`loadPlugins()` guarded against escapes with a string-prefix check on
`path.resolve()`. That check does not follow symlinks, so a symlink inside
`PLUGINS_DIR` pointing outside it was `require`d. It also treats a sibling such
as `/plugins-evil` as inside `/plugins`.

| Step | What                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------ |
| S1   | Add `isPathWithinDir()`: compare `fs.realpath()` of target and base with `path.relative()`                   |
| S2   | Use it in `loadPlugins()` in place of the `startsWith` check                                                 |
| S3   | Regression test: a symlinked plugin that resolves outside `PLUGINS_DIR` is skipped, a regular one still loads |
| S4   | Record `engines.node >=22.5.0` in the lockfile (`node:sqlite`), matching `package.json`                      |

## Verification Strategy

| Check                                  | How                                                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| The escape is closed                   | `npm test` in `score-service/`: the symlink test fails on `main`'s `server.js` and passes with this change      |
| Normal plugins still load              | Same test asserts the in-directory plugin is registered                                                         |
| The SQLite store is unaffected         | The existing `SQLite store` test in `server.test.js` still passes                                               |
| Commits and plan satisfy the CI gates  | Pre-flight (conventional-commit hook) and Artifact Chain pass on the PR                                         |
