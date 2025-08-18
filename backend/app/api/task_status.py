# Task Status API - Monitor background tasks
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import Optional

from app.core.tasks import get_task_manager
from app.core.security import get_current_user

router = APIRouter()


@router.get("/api/tasks/{task_id}/status")
async def get_task_status(
    task_id: str,
    current_user=Depends(get_current_user)
):
    """Get the status of a background task"""
    try:
        task_manager = get_task_manager()
        result = await task_manager.get_result(task_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return {
            "task_id": task_id,
            "status": result.status,
            "result": result.result,
            "error": result.error,
            "started_at": result.started_at,
            "completed_at": result.completed_at,
            "retries": result.retries
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/tasks/{task_id}/cancel")
async def cancel_task(
    task_id: str,
    current_user=Depends(get_current_user)
):
    """Cancel a running task"""
    try:
        task_manager = get_task_manager()
        cancelled = await task_manager.cancel(task_id)
        
        return {
            "task_id": task_id,
            "cancelled": cancelled
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/tasks/rating/recalculate")
async def recalculate_all_ratings(
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user)
):
    """Trigger recalculation of all resource ratings"""
    try:
        task_manager = get_task_manager()
        task_id = await task_manager.submit(
            "calculate_all_ratings",
            background_tasks=background_tasks
        )
        
        return {
            "task_id": task_id,
            "message": "Rating recalculation started"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/tasks/impressions/sync")
async def sync_impressions(
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user)
):
    """Sync impression data from Redis to database"""
    try:
        task_manager = get_task_manager()
        task_id = await task_manager.submit(
            "sync_impressions_from_redis",
            background_tasks=background_tasks
        )
        
        return {
            "task_id": task_id,
            "message": "Impression sync started"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/tasks/cleanup/sessions")
async def cleanup_expired_sessions(
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user)
):
    """Clean up expired speaking sessions"""
    try:
        task_manager = get_task_manager()
        task_id = await task_manager.submit(
            "cleanup_expired_sessions",
            background_tasks=background_tasks
        )
        
        return {
            "task_id": task_id,
            "message": "Session cleanup started"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))