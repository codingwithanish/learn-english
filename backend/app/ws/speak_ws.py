import json
import uuid
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import verify_token
from app.models.models import UserDetails, SpeakResources, SpeakResourceStatus, SpeakResourceType, InitiatedResourceType, UserHistory, ActionType
from app.schemas.speak import SpeakSessionMessage, SpeakSessionResponse
from app.services.stt_service import STTService
from app.services.nlp_service import NLPService
from app.services.tts_service import TTSService
from app.core.tasks import get_task_manager

router = APIRouter()

# Database setup for WebSocket connections
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class SpeakSessionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_sessions: Dict[str, str] = {}  # user_id -> session_id
        self.session_data: Dict[str, Dict] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str, user_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        self.user_sessions[user_id] = session_id
        self.session_data[session_id] = {
            "user_id": user_id,
            "connected_at": datetime.utcnow(),
            "audio_chunks": [],
            "status": "connected"
        }
    
    def disconnect(self, session_id: str, user_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        if user_id in self.user_sessions:
            del self.user_sessions[user_id]
        if session_id in self.session_data:
            del self.session_data[session_id]
    
    async def send_personal_message(self, message: dict, session_id: str):
        if session_id in self.active_connections:
            websocket = self.active_connections[session_id]
            await websocket.send_text(json.dumps(message))
    
    def get_session_data(self, session_id: str) -> Optional[Dict]:
        return self.session_data.get(session_id)
    
    def update_session_data(self, session_id: str, data: Dict):
        if session_id in self.session_data:
            self.session_data[session_id].update(data)


manager = SpeakSessionManager()


@router.websocket("/ws/speak")
async def websocket_speak_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    session_id: Optional[str] = Query(None)
):
    # Validate JWT token
    try:
        payload = verify_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001, reason="Invalid token")
            return
    except Exception as e:
        await websocket.close(code=4001, reason="Authentication failed")
        return
    
    # Generate session ID if not provided
    if not session_id:
        session_id = str(uuid.uuid4())
    
    # Connect to session manager
    await manager.connect(websocket, session_id, user_id)
    
    try:
        while True:
            # Receive message
            try:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                message = SpeakSessionMessage(**message_data)
            except json.JSONDecodeError:
                await manager.send_personal_message({
                    "type": "error",
                    "code": 400,
                    "message": "Invalid JSON format"
                }, session_id)
                continue
            except Exception as e:
                await manager.send_personal_message({
                    "type": "error",
                    "code": 400,
                    "message": f"Invalid message format: {str(e)}"
                }, session_id)
                continue
            
            # Handle different message types
            await handle_speak_message(message, session_id, user_id, websocket)
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        manager.disconnect(session_id, user_id)


async def handle_speak_message(
    message: SpeakSessionMessage,
    session_id: str,
    user_id: str,
    websocket: WebSocket
):
    try:
        if message.type == "start":
            await handle_start_session(message, session_id, user_id)
        
        elif message.type == "audio":
            await handle_audio_chunk(message, session_id, user_id)
        
        elif message.type == "stop":
            await handle_stop_session(message, session_id, user_id)
        
        elif message.type == "ping":
            await manager.send_personal_message({
                "type": "pong",
                "session_id": session_id
            }, session_id)
        
        else:
            await manager.send_personal_message({
                "type": "error",
                "code": 400,
                "message": f"Unknown message type: {message.type}"
            }, session_id)
            
    except Exception as e:
        await manager.send_personal_message({
            "type": "error",
            "code": 500,
            "message": f"Error handling message: {str(e)}"
        }, session_id)


async def handle_start_session(message: SpeakSessionMessage, session_id: str, user_id: str):
    """Handle session start"""
    config = message.config or {}
    speak_time = config.get("speak_time", 60)
    subject = config.get("subject", "General Speaking")
    speak_type = config.get("type", "SUBJECT_SPEAK")
    
    # Create speak resource in database
    db = SessionLocal()
    try:
        speak_resource = SpeakResources(
            user_id=user_id,
            status=SpeakResourceStatus.INITIATED,
            title=subject,
            resource_config=config,
            type=SpeakResourceType(speak_type),
            initiated_resource=InitiatedResourceType.STUDENT,
            expiry=datetime.utcnow() + timedelta(seconds=speak_time + 30),  # Extra buffer
            session_id=session_id
        )
        db.add(speak_resource)
        db.commit()
        db.refresh(speak_resource)
        
        # Update session data
        manager.update_session_data(session_id, {
            "resource_id": str(speak_resource.id),
            "config": config,
            "status": "recording",
            "start_time": datetime.utcnow(),
            "max_duration": speak_time
        })
        
        # Send acknowledgment
        await manager.send_personal_message({
            "type": "ack",
            "session_id": session_id,
            "max_duration": speak_time,
            "resource_id": str(speak_resource.id)
        }, session_id)
        
    except Exception as e:
        print(f"Error starting session: {e}")
        await manager.send_personal_message({
            "type": "error",
            "code": 500,
            "message": "Failed to start session"
        }, session_id)
    finally:
        db.close()


