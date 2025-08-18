# Task System Migration Guide

## Overview

This guide explains how to migrate from the existing Celery-based task system to a flexible, scalable task system that starts with FastAPI BackgroundTasks and can easily scale to Celery when needed.

## Architecture

### Design Principles

1. **Abstraction Layer**: All task execution goes through a unified `TaskManager` interface
2. **Pluggable Executors**: Different backends (BackgroundTasks, Celery) implement the same interface
3. **Smooth Migration**: Existing Celery tasks can be enabled without changing application code
4. **Lightweight Start**: Begin with FastAPI BackgroundTasks for simple deployments
5. **Easy Scaling**: Add Celery when high load requires it

### Components

```
TaskManager (Interface)
├── BackgroundTasksExecutor (Lightweight, single-container)
├── CeleryExecutor (Heavy-duty, distributed)
└── HybridExecutor (Routes tasks based on configuration)
```

## Migration Steps

### 1. Current State (Celery)
```python
from app.workers.tasks import process_speak_audio

# In WebSocket handler
task = process_speak_audio.delay(resource_id, audio_chunks, user_name)
```

### 2. New System (BackgroundTasks)
```python
from app.core.tasks import get_task_manager
from fastapi import BackgroundTasks

# In API endpoint
task_manager = get_task_manager()
task_id = await task_manager.submit(
    "process_speak_audio",
    resource_id,
    audio_chunks,
    user_name,
    background_tasks=background_tasks
)
```

### 3. Future Scaling (Hybrid)
```python
# Same code, but configuration determines executor
# Heavy tasks automatically route to Celery if available
task_id = await task_manager.submit(
    "process_speak_audio",  # This will use Celery if configured
    resource_id,
    audio_chunks,
    user_name
)
```

## Task Configuration

### Lightweight Tasks (BackgroundTasks)
- Quick text processing
- Rating calculations
- Notification sending
- Session cleanup

### Heavy Tasks (Celery when available)
- Audio processing with STT/TTS
- Bulk operations
- Long-running data synchronization
- Complex NLP evaluations

## Usage Examples

### In API Endpoints
```python
from fastapi import APIRouter, BackgroundTasks
from app.core.tasks import get_task_manager

router = APIRouter()

@router.post("/process")
async def process_data(
    data: dict,
    background_tasks: BackgroundTasks
):
    task_manager = get_task_manager()
    
    # Submit lightweight task
    task_id = await task_manager.submit(
        "calculate_rating",
        data["resource_id"],
        background_tasks=background_tasks
    )
    
    return {"task_id": task_id}
```

### In WebSocket Handlers
```python
from fastapi import BackgroundTasks
from app.core.tasks import get_task_manager

async def handle_audio_processing(resource_id: str, audio_data: list):
    task_manager = get_task_manager()
    background_tasks = BackgroundTasks()
    
    task_id = await task_manager.submit(
        "process_speak_audio",
        resource_id,
        audio_data,
        background_tasks=background_tasks
    )
    
    return task_id
```

## Task Monitoring

### Check Task Status
```python
result = await task_manager.get_result(task_id)
if result:
    print(f"Status: {result.status}")
    print(f"Result: {result.result}")
    if result.error:
        print(f"Error: {result.error}")
```

### Cancel Task
```python
cancelled = await task_manager.cancel(task_id)
```

## Configuration

### Environment Variables
```bash
# Redis for task result storage (optional but recommended)
REDIS_URL=redis://localhost:6379

# Celery configuration (optional, for scaling)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### Task Routing Configuration
```python
# Define which tasks should use Celery when available
HEAVY_TASKS = {
    'process_speak_audio',
    'calculate_all_ratings',
    'sync_impressions_from_redis'
}
```

## Deployment Strategies

### Single Container (Current Target)
```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - postgres
  
  redis:
    image: redis:alpine
  
  postgres:
    image: postgres:13
```

### Scaled Deployment (Future)
```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
    
  worker:
    build: ./backend
    command: celery -A app.workers.celery_app worker
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
    
  scheduler:
    build: ./backend
    command: celery -A app.workers.celery_app beat
```

## Benefits

### Immediate Benefits
1. **Simplified Deployment**: No need for Celery workers in development
2. **Reduced Dependencies**: Fewer moving parts for simple use cases
3. **Faster Development**: Quicker iteration without worker management
4. **Resource Efficiency**: Lower memory and CPU usage for light tasks

### Future Benefits
1. **Easy Scaling**: Add Celery workers without changing application code
2. **Task Distribution**: Spread load across multiple workers
3. **Better Reliability**: Celery's retry mechanisms and monitoring
4. **Advanced Features**: Task routing, rate limiting, task prioritization

## Migration Checklist

- [x] Create TaskManager abstraction layer
- [x] Implement BackgroundTasksExecutor
- [x] Implement CeleryExecutor (compatible with existing workers)
- [x] Create HybridExecutor for intelligent routing
- [x] Update WebSocket handlers to use new system
- [x] Update rating service to use new system
- [x] Create task status monitoring endpoints
- [ ] Update main.py to include task status routes
- [ ] Test with BackgroundTasks only
- [ ] Test with Celery fallback
- [ ] Update deployment documentation

## Error Handling

### BackgroundTasks Limitations
- No built-in retry mechanism
- Limited error visibility
- No task cancellation once started
- No task prioritization

### Celery Advantages
- Automatic retries with exponential backoff
- Comprehensive error tracking
- Task cancellation and monitoring
- Advanced routing and prioritization

## Monitoring and Debugging

### Task Status API
```bash
# Check task status
GET /api/tasks/{task_id}/status

# Cancel task
POST /api/tasks/{task_id}/cancel

# Trigger maintenance tasks
POST /api/tasks/rating/recalculate
POST /api/tasks/impressions/sync
POST /api/tasks/cleanup/sessions
```

### Logging
Tasks log their progress and errors:
```python
# Task execution logs
print(f"Processing resource {resource_id}")
print(f"Successfully processed resource {resource_id}")
print(f"Error processing resource: {error}")
```

## Best Practices

1. **Keep Tasks Idempotent**: Tasks should be safe to run multiple times
2. **Handle Failures Gracefully**: Always update resource status on failure
3. **Use Appropriate Executor**: Route heavy tasks to Celery when available
4. **Monitor Task Status**: Provide users with progress feedback
5. **Clean Up Resources**: Always close database connections in finally blocks

## Testing

### Unit Tests
```python
import pytest
from app.core.tasks import get_task_manager

@pytest.mark.asyncio
async def test_task_submission():
    task_manager = get_task_manager()
    task_id = await task_manager.submit("calculate_rating", "test-id")
    assert task_id is not None
    
    result = await task_manager.get_result(task_id)
    # Test based on expected behavior
```

### Integration Tests
```python
# Test with actual BackgroundTasks
from fastapi import BackgroundTasks

@pytest.mark.asyncio
async def test_background_task_execution():
    background_tasks = BackgroundTasks()
    task_manager = get_task_manager()
    
    task_id = await task_manager.submit(
        "calculate_rating",
        "test-resource-id",
        background_tasks=background_tasks
    )
    
    # Verify task was queued
    assert task_id is not None
```