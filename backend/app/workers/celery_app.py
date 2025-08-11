from celery import Celery
from app.core.config import settings

# Create Celery app
celery_app = Celery(
    "learn_english_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"]
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    result_expires=3600,  # Results expire after 1 hour
    worker_prefetch_multiplier=1,  # Process one task at a time per worker
    task_acks_late=True,  # Acknowledge tasks after they're completed
    worker_disable_rate_limits=False,
    task_compression="gzip",
    result_compression="gzip",
)

# Task routing
celery_app.conf.task_routes = {
    "app.workers.tasks.process_speak_audio": {"queue": "audio_processing"},
    "app.workers.tasks.calculate_rating": {"queue": "rating_calculation"},
    "app.workers.tasks.sync_impressions": {"queue": "data_sync"},
    "app.workers.tasks.send_notification": {"queue": "notifications"},
}

# Periodic tasks
celery_app.conf.beat_schedule = {
    "calculate-ratings-daily": {
        "task": "app.workers.tasks.calculate_all_ratings",
        "schedule": 86400.0,  # Every 24 hours
    },
    "sync-impressions-minutely": {
        "task": "app.workers.tasks.sync_impressions_from_redis",
        "schedule": 60.0,  # Every minute
    },
    "cleanup-expired-sessions": {
        "task": "app.workers.tasks.cleanup_expired_sessions",
        "schedule": 3600.0,  # Every hour
    },
}