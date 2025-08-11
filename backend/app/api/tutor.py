from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
from uuid import UUID

from app.core.security import get_current_user, require_roles
from app.db.session import get_db
from app.models.models import (
    UserDetails, StudentTutorMapping, UserHistory, TextResources, 
    SpeakResources, ActionType, UserType
)
from app.schemas.auth import UserResponse

router = APIRouter()


@router.get("/students", response_model=List[UserResponse])
async def get_tutor_students(
    current_user: UserDetails = Depends(require_roles("TUTOR", "ADMIN")),
    db: Session = Depends(get_db)
):
    """Get list of students assigned to current tutor"""
    try:
        # Get students mapped to this tutor
        mappings = db.query(StudentTutorMapping).filter(
            StudentTutorMapping.tutor_id == current_user.id
        ).all()
        
        student_ids = [mapping.student_id for mapping in mappings]
        
        if not student_ids:
            return []
        
        # Get student details
        students = db.query(UserDetails).filter(
            UserDetails.id.in_(student_ids),
            UserDetails.type == UserType.STUDENT,
            UserDetails.status.in_(["ACTIVE"])
        ).all()
        
        return [UserResponse.from_orm(student) for student in students]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving students: {str(e)}"
        )


@router.get("/student/{student_id}")
async def get_student_details(
    student_id: str,
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    current_user: UserDetails = Depends(require_roles("TUTOR", "ADMIN")),
    db: Session = Depends(get_db)
):
    """Get detailed student information and activities"""
    try:
        student_uuid = UUID(student_id)
        
        # Verify tutor has access to this student
        if current_user.type == UserType.TUTOR:
            mapping = db.query(StudentTutorMapping).filter(
                and_(
                    StudentTutorMapping.student_id == student_uuid,
                    StudentTutorMapping.tutor_id == current_user.id
                )
            ).first()
            
            if not mapping:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this student"
                )
        
        # Get student details
        student = db.query(UserDetails).filter(
            UserDetails.id == student_uuid,
            UserDetails.type == UserType.STUDENT
        ).first()
        
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )
        
        # Parse date filters
        date_filter = []
        if from_date:
            try:
                from_dt = datetime.fromisoformat(from_date)
                date_filter.append(UserHistory.action_time >= from_dt)
            except ValueError:
                pass
        
        if to_date:
            try:
                to_dt = datetime.fromisoformat(to_date)
                date_filter.append(UserHistory.action_time <= to_dt)
            except ValueError:
                pass
        
        # Get student activities
        history_query = db.query(UserHistory).filter(
            UserHistory.user_id == student_uuid
        )
        
        if date_filter:
            history_query = history_query.filter(and_(*date_filter))
        
        activities = history_query.order_by(
            UserHistory.action_time.desc()
        ).limit(limit).all()
        
        # Get recent text resources
        text_resources = db.query(TextResources).filter(
            TextResources.user_id == student_uuid
        ).order_by(TextResources.created_at.desc()).limit(10).all()
        
        # Get recent speak resources
        speak_resources = db.query(SpeakResources).filter(
            SpeakResources.user_id == student_uuid
        ).order_by(SpeakResources.created_date.desc()).limit(10).all()
        
        # Calculate statistics
        total_text_queries = len([a for a in activities if a.action_type == ActionType.TEXT])
        total_speak_sessions = len([a for a in activities if a.action_type == ActionType.SPEAK])
        
        # Recent activity (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_activities = [a for a in activities if a.action_time >= week_ago]
        
        return {
            "student": UserResponse.from_orm(student),
            "statistics": {
                "total_text_queries": total_text_queries,
                "total_speak_sessions": total_speak_sessions,
                "recent_activities_count": len(recent_activities),
                "total_activities": len(activities)
            },
            "recent_activities": [
                {
                    "id": activity.id,
                    "action_time": activity.action_time.isoformat(),
                    "action_type": activity.action_type.value,
                    "user_query": activity.user_query,
                    "corrected_query": activity.corrected_query,
                    "is_valid": activity.is_valid
                }
                for activity in activities
            ],
            "recent_text_resources": [
                {
                    "id": str(resource.id),
                    "type": resource.type.value,
                    "content": resource.content,
                    "description": resource.description,
                    "rating": resource.rating,
                    "created_at": resource.created_at.isoformat()
                }
                for resource in text_resources
            ],
            "recent_speak_resources": [
                {
                    "id": str(resource.id),
                    "title": resource.title,
                    "status": resource.status.value,
                    "type": resource.type.value,
                    "created_date": resource.created_date.isoformat(),
                    "completed_date": resource.completed_date.isoformat() if resource.completed_date else None
                }
                for resource in speak_resources
            ]
        }
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid student ID format"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving student details: {str(e)}"
        )


@router.get("/recommendation/{user_id}")
async def get_recommendations_for_user(
    user_id: str,
    current_user: UserDetails = Depends(require_roles("TUTOR", "ADMIN")),
    db: Session = Depends(get_db)
):
    """Get recommended text resources for a specific user"""
    try:
        target_user_uuid = UUID(user_id)
        
        # Verify tutor has access to this user
        if current_user.type == UserType.TUTOR:
            mapping = db.query(StudentTutorMapping).filter(
                and_(
                    StudentTutorMapping.student_id == target_user_uuid,
                    StudentTutorMapping.tutor_id == current_user.id
                )
            ).first()
            
            if not mapping:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this user"
                )
        
        # Get user's recent activities to understand their learning patterns
        recent_history = db.query(UserHistory).filter(
            UserHistory.user_id == target_user_uuid,
            UserHistory.action_type == ActionType.TEXT
        ).order_by(UserHistory.action_time.desc()).limit(20).all()
        
        # Get high-rated text resources that the user hasn't interacted with
        interacted_resource_ids = [h.resource_id for h in recent_history if h.resource_id]
        
        recommendations_query = db.query(TextResources).filter(
            TextResources.rating >= 3,
            or_(
                TextResources.user_id != target_user_uuid,
                TextResources.user_id.is_(None)  # Public resources
            )
        )
        
        if interacted_resource_ids:
            recommendations_query = recommendations_query.filter(
                ~TextResources.id.in_(interacted_resource_ids)
            )
        
        recommendations = recommendations_query.order_by(
            TextResources.rating.desc(),
            TextResources.impressions.desc()
        ).limit(10).all()
        
        return {
            "user_id": user_id,
            "recommendations": [
                {
                    "id": str(resource.id),
                    "type": resource.type.value,
                    "content": resource.content,
                    "description": resource.description,
                    "rating": resource.rating,
                    "impressions": resource.impressions,
                    "examples": resource.examples or [],
                    "reason": f"Highly rated {resource.type.value.lower()} resource"
                }
                for resource in recommendations
            ]
        }
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating recommendations: {str(e)}"
        )