#!/bin/sh
set -eu

echo "Waiting for database..."
until python -c "from sqlalchemy import create_engine; create_engine('${DATABASE_URL}').connect()" 2>/dev/null; do
  sleep 2
done

echo "Running migrations..."
alembic upgrade head

if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "Seeding test fixtures..."
  python -m scripts.seed
fi

echo "Starting API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000