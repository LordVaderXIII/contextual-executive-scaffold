#!/bin/sh
# Smoke test for CES MVP (fake data, disposable DB, backend + frontend).
set -eu

API_URL="${API_URL:-http://localhost:8000}"
WEB_URL="${WEB_URL:-http://localhost:${CES_WEB_PORT:-8081}}"

echo "==> Waiting for API health endpoint"
attempt=0
until health_json="$(curl -fsS "${API_URL}/health" 2>/dev/null)"; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "FAIL: API did not become ready at ${API_URL}/health after 30 attempts"
    exit 1
  fi
  sleep 2
done

echo "==> Health check: ${API_URL}/health"
echo "${health_json}"
echo "${health_json}" | grep -q '"status":"ok"' || {
  echo "FAIL: health response missing status ok"
  exit 1
}
echo "${health_json}" | grep -q '"database":true' || {
  echo "FAIL: database not healthy"
  exit 1
}

echo "==> Contexts: ${API_URL}/api/v1/contexts"
contexts_json="$(curl -fsS "${API_URL}/api/v1/contexts")"
echo "${contexts_json}"
echo "${contexts_json}" | grep -q 'home-evening' || {
  echo "FAIL: expected seeded context slug home-evening"
  exit 1
}

echo "==> Current context: ${API_URL}/api/v1/contexts/current"
current_json="$(curl -fsS "${API_URL}/api/v1/contexts/current")"
echo "${current_json}"
echo "${current_json}" | grep -q '"context"' || {
  echo "FAIL: current context missing context field"
  exit 1
}

echo "==> Tasks: ${API_URL}/api/v1/tasks"
tasks_json="$(curl -fsS "${API_URL}/api/v1/tasks")"
echo "${tasks_json}"
echo "${tasks_json}" | grep -q 'dishwasher' || {
  echo "FAIL: expected seeded task description"
  exit 1
}

echo "==> Timeline: ${API_URL}/api/v1/timeline"
timeline_json="$(curl -fsS "${API_URL}/api/v1/timeline")"
echo "${timeline_json}" | grep -q '"tasks"' || {
  echo "FAIL: timeline missing tasks"
  exit 1
}

echo "==> HA zones (degraded/mock): ${API_URL}/api/v1/ha/zones"
zones_json="$(curl -fsS "${API_URL}/api/v1/ha/zones")"
echo "${zones_json}"
echo "${zones_json}" | grep -q '"source"' || {
  echo "FAIL: ha zones missing source"
  exit 1
}

echo "==> Nudge evaluate: ${API_URL}/api/v1/nudges/evaluate"
nudge_json="$(curl -fsS -X POST "${API_URL}/api/v1/nudges/evaluate")"
echo "${nudge_json}"
echo "${nudge_json}" | grep -q '"evaluated":true' || {
  echo "FAIL: nudge evaluate did not run"
  exit 1
}

echo "==> AI decompose (mock): ${API_URL}/api/v1/ai/decompose"
ai_json="$(curl -fsS -X POST "${API_URL}/api/v1/ai/decompose" \
  -H 'Content-Type: application/json' \
  -d '{"description":"Test smoke task for decomposition"}')"
echo "${ai_json}" | grep -q 'micro_steps' || {
  echo "FAIL: AI decompose missing micro_steps"
  exit 1
}

echo "==> Weekly review: ${API_URL}/api/v1/review/weekly"
review_json="$(curl -fsS "${API_URL}/api/v1/review/weekly")"
echo "${review_json}" | grep -q 'nudges_fired' || {
  echo "FAIL: weekly review missing nudges_fired"
  exit 1
}

