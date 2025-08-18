# Task Definitions - Migrated from Celery to unified task system
import json
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import redis

from .config import settings
from .task_manager import TaskManager, TaskResult, TaskStatus
from .executors import BackgroundTasksExecutor, CeleryExecutor, HybridExecutor
from ..models.models import (
    SpeakResources, TextResources, UserHistory, UserDetails,
    SpeakResourceStatus, ActionType
)
from ..services.stt_service import STTService
from ..services.nlp_service import NLPService
from ..services.tts_service import TTSService

# Database setup
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Redis client
redis_client = redis.from_url(settings.REDIS_URL) if settings.REDIS_URL else None


def get_db() -> Session:
    """Get database session"""
    db = SessionLocal()
    try:
        return db
    finally:
        pass  # Session managed by task functions


# Initialize task system
def create_task_manager() -> TaskManager:
    """Create and configure task manager"""
    # Create background executor
    background_executor = BackgroundTasksExecutor()
    
    # Create task manager based on configuration
    executor_type = settings.TASK_EXECUTOR.lower()
    
    if executor_type == "background":
        # Use only BackgroundTasks
        executor = background_executor
        task_manager = TaskManager(executor)
        background_executor.task_manager_ref = lambda: task_manager
        
    elif executor_type == "celery":
        # Use only Celery (if available)
        try:
            from ..workers.celery_app import celery_app
            celery_executor = CeleryExecutor(celery_app)
            task_manager = TaskManager(celery_executor)
        except ImportError:
            # Fallback to BackgroundTasks
            print("Warning: Celery not available, falling back to BackgroundTasks")
            executor = background_executor
            task_manager = TaskManager(executor)
            background_executor.task_manager_ref = lambda: task_manager
            
    else:  # hybrid or any other value
        # Create hybrid executor with intelligent routing
        celery_executor = None
        if settings.ENABLE_CELERY:
            try:
                from ..workers.celery_app import celery_app
                celery_executor = CeleryExecutor(celery_app)
            except ImportError:
                print("Warning: Celery requested but not available")
        
        # Parse heavy tasks from configuration
        heavy_tasks = set(task.strip() for task in settings.HEAVY_TASKS.split(',') if task.strip())
        
        # Create hybrid executor that routes appropriately
        executor = HybridExecutor(
            background_executor=background_executor,
            celery_executor=celery_executor,
            heavy_tasks=heavy_tasks
        )
        
        task_manager = TaskManager(executor)
        background_executor.task_manager_ref = lambda: task_manager
    
    return task_manager


# Global task manager instance
task_manager = create_task_manager()


# Task Definitions
@task_manager.task("process_speak_audio")
async def process_speak_audio(resource_id: str, audio_chunks: List[Dict], user_name: str = "Student"):
    """
    Process audio from a speaking session:
    1. Combine audio chunks
    2. Run STT (Speech-to-Text)
    3. Evaluate speech using NLP
    4. Generate TTS feedback
    5. Update speak resource with results
    """
    db = get_db()
    
    try:
        # Get the speak resource
        resource = db.query(SpeakResources).filter(
            SpeakResources.id == resource_id
        ).first()
        
        if not resource:
            raise Exception(f"Speak resource {resource_id} not found")
        
        # Step 1: Process audio chunks with STT
        print(f"Processing {len(audio_chunks)} audio chunks for resource {resource_id}")
        
        # Step 1: STT processing
        transcription_result = await STTService.stream_transcribe(audio_chunks)
        transcript = transcription_result.get('transcript', '')
        
        if not transcript:
            raise Exception("Failed to transcribe audio")
        
        # Step 2: Evaluate speech using NLP
        subject = resource.title or "General speaking"
        evaluation_result = await NLPService.evaluate_speech(transcript, subject)
        
        # Step 3: Generate TTS feedback
        tts_service = TTSService()
        feedback_s3_url = await tts_service.create_and_save_feedback(
            evaluation_result, resource_id, user_name
        )
        
        # Step 4: Update resource with results
        resource.status = SpeakResourceStatus.COMPLETED
        resource.completed_date = datetime.utcnow()
        resource.evaluation_result = evaluation_result
        resource.summary = f"Speech evaluation completed. Transcript: {transcript[:100]}..."
        resource.output_resource_location = feedback_s3_url
        
        # Simulate saving input audio to S3
        now = datetime.utcnow()
        input_s3_key = f"speak/input/{now.year}/{now.month:02d}/{now.day:02d}/{resource_id}-input.wav"
        resource.input_resource_location = f"s3://{settings.S3_BUCKET}/{input_s3_key}"
        
        db.commit()
        
        # Step 5: Update user history
        user_history = UserHistory(
            user_id=resource.user_id,
            action_type=ActionType.SPEAK,
            user_query=subject,
            corrected_query=transcript,
            corrected_description="Speech session completed successfully",
            is_valid=True,
            resource_id=resource.id
        )
        db.add(user_history)
        db.commit()
        
        print(f"Successfully processed speak resource {resource_id}")
        return {
            "resource_id": resource_id,
            "transcript": transcript,
            "evaluation_result": evaluation_result,
            "feedback_url": feedback_s3_url
        }
        
    except Exception as exc:
        print(f"Error processing speak audio: {exc}")
        
        # Update resource status to indicate error
        try:
            resource = db.query(SpeakResources).filter(
                SpeakResources.id == resource_id
            ).first()
            if resource:
                resource.summary = f"Processing failed: {str(exc)}"
                db.commit()
        except:
            pass
        
        raise exc
    
    finally:
        db.close()


