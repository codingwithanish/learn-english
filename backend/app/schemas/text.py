from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime
from app.models.models import ResourceType, ActionType


class ProcessTextRequest(BaseModel):
    query: str
    user_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = {}


class ProcessTextResponse(BaseModel):
    detected_type: ResourceType
    corrected_query: str
    description: str
    examples: List[str]
    resource_id: Optional[str] = None
    recommendations: List[Dict[str, str]] = []


class SearchParams(BaseModel):
    type: Optional[ActionType] = None
    sub_type: Optional[ResourceType] = None
    order_by: Optional[str] = "rating"
    limit: int = 20
    next_page_id: Optional[str] = None
    target_user_id: Optional[str] = None


class SearchResultItem(BaseModel):
    user_id: Optional[str]
    type: ActionType
    details: Dict[str, Any]
    query: str
    valid: bool


class SearchResponse(BaseModel):
    items: List[SearchResultItem]
    next_page_id: Optional[str] = None