echo "==> Focus sessions: end seeded active session if present"
active_json="$(curl -fsS "${API_URL}/api/v1/focus-sessions?active_only=true")"
echo "${active_json}"
active_id="$(echo "${active_json}" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)"
if [ -n "${active_id}" ]; then
  ended_seed="$(curl -fsS -X PATCH "${API_URL}/api/v1/focus-sessions/${active_id}" \
    -H 'Content-Type: application/json' \
    -d '{}')"
  echo "${ended_seed}"
  echo "${ended_seed}" | grep -q '"active":false' || {
    echo "FAIL: could not end seeded active focus session"
    exit 1
  }
fi

echo "==> Focus session: start normal (25 min planned)"
focus_start="$(curl -fsS -X POST "${API_URL}/api/v1/focus-sessions" \
  -H 'Content-Type: application/json' \
  -d '{"session_type":"normal","planned_minutes":25}')"
echo "${focus_start}"
echo "${focus_start}" | grep -q '"active":true' || {
  echo "FAIL: focus start did not return active session"
  exit 1
}
echo "${focus_start}" | grep -q '"planned_minutes":25' || {
  echo "FAIL: focus start missing planned_minutes"
  exit 1
}
focus_id="$(echo "${focus_start}" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)"
[ -n "${focus_id}" ] || {
  echo "FAIL: focus start missing session id"
  exit 1
}

echo "==> Focus session: end ${focus_id}"
focus_end="$(curl -fsS -X PATCH "${API_URL}/api/v1/focus-sessions/${focus_id}" \
  -H 'Content-Type: application/json' \
  -d '{}')"
echo "${focus_end}"
echo "${focus_end}" | grep -q '"active":false' || {
  echo "FAIL: focus end did not mark session inactive"
  exit 1
}

echo "==> Focus session: start hyperfocus with end condition"
focus_hf="$(curl -fsS -X POST "${API_URL}/api/v1/focus-sessions" \
  -H 'Content-Type: application/json' \
  -d '{"session_type":"hyperfocus","planned_minutes":15,"end_condition":"Stop when smoke test passes"}')"
echo "${focus_hf}"
echo "${focus_hf}" | grep -q '"session_type":"hyperfocus"' || {
  echo "FAIL: hyperfocus session missing session_type"
  exit 1
}
echo "${focus_hf}" | grep -q 'Stop when smoke test passes' || {
  echo "FAIL: hyperfocus session missing end_condition"
  exit 1
}
hf_id="$(echo "${focus_hf}" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)"
focus_hf_end="$(curl -fsS -X PATCH "${API_URL}/api/v1/focus-sessions/${hf_id}" \
  -H 'Content-Type: application/json' \
  -d '{}')"
echo "${focus_hf_end}" | grep -q '"active":false' || {
  echo "FAIL: hyperfocus session end failed"
  exit 1
}

echo "==> Waiting for frontend at ${WEB_URL}/"
attempt=0
until curl -fsS "${WEB_URL}/" >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "FAIL: frontend did not become ready at ${WEB_URL}/ after 30 attempts"
    exit 1
  fi
  sleep 2
done

echo "==> Frontend: ${WEB_URL}/"
web_body="$(curl -fsS "${WEB_URL}/")"
echo "${web_body}" | grep -qi 'ces\|svelte\|html' || {
  echo "FAIL: frontend root did not return HTML"
  exit 1
}

for route in / /tasks /timeline /focus /more /nudges /review /settings; do
  echo "==> Frontend route: ${WEB_URL}${route}"
  page_body=""
  page_body="$(curl -fsS "${WEB_URL}${route}")" || {
    echo "FAIL: frontend route ${route} did not return HTTP 200"
    exit 1
  }
  if ! echo "${page_body}" | grep -qi '<html\|<main\|id="svelte'; then
    echo "FAIL: frontend route ${route} did not return app HTML"
    exit 1
  fi
done

echo "==> Frontend API proxy: ${WEB_URL}/api/v1/contexts"
proxy_json="$(curl -fsS "${WEB_URL}/api/v1/contexts")"
echo "${proxy_json}" | grep -q 'home-evening' || {
  echo "FAIL: frontend proxy to API failed"
  exit 1
}

echo "PASS: smoke checks completed"