@task_manager.task("calculate_rating")
async def calculate_rating(resource_id: str, resource_type: str = "text"):
    """
    Calculate rating for a text resource based on:
    - Recent pickups (40%)
    - Tutor average rating (40%)
    - Impressions count (20%)
    """
    db = get_db()
    
    try:
        if resource_type == "text":
            resource = db.query(TextResources).filter(
                TextResources.id == resource_id
            ).first()
        else:
            return {"error": "Unsupported resource type"}
        
        if not resource:
            return {"error": f"Resource {resource_id} not found"}
        
        # Calculate components
        recent_pickups_score = min(resource.impressions / 10.0, 5.0)
        
        # Simulate tutor ratings
        tutor_ratings = resource.tutor_ratings or []
        if tutor_ratings:
            avg_tutor_rating = sum(r.get('rating', 3) for r in tutor_ratings) / len(tutor_ratings)
        else:
            avg_tutor_rating = 3.0
        
        impressions_score = min(resource.impressions / 20.0, 5.0)
        
        # Weighted calculation
        final_rating = (
            recent_pickups_score * 0.4 +
            avg_tutor_rating * 0.4 +
            impressions_score * 0.2
        )
        
        # Update resource
        old_rating = resource.rating
        resource.rating = min(round(final_rating, 1), 5.0)
        db.commit()
        
        print(f"Updated rating for resource {resource_id}: {resource.rating}")
        return {
            "resource_id": resource_id,
            "old_rating": old_rating,
            "new_rating": resource.rating,
            "components": {
                "recent_pickups": recent_pickups_score,
                "tutor_rating": avg_tutor_rating,
                "impressions": impressions_score
            }
        }
        
    except Exception as exc:
        print(f"Error calculating rating: {exc}")
        return {"error": str(exc)}
    
    finally:
        db.close()


@task_manager.task("calculate_all_ratings")
async def calculate_all_ratings():
    """Daily task to recalculate all resource ratings"""
    db = get_db()
    
    try:
        # Get all text resources
        resources = db.query(TextResources).all()
        
        results = []
        for resource in resources:
            try:
                # Submit rating calculation task
                task_id = await task_manager.submit("calculate_rating", str(resource.id), "text")
                results.append(task_id)
            except Exception as e:
                print(f"Failed to queue rating calculation for {resource.id}: {e}")
        
        return {
            "queued_tasks": len(results),
            "task_ids": results
        }
        
    except Exception as exc:
        print(f"Error in calculate_all_ratings: {exc}")
        return {"error": str(exc)}
    
    finally:
        db.close()


@task_manager.task("sync_impressions_from_redis")
async def sync_impressions_from_redis():
    """Sync impression counts from Redis to PostgreSQL"""
    db = get_db()
    
    try:
        if not redis_client:
            return {"error": "Redis not configured"}
        
        # Get all impression keys from Redis
        impression_keys = redis_client.keys("impressions:text_resource:*")
        
        updated_count = 0
        for key in impression_keys:
            try:
                # Extract resource ID from key
                resource_id = key.decode('utf-8').split(':')[-1]
                impression_count = int(redis_client.get(key) or 0)
                
                # Update database
                resource = db.query(TextResources).filter(
                    TextResources.id == resource_id
                ).first()
                
                if resource:
                    resource.impressions += impression_count
                    db.commit()
                    updated_count += 1
                    
                    # Remove from Redis after syncing
                    redis_client.delete(key)
                    
            except Exception as e:
                print(f"Error syncing impression for key {key}: {e}")
                continue
        
        return {
            "synced_resources": updated_count,
            "processed_keys": len(impression_keys)
        }
        
    except Exception as exc:
        print(f"Error in sync_impressions_from_redis: {exc}")
        return {"error": str(exc)}
    
    finally:
        db.close()


@task_manager.task("cleanup_expired_sessions")
async def cleanup_expired_sessions():
    """Clean up expired speaking sessions"""
    db = get_db()
    
    try:
        # Find expired sessions that are still in INITIATED status
        expired_sessions = db.query(SpeakResources).filter(
            SpeakResources.status == SpeakResourceStatus.INITIATED,
            SpeakResources.expiry < datetime.utcnow()
        ).all()
        
        cleaned_count = 0
        for session in expired_sessions:
            try:
                session.status = SpeakResourceStatus.COMPLETED
                session.summary = "Session expired without completion"
                session.completed_date = datetime.utcnow()
                db.commit()
                cleaned_count += 1
            except Exception as e:
                print(f"Error cleaning session {session.id}: {e}")
                continue
        
        return {
            "cleaned_sessions": cleaned_count
        }
        
    except Exception as exc:
        print(f"Error in cleanup_expired_sessions: {exc}")
        return {"error": str(exc)}
    
    finally:
        db.close()


@task_manager.task("send_notification")
async def send_notification(user_id: str, notification_type: str, message: str, data: Dict = None):
    """Send notification to user"""
    try:
        if not redis_client:
            print("Redis not configured, skipping notification")
            return {"error": "Redis not configured"}
        
        notification_data = {
            "user_id": user_id,
            "type": notification_type,
            "message": message,
            "data": data or {},
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Store in Redis
        redis_key = f"notifications:user:{user_id}"
        redis_client.lpush(redis_key, json.dumps(notification_data))
        redis_client.expire(redis_key, 86400 * 7)  # Keep for 7 days
        
        print(f"Notification sent to user {user_id}: {message}")
        return notification_data
        
    except Exception as exc:
        print(f"Error sending notification: {exc}")
        return {"error": str(exc)}


# Helper function to get task manager instance
def get_task_manager() -> TaskManager:
    """Get the global task manager instance"""
    return task_manager