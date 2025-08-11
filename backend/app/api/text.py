from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from uuid import UUID

from app.core.security import get_current_user, require_roles
from app.db.session import get_db
from app.models.models import UserDetails, TextResources, UserHistory, ResourceType, ActionType, ImpressionType
from app.schemas.text import ProcessTextRequest, ProcessTextResponse, SearchResponse, SearchResultItem
from app.services.nlp_service import NLPService

router = APIRouter()


@router.post("/process-text", response_model=ProcessTextResponse)
async def process_text(
    request: ProcessTextRequest,
    current_user: UserDetails = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Detect query type using NLP
        detected_type = await NLPService.detect_query_type(request.query)
        
        # Process the query
        result = await NLPService.process_text_query(request.query, detected_type)
        
        # Check if similar resource exists
        existing_resource = db.query(TextResources).filter(
            and_(
                TextResources.type == detected_type,
                or_(
                    TextResources.content.ilike(f"%{request.query}%"),
                    TextResources.content.ilike(f"%{result['corrected_query']}%")
                )
            )
        ).first()
        
        resource_id = None
        impression_type = ImpressionType.NEW
        
        if existing_resource:
            resource_id = str(existing_resource.id)
            impression_type = ImpressionType.EXISTING
            # Increment impressions
            existing_resource.impressions += 1
            db.commit()
        else:
            # Create new resource
            new_resource = TextResources(
                user_id=current_user.id,
                type=detected_type,
                content=result['corrected_query'],
                description=result['description'],
                examples=[],  # Would be populated from NLP result
                impressions=1
            )
            db.add(new_resource)
            db.commit()
            db.refresh(new_resource)
            resource_id = str(new_resource.id)
        
        # Log user history
        history = UserHistory(
            user_id=current_user.id,
            action_type=ActionType.TEXT,
            user_query=request.query,
            corrected_query=result['corrected_query'],
            corrected_description=result['description'],
            is_valid=True,
            type_of_impression=impression_type,
            resource_id=UUID(resource_id) if resource_id else None
        )
        db.add(history)
        db.commit()
        
        return ProcessTextResponse(
            detected_type=detected_type,
            corrected_query=result['corrected_query'],
            description=result['description'],
            examples=[],  # Would be extracted from NLP result
            resource_id=resource_id,
            recommendations=[]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing text: {str(e)}"
        )


@router.get("/search", response_model=SearchResponse)
async def search_resources(
    type: Optional[str] = Query(None),
    sub_type: Optional[str] = Query(None),
    order_by: str = Query("rating"),
    limit: int = Query(20, le=100),
    next_page_id: Optional[str] = Query(None),
    target_user_id: Optional[str] = Query(None),
    current_user: UserDetails = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(TextResources)
        
        # Apply filters
        if sub_type:
            try:
                resource_type = ResourceType(sub_type.upper())
                query = query.filter(TextResources.type == resource_type)
            except ValueError:
                pass
        
        # Handle target_user_id (for tutors viewing student data)
        if target_user_id:
            if current_user.type.value not in ["TUTOR", "ADMIN"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only tutors and admins can view other users' data"
                )
            query = query.filter(TextResources.user_id == UUID(target_user_id))
        else:
            # Show user's own resources or public resources
            query = query.filter(
                or_(
                    TextResources.user_id == current_user.id,
                    TextResources.user_id.is_(None)  # Public resources
                )
            )
        
        # Apply ordering
        if order_by == "rating":
            query = query.order_by(TextResources.rating.desc())
        elif order_by == "recent":
            query = query.order_by(TextResources.created_at.desc())
        
        # Apply pagination
        if next_page_id:
            # Implement cursor-based pagination
            pass
        
        resources = query.limit(limit).all()
        
        # Convert to response format
        items = []
        for resource in resources:
            items.append(SearchResultItem(
                user_id=str(resource.user_id) if resource.user_id else None,
                type=ActionType.TEXT,
                details={
                    "id": str(resource.id),
                    "type": resource.type.value,
                    "content": resource.content,
                    "description": resource.description,
                    "examples": resource.examples or [],
                    "rating": resource.rating,
                    "impressions": resource.impressions
                },
                query=resource.content,
                valid=True
            ))
        
        return SearchResponse(
            items=items,
            next_page_id=None  # Implement pagination cursor
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching resources: {str(e)}"
        )