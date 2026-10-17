#!/usr/bin/env bash
# Live acceptance: with the stack up (`make up`), every endpoint must answer 200.
# Retries per endpoint so a slow start doesn't fail the run; any miss exits 1.
set -uo pipefail

endpoints=(
  "Backstage|http://localhost:${BACKSTAGE_PORT:-7007}/.backstage/health/v1/liveness"
  "Coder|http://localhost:${CODER_PORT:-7080}/healthz"
  "Score API|http://localhost:${SCORE_API_PORT:-8081}/health"
  "Score webhooks|http://localhost:${SCORE_WEBHOOK_PORT:-8082}/health"
  "Plugin Manager|http://localhost:${PLUGIN_MANAGER_PORT:-8083}/health"
  "Gateway|http://localhost:${GATEWAY_PORT:-8000}/health"
)

failed=0
for entry in "${endpoints[@]}"; do
  name=${entry%%|*}
  url=${entry#*|}
  if curl -fsS --retry 12 --retry-delay 5 --retry-connrefused --max-time 10 -o /dev/null "$url"; then
    echo "PASS $name ($url)"
  else
    echo "FAIL $name ($url)"
    failed=1
  fi
done

unhealthy=$(docker compose ps --format '{{.Name}} {{.Health}}' | grep -v ' healthy$' || true)
if [ -n "$unhealthy" ]; then
  echo "FAIL containers not healthy:"
  echo "$unhealthy"
  failed=1
fi

exit "$failed"
