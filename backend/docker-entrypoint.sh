#!/bin/bash
set -e

# Docker entrypoint script for Learn English Backend
# Supports multiple modes: api, worker, beat, migration

# Ensure Python can find our modules
export PYTHONPATH="/app:${PYTHONPATH:-}"

echo "🚀 Learn English Backend Entrypoint"
echo "Mode: $1"
echo "Task Executor: ${TASK_EXECUTOR:-background}"
echo "Celery Enabled: ${ENABLE_CELERY:-false}"

# Wait for database
wait_for_db() {
    echo "⏳ Waiting for database connection..."
    while ! pg_isready -h postgres -p 5432 -U postgres; do
        echo "Database not ready, waiting 2 seconds..."
        sleep 2
    done
    echo "✅ Database is ready!"
}

# Run database migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    if alembic upgrade head; then
        echo "✅ Migrations completed successfully"
    else
        echo "⚠️ Migrations failed, continuing anyway..."
    fi
}

# Seed initial data
seed_data() {
    echo "🌱 Seeding initial data..."
    if python -m app.utils.seed_data; then
        echo "✅ Seed data completed successfully"
    else
        echo "⚠️ Seed data failed, continuing anyway..."
    fi
}

# Main application modes
case "$1" in
    "api")
        echo "🎯 Starting FastAPI API Server..."
        wait_for_db
        run_migrations
        seed_data
        
        if [ "${ENABLE_CELERY}" = "true" ]; then
            echo "🔧 Hybrid Task System: BackgroundTasks + Celery"
        else
            echo "⚡ Lightweight Task System: BackgroundTasks Only"
        fi
        
        exec uvicorn app.main:app \
            --host 0.0.0.0 \
            --port 8000 \
            --log-level info \
            --access-log \
            --loop uvloop \
            --http httptools
        ;;
        
    "api-dev")
        echo "🔧 Starting FastAPI API Server (Development Mode)..."
        wait_for_db
        run_migrations
        seed_data
        
        exec uvicorn app.main:app \
            --host 0.0.0.0 \
            --port 8000 \
            --reload \
            --log-level debug \
            --access-log
        ;;
        
    "worker")
        echo "👷 Starting Celery Worker..."
        wait_for_db
        sleep 15  # Wait for API server to start
        
        if [ "${ENABLE_CELERY}" != "true" ]; then
            echo "⚠️ ENABLE_CELERY is not set to true, but worker mode requested"
            echo "💡 Starting worker anyway - make sure Celery is properly configured"
        fi
        
        exec celery -A app.workers.celery_app worker \
            --loglevel=info \
            --concurrency="${CELERY_WORKER_CONCURRENCY:-4}" \
            --max-tasks-per-child="${CELERY_MAX_TASKS_PER_CHILD:-1000}" \
            --time-limit="${CELERY_TASK_TIME_LIMIT:-1800}" \
            --soft-time-limit="${CELERY_TASK_SOFT_TIME_LIMIT:-1500}" \
            --hostname="worker@%h" \
            --queues="${CELERY_QUEUES:-default,heavy}"
        ;;
        
    "beat")
        echo "⏰ Starting Celery Beat Scheduler..."
        wait_for_db
        sleep 20  # Wait for API server and workers to start
        
        exec celery -A app.workers.celery_app beat \
            --loglevel=info \
            --schedule=/app/beat-data/celerybeat-schedule.db \
            --pidfile=/app/beat-data/celerybeat.pid
        ;;
        
    "flower")
        echo "🌸 Starting Celery Flower Monitoring..."
        sleep 25  # Wait for workers to start
        
        exec celery -A app.workers.celery_app flower \
            --port=5555 \
            --broker="${CELERY_BROKER_URL}" \
            --basic_auth="${FLOWER_USER:-admin}:${FLOWER_PASSWORD:-admin123}"
        ;;
        
    "migration")
        echo "🔄 Running migrations only..."
        wait_for_db
        run_migrations
        echo "✅ Migration complete, exiting."
        ;;
        
    "seed")
        echo "🌱 Running seed data only..."
        wait_for_db
        seed_data
        echo "✅ Seed complete, exiting."
        ;;
        
    "shell")
        echo "🐚 Starting interactive shell..."
        wait_for_db
        exec python -i -c "
import asyncio
from app.core.config import settings
from app.db.session import get_db
from app.core.tasks import get_task_manager
from app.models.models import *

print('🔧 Learn English Backend Shell')
print('Available: settings, get_db(), get_task_manager()')
print('Models: UserDetails, TextResources, SpeakResources, etc.')
        "
        ;;
        
    "test")
        echo "🧪 Running tests..."
        wait_for_db
        exec python -m pytest "${@:2}"
        ;;
        
    *)
        echo "❌ Unknown mode: $1"
        echo "Available modes:"
        echo "  api      - Start FastAPI server (production)"
        echo "  api-dev  - Start FastAPI server (development)"
        echo "  worker   - Start Celery worker"
        echo "  beat     - Start Celery beat scheduler"
        echo "  flower   - Start Celery monitoring"
        echo "  migration- Run database migrations only"
        echo "  seed     - Run seed data only"
        echo "  shell    - Interactive Python shell"
        echo "  test     - Run tests"
        echo ""
        echo "Examples:"
        echo "  docker run backend api"
        echo "  docker run backend worker"
        echo "  docker run backend migration"
        exit 1
        ;;
esac