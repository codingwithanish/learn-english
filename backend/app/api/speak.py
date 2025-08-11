from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.models import UserDetails, SpeakResources
from app.schemas.speak import SpeakResourceResponse

router = APIRouter()


@router.get("/speakup/{resource_id}", response_model=SpeakResourceResponse)
async def get_speak_resource(
    resource_id: str,
    current_user: UserDetails = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get speak resource details by ID"""
    try:
        resource = db.query(SpeakResources).filter(
            SpeakResources.id == UUID(resource_id)
        ).first()
        
        if not resource:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Speak resource not found"
            )
        
        # Check permissions - users can only access their own resources
        # or tutors can access their students' resources
        if resource.user_id != current_user.id and current_user.type.value != "TUTOR":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this resource"
            )
        
        return SpeakResourceResponse.from_orm(resource)
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid resource ID format"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving resource: {str(e)}"
        )


@router.get("/speakup", response_model=List[SpeakResourceResponse])
async def get_user_speak_resources(
    current_user: UserDetails = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all speak resources for current user"""
    try:
        resources = db.query(SpeakResources).filter(
            SpeakResources.user_id == current_user.id
        ).order_by(SpeakResources.created_date.desc()).all()
        
        return [SpeakResourceResponse.from_orm(resource) for resource in resources]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving resources: {str(e)}"
        )