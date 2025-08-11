from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.models import SpeakResourceStatus, SpeakResourceType, InitiatedResourceType


class SpeakSessionStartRequest(BaseModel):
    session_id: Optional[str] = None
    config: Dict[str, Any]  # Contains subject, speak_time, type, etc.


class SpeakSessionMessage(BaseModel):
    type: str  # "start", "audio", "stop", "ping"
    session_id: Optional[str] = None
    sequence: Optional[int] = None
    payload_b64: Optional[str] = None  # Base64 encoded audio data
    config: Optional[Dict[str, Any]] = None


class SpeakSessionResponse(BaseModel):
    type: str  # "ack", "interim", "processing", "final", "error"
    session_id: Optional[str] = None
    message: Optional[str] = None
    transcript: Optional[str] = None
    confidence: Optional[float] = None
    time: Optional[int] = None
    evaluation_result: Optional[List[Dict[str, Any]]] = None
    tts_url: Optional[str] = None
    resource_id: Optional[str] = None
    max_duration: Optional[int] = None
    code: Optional[int] = None


class CreateSpeakResourceRequest(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    resource_config: Dict[str, Any]
    type: SpeakResourceType
    initiated_resource: InitiatedResourceType


class SpeakResourceResponse(BaseModel):
    id: str
    status: SpeakResourceStatus
    evaluation_result: Optional[List[Dict[str, Any]]]
    input_resource_location: Optional[str]
    output_resource_location: Optional[str]
    summary: Optional[str]
    title: Optional[str]
    created_date: datetime
    completed_date: Optional[datetime]

    class Config:
        from_attributes = True