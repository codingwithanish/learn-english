# Task Executors - BackgroundTasks and Celery implementations
import asyncio
import json
import logging
from typing import Any, Dict, Optional, Callable
from datetime import datetime
from fastapi import BackgroundTasks
import redis
import uuid

from .task_manager import TaskExecutor, TaskResult, TaskStatus
from .config import settings

logger = logging.getLogger(__name__)


class BackgroundTasksExecutor(TaskExecutor):
    """FastAPI BackgroundTasks-based executor for lightweight tasks"""
    
    def __init__(self, task_manager_ref=None):
        self.task_manager_ref = task_manager_ref
        # Use Redis to store task results for status tracking
        self.redis_client = redis.from_url(settings.REDIS_URL) if settings.REDIS_URL else None
        self.results_ttl = 3600  # 1 hour TTL for task results
    
    async def submit_task(
        self,
        task_name: str,
        *args,
        task_id: Optional[str] = None,
        delay: Optional[int] = None,
        background_tasks: Optional[BackgroundTasks] = None,
        **kwargs
    ) -> str:
        """Submit task to BackgroundTasks"""
        if not background_tasks:
            raise ValueError("BackgroundTasks instance required for BackgroundTasksExecutor")
        
        task_id = task_id or str(uuid.uuid4())
        
        # Store initial task status
        await self._store_task_result(TaskResult(
            task_id=task_id,
            status=TaskStatus.PENDING,
            started_at=datetime.utcnow()
        ))
        
        if delay:
            # Schedule with delay using asyncio
            background_tasks.add_task(
                self._execute_with_delay,
                task_name, task_id, delay, *args, **kwargs
            )
        else:
            # Execute immediately
            background_tasks.add_task(
                self._execute_task,
                task_name, task_id, *args, **kwargs
            )
        
        return task_id
    
    async def _execute_with_delay(
        self,
        task_name: str,
        task_id: str,
        delay: int,
        *args,
        **kwargs
    ):
        """Execute task after delay"""
        await asyncio.sleep(delay)
        await self._execute_task(task_name, task_id, *args, **kwargs)
    
    async def _execute_task(
        self,
        task_name: str,
        task_id: str,
        *args,
        **kwargs
    ):
        """Execute the actual task"""
        try:
            # Update status to running
            await self._store_task_result(TaskResult(
                task_id=task_id,
                status=TaskStatus.RUNNING,
                started_at=datetime.utcnow()
            ))
            
            # Get task function from registry
            if not self.task_manager_ref:
                raise RuntimeError("Task manager reference not set")
            
            task_func = self.task_manager_ref().get_task_function(task_name)
            if not task_func:
                raise ValueError(f"Task function '{task_name}' not found")
            
            # Execute task function
            if asyncio.iscoroutinefunction(task_func):
                result = await task_func(*args, **kwargs)
            else:
                result = task_func(*args, **kwargs)
            
            # Store success result
            await self._store_task_result(TaskResult(
                task_id=task_id,
                status=TaskStatus.SUCCESS,
                result=result,
                started_at=datetime.utcnow(),  # This should be tracked from initial
                completed_at=datetime.utcnow()
            ))
            
        except Exception as e:
            logger.error(f"Task {task_name} ({task_id}) failed: {e}")
            # Store failure result
            await self._store_task_result(TaskResult(
                task_id=task_id,
                status=TaskStatus.FAILURE,
                error=str(e),
                completed_at=datetime.utcnow()
            ))
    
    async def get_task_result(self, task_id: str) -> Optional[TaskResult]:
        """Get task result from Redis"""
        if not self.redis_client:
            return None
        
        try:
            result_data = self.redis_client.get(f"task_result:{task_id}")
            if result_data:
                return TaskResult.parse_raw(result_data)
        except Exception as e:
            logger.error(f"Error retrieving task result {task_id}: {e}")
        
        return None
    
    async def cancel_task(self, task_id: str) -> bool:
        """Cancel task - limited support for BackgroundTasks"""
        # BackgroundTasks doesn't support cancellation once started
        # We can only mark it as cancelled in our tracking
        try:
            current_result = await self.get_task_result(task_id)
            if current_result and current_result.status == TaskStatus.PENDING:
                await self._store_task_result(TaskResult(
                    task_id=task_id,
                    status=TaskStatus.FAILURE,
                    error="Task cancelled",
                    completed_at=datetime.utcnow()
                ))
                return True
        except Exception as e:
            logger.error(f"Error cancelling task {task_id}: {e}")
        
        return False
    
    async def _store_task_result(self, result: TaskResult):
        """Store task result in Redis"""
        if not self.redis_client:
            return
        
        try:
            self.redis_client.setex(
                f"task_result:{result.task_id}",
                self.results_ttl,
                result.json()
            )
        except Exception as e:
            logger.error(f"Error storing task result: {e}")


class CeleryExecutor(TaskExecutor):
    """Celery-based executor for heavy tasks and high scalability"""
    
    def __init__(self, celery_app=None):
        self.celery_app = celery_app
    
    async def submit_task(
        self,
        task_name: str,
        *args,
        task_id: Optional[str] = None,
        delay: Optional[int] = None,
        **kwargs
    ) -> str:
        """Submit task to Celery"""
        if not self.celery_app:
            raise RuntimeError("Celery app not configured")
        
        task_options = {}
        if task_id:
            task_options['task_id'] = task_id
        
        if delay:
            # Schedule task with countdown
            celery_result = self.celery_app.send_task(
                task_name,
                args=args,
                kwargs=kwargs,
                countdown=delay,
                **task_options
            )
        else:
            # Execute immediately
            celery_result = self.celery_app.send_task(
                task_name,
                args=args,
                kwargs=kwargs,
                **task_options
            )
        
        return celery_result.id
    
    async def get_task_result(self, task_id: str) -> Optional[TaskResult]:
        """Get task result from Celery"""
        if not self.celery_app:
            return None
        
        try:
            celery_result = self.celery_app.AsyncResult(task_id)
            
            # Map Celery states to our TaskStatus
            status_mapping = {
                'PENDING': TaskStatus.PENDING,
                'STARTED': TaskStatus.RUNNING,
                'SUCCESS': TaskStatus.SUCCESS,
                'FAILURE': TaskStatus.FAILURE,
                'RETRY': TaskStatus.RETRY,
                'REVOKED': TaskStatus.FAILURE,
            }
            
            status = status_mapping.get(celery_result.state, TaskStatus.PENDING)
            
            result_data = None
            error = None
            
            if status == TaskStatus.SUCCESS:
                result_data = celery_result.result
            elif status == TaskStatus.FAILURE:
                error = str(celery_result.result)
            
            return TaskResult(
                task_id=task_id,
                status=status,
                result=result_data,
                error=error
            )
            
        except Exception as e:
            logger.error(f"Error getting Celery task result {task_id}: {e}")
            return None
    
    async def cancel_task(self, task_id: str) -> bool:
        """Cancel Celery task"""
        if not self.celery_app:
            return False
        
        try:
            self.celery_app.control.revoke(task_id, terminate=True)
            return True
        except Exception as e:
            logger.error(f"Error cancelling Celery task {task_id}: {e}")
            return False


class HybridExecutor(TaskExecutor):
    """Hybrid executor that routes tasks based on configuration"""
    
    def __init__(
        self,
        background_executor: BackgroundTasksExecutor,
        celery_executor: Optional[CeleryExecutor] = None,
        heavy_tasks: Optional[set] = None
    ):
        self.background_executor = background_executor
        self.celery_executor = celery_executor
        self.heavy_tasks = heavy_tasks or set()
    
    def _get_executor(self, task_name: str) -> TaskExecutor:
        """Route task to appropriate executor"""
        if task_name in self.heavy_tasks and self.celery_executor:
            return self.celery_executor
        return self.background_executor
    
    async def submit_task(
        self,
        task_name: str,
        *args,
        task_id: Optional[str] = None,
        delay: Optional[int] = None,
        **kwargs
    ) -> str:
        executor = self._get_executor(task_name)
        return await executor.submit_task(
            task_name, *args, task_id=task_id, delay=delay, **kwargs
        )
    
    async def get_task_result(self, task_id: str) -> Optional[TaskResult]:
        # Try both executors to find the result
        result = await self.background_executor.get_task_result(task_id)
        if not result and self.celery_executor:
            result = await self.celery_executor.get_task_result(task_id)
        return result
    
    async def cancel_task(self, task_id: str) -> bool:
        # Try both executors for cancellation
        cancelled = await self.background_executor.cancel_task(task_id)
        if not cancelled and self.celery_executor:
            cancelled = await self.celery_executor.cancel_task(task_id)
        return cancelled