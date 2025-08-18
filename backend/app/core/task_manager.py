# Task Management System - Scalable from BackgroundTasks to Celery
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union, Callable
from enum import Enum
import asyncio
import json
import logging
from datetime import datetime, timedelta
from pydantic import BaseModel
import uuid

logger = logging.getLogger(__name__)


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running" 
    SUCCESS = "success"
    FAILURE = "failure"
    RETRY = "retry"


class TaskResult(BaseModel):
    task_id: str
    status: TaskStatus
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    retries: int = 0


class TaskExecutor(ABC):
    """Abstract base class for task execution backends"""
    
    @abstractmethod
    async def submit_task(
        self,
        task_name: str,
        *args,
        task_id: Optional[str] = None,
        delay: Optional[int] = None,
        **kwargs
    ) -> str:
        """Submit a task for execution"""
        pass
    
    @abstractmethod
    async def get_task_result(self, task_id: str) -> Optional[TaskResult]:
        """Get task result by ID"""
        pass
    
    @abstractmethod
    async def cancel_task(self, task_id: str) -> bool:
        """Cancel a running task"""
        pass


class TaskManager:
    """Main task manager that delegates to different executors"""
    
    def __init__(self, executor: TaskExecutor):
        self.executor = executor
        self.task_registry: Dict[str, Callable] = {}
    
    def register_task(self, name: str, func: Callable):
        """Register a task function"""
        self.task_registry[name] = func
    
    def task(self, name: str):
        """Decorator to register task functions"""
        def decorator(func: Callable):
            self.register_task(name, func)
            return func
        return decorator
    
    async def submit(
        self,
        task_name: str,
        *args,
        task_id: Optional[str] = None,
        delay: Optional[int] = None,
        **kwargs
    ) -> str:
        """Submit a task for execution"""
        if task_name not in self.task_registry:
            raise ValueError(f"Task '{task_name}' not registered")
        
        return await self.executor.submit_task(
            task_name, *args, task_id=task_id, delay=delay, **kwargs
        )
    
    async def get_result(self, task_id: str) -> Optional[TaskResult]:
        """Get task result"""
        return await self.executor.get_task_result(task_id)
    
    async def cancel(self, task_id: str) -> bool:
        """Cancel task"""
        return await self.executor.cancel_task(task_id)
    
    def get_task_function(self, task_name: str) -> Optional[Callable]:
        """Get registered task function"""
        return self.task_registry.get(task_name)