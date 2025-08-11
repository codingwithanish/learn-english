from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.models import UserDetails, UserHistory, ActionType
from app.schemas.text import SearchResponse, SearchResultItem

router = APIRouter()


@router.get("/history", response_model=SearchResponse)
async def get_user_history(
    action_type: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    current_user: UserDetails = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's activity history with filters"""
    try:
        # Base query
        query = db.query(UserHistory).filter(
            UserHistory.user_id == current_user.id
        )
        
        # Apply filters
        if action_type:
            try:
                action_enum = ActionType(action_type.lower())
                query = query.filter(UserHistory.action_type == action_enum)
            except ValueError:
                pass  # Invalid action type, ignore filter
        
        if from_date:
            try:
                from_dt = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
                query = query.filter(UserHistory.action_time >= from_dt)
            except ValueError:
                pass  # Invalid date format, ignore filter
        
        if to_date:
            try:
                to_dt = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
                query = query.filter(UserHistory.action_time <= to_dt)
            except ValueError:
                pass  # Invalid date format, ignore filter
        
        # Order and paginate
        history_items = query.order_by(
            UserHistory.action_time.desc()
        ).offset(offset).limit(limit).all()
        
        # Convert to response format
        items = []
        for item in history_items:
            search_item = SearchResultItem(
                user_id=str(item.user_id),
                type=item.action_type,
                details={
                    "id": item.id,
                    "action_time": item.action_time.isoformat(),
                    "user_query": item.user_query,
                    "corrected_query": item.corrected_query,
                    "corrected_description": item.corrected_description,
                    "is_valid": item.is_valid,
                    "reference_table": item.reference_table.value if item.reference_table else None,
                    "type_of_impression": item.type_of_impression.value if item.type_of_impression else None,
                    "resource_id": str(item.resource_id) if item.resource_id else None
                },
                query=item.user_query or "",
                valid=item.is_valid
            )
            items.append(search_item)
        
        return SearchResponse(
            items=items,
            next_page_id=str(offset + limit) if len(items) == limit else None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving history: {str(e)}"
        )


@router.get("/favorites")
async def get_user_favorites(
    current_user: UserDetails = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's favorite resources"""
    try:
        # This would use the UserFavorites table
        # For now, return placeholder
        return {
            "favorites": [],
            "message": "Favorites feature not yet implemented"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving favorites: {str(e)}"
        )


@router.post("/favorites")
async def add_to_favorites(
    resource_id: str,
    resource_type: str,
    current_user: UserDetails = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a resource to user's favorites"""
    try:
        # This would add to UserFavorites table
        # For now, return placeholder
        return {
            "message": "Favorites feature not yet implemented",
            "resource_id": resource_id,
            "resource_type": resource_type
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding to favorites: {str(e)}"
        )


@router.post("/feedback")
async def submit_feedback(
    tutor_id: str,
    student_id: str,
    speak_resource_id: str,
    feedback_text: str,
    current_user: UserDetails = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit feedback for a speak resource"""
    try:
        # This would add to TutorRatings table
        # For now, return placeholder
        return {
            "message": "Feedback feature not yet implemented",
            "tutor_id": tutor_id,
            "student_id": student_id,
            "speak_resource_id": speak_resource_id,
            "feedback_text": feedback_text
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error submitting feedback: {str(e)}"
        )