async def handle_audio_chunk(message: SpeakSessionMessage, session_id: str, user_id: str):
    """Handle incoming audio data"""
    session_data = manager.get_session_data(session_id)
    if not session_data:
        await manager.send_personal_message({
            "type": "error",
            "code": 400,
            "message": "Session not found"
        }, session_id)
        return
    
    if session_data.get("status") != "recording":
        await manager.send_personal_message({
            "type": "error",
            "code": 400,
            "message": "Session not in recording state"
        }, session_id)
        return
    
    # Store audio chunk
    audio_chunks = session_data.get("audio_chunks", [])
    if message.payload_b64:
        audio_chunks.append({
            "sequence": message.sequence,
            "data": message.payload_b64,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    manager.update_session_data(session_id, {"audio_chunks": audio_chunks})
    
    # Send interim transcript (placeholder - would integrate with real STT)
    await manager.send_personal_message({
        "type": "interim",
        "transcript": f"Processing audio chunk {message.sequence}...",
        "confidence": 0.8,
        "time": len(audio_chunks)
    }, session_id)


async def handle_stop_session(message: SpeakSessionMessage, session_id: str, user_id: str):
    """Handle session stop and trigger processing"""
    session_data = manager.get_session_data(session_id)
    if not session_data:
        await manager.send_personal_message({
            "type": "error",
            "code": 400,
            "message": "Session not found"
        }, session_id)
        return
    
    # Update session status
    manager.update_session_data(session_id, {"status": "processing"})
    
    # Send processing message
    await manager.send_personal_message({
        "type": "processing",
        "session_id": session_id
    }, session_id)
    
    # Trigger background processing
    try:
        resource_id = session_data.get("resource_id")
        audio_chunks = session_data.get("audio_chunks", [])
        
        if resource_id and audio_chunks:
            # Get task manager and submit processing task
            task_manager = get_task_manager()
            
            # Get user name for TTS
            db = SessionLocal()
            try:
                user = db.query(UserDetails).filter(UserDetails.id == user_id).first()
                user_name = user.name if user else "Student"
            finally:
                db.close()
            
            # Submit background task with FastAPI BackgroundTasks
            from fastapi import BackgroundTasks
            background_tasks = BackgroundTasks()
            
            task_id = await task_manager.submit(
                "process_speak_audio",
                resource_id,
                audio_chunks,
                user_name,
                background_tasks=background_tasks
            )
            
            # For now, simulate processing for immediate feedback
            await simulate_processing(session_id, resource_id, session_data)
        else:
            await manager.send_personal_message({
                "type": "error",
                "code": 400,
                "message": "No audio data to process"
            }, session_id)
    except Exception as e:
        await manager.send_personal_message({
            "type": "error",
            "code": 500,
            "message": f"Processing failed: {str(e)}"
        }, session_id)


async def simulate_processing(session_id: str, resource_id: str, session_data: Dict):
    """Simulate audio processing and evaluation"""
    # Simulate processing delay
    await asyncio.sleep(2)
    
    db = SessionLocal()
    try:
        # Get the speak resource
        speak_resource = db.query(SpeakResources).filter(SpeakResources.id == resource_id).first()
        if not speak_resource:
            raise Exception("Speak resource not found")
        
        # Simulate transcript and evaluation
        mock_transcript = "This is a simulated transcript of the user's speech."
        mock_evaluation = [
            {
                "criteria": "grammar",
                "reference_sentence": "Overall grammar usage",
                "suggestion": "Good grammar structure, consider using more complex sentences",
                "examples": ["Try using compound sentences"]
            },
            {
                "criteria": "vocabulary",
                "reference_sentence": "Vocabulary assessment",
                "suggestion": "Expand your vocabulary with more descriptive words",
                "examples": ["Instead of 'good', try 'excellent' or 'remarkable'"]
            }
        ]
        
        # Update speak resource
        speak_resource.status = SpeakResourceStatus.COMPLETED
        speak_resource.completed_date = datetime.utcnow()
        speak_resource.evaluation_result = mock_evaluation
        speak_resource.summary = "Speech evaluation completed successfully"
        
        # Mock S3 URLs
        speak_resource.input_resource_location = f"s3://learn-english-audio/input/{resource_id}.wav"
        speak_resource.output_resource_location = f"s3://learn-english-audio/feedback/{resource_id}.mp3"
        
        db.commit()
        
        # Log user history
        history = UserHistory(
            user_id=speak_resource.user_id,
            action_type=ActionType.SPEAK,
            user_query=speak_resource.title,
            corrected_query=mock_transcript,
            corrected_description="Speech session completed",
            is_valid=True,
            resource_id=speak_resource.id
        )
        db.add(history)
        db.commit()
        
        # Send final result
        await manager.send_personal_message({
            "type": "final",
            "session_id": session_id,
            "evaluation_result": mock_evaluation,
            "transcript": mock_transcript,
            "tts_url": speak_resource.output_resource_location,
            "resource_id": resource_id
        }, session_id)
        
    except Exception as e:
        print(f"Processing error: {e}")
        await manager.send_personal_message({
            "type": "error",
            "code": 500,
            "message": "Processing failed"
        }, session_id)
    finally:
        db.close()