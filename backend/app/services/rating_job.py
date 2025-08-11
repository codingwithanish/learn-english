from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.models.models import TextResources, TutorRatings, UserHistory, ActionType
from app.workers.tasks import calculate_rating


class RatingService:
    """Service for managing resource ratings"""
    
    @staticmethod
    def calculate_text_resource_rating(resource: TextResources, db: Session) -> float:
        """
        Calculate rating for a text resource based on multiple factors:
        - Recent pickups (40% weight)
        - Tutor average rating (40% weight)  
        - Total impressions (20% weight)
        """
        
        # Factor 1: Recent pickups (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_pickups = db.query(UserHistory).filter(
            UserHistory.resource_id == resource.id,
            UserHistory.action_type == ActionType.TEXT,
            UserHistory.action_time >= thirty_days_ago
        ).count()
        
        # Scale recent pickups to 0-5 range
        recent_pickups_score = min(recent_pickups / 5.0, 5.0)
        
        # Factor 2: Tutor ratings
        tutor_ratings = db.query(TutorRatings).filter(
            TutorRatings.resource_id == resource.id,
            TutorRatings.resource_type == ActionType.TEXT
        ).all()
        
        if tutor_ratings:
            avg_tutor_rating = sum(r.rating for r in tutor_ratings) / len(tutor_ratings)
        else:
            # Default rating if no tutor ratings
            avg_tutor_rating = 3.0
        
        # Factor 3: Total impressions
        # Scale impressions to 0-5 range (assuming 50+ impressions = max score)
        impressions_score = min(resource.impressions / 10.0, 5.0)
        
        # Calculate weighted average
        final_rating = (
            recent_pickups_score * 0.4 +
            avg_tutor_rating * 0.4 +
            impressions_score * 0.2
        )
        
        return min(round(final_rating, 1), 5.0)
    
    @staticmethod
    def update_resource_rating(resource_id: str, resource_type: str = "text"):
        """Queue a rating calculation task"""
        try:
            task = calculate_rating.delay(resource_id, resource_type)
            return task.id
        except Exception as e:
            print(f"Failed to queue rating calculation: {e}")
            return None
    
    @staticmethod
    def get_rating_breakdown(resource: TextResources, db: Session) -> Dict[str, Any]:
        """Get detailed breakdown of how a rating was calculated"""
        
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_pickups = db.query(UserHistory).filter(
            UserHistory.resource_id == resource.id,
            UserHistory.action_type == ActionType.TEXT,
            UserHistory.action_time >= thirty_days_ago
        ).count()
        
        tutor_ratings = db.query(TutorRatings).filter(
            TutorRatings.resource_id == resource.id,
            TutorRatings.resource_type == ActionType.TEXT
        ).all()
        
        recent_pickups_score = min(recent_pickups / 5.0, 5.0)
        avg_tutor_rating = (
            sum(r.rating for r in tutor_ratings) / len(tutor_ratings)
            if tutor_ratings else 3.0
        )
        impressions_score = min(resource.impressions / 10.0, 5.0)
        
        return {
            "current_rating": resource.rating,
            "components": {
                "recent_pickups": {
                    "score": recent_pickups_score,
                    "weight": 0.4,
                    "weighted_score": recent_pickups_score * 0.4,
                    "raw_data": {
                        "pickup_count": recent_pickups,
                        "period_days": 30
                    }
                },
                "tutor_ratings": {
                    "score": avg_tutor_rating,
                    "weight": 0.4,
                    "weighted_score": avg_tutor_rating * 0.4,
                    "raw_data": {
                        "rating_count": len(tutor_ratings),
                        "average_rating": avg_tutor_rating,
                        "individual_ratings": [r.rating for r in tutor_ratings]
                    }
                },
                "impressions": {
                    "score": impressions_score,
                    "weight": 0.2,
                    "weighted_score": impressions_score * 0.2,
                    "raw_data": {
                        "total_impressions": resource.impressions
                    }
                }
            },
            "calculated_rating": (
                recent_pickups_score * 0.4 +
                avg_tutor_rating * 0.4 +
                impressions_score * 0.2
            )
        }
    
    @staticmethod
    def bulk_update_ratings(resource_ids: List[str], resource_type: str = "text") -> List[str]:
        """Queue rating calculations for multiple resources"""
        task_ids = []
        
        for resource_id in resource_ids:
            try:
                task = calculate_rating.delay(resource_id, resource_type)
                task_ids.append(task.id)
            except Exception as e:
                print(f"Failed to queue rating for {resource_id}: {e}")
                continue
        
        return task_ids