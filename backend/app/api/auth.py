from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from google.auth.transport import requests
from google.oauth2 import id_token
from typing import Dict, Any

from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.models import UserDetails, LoginType, UserType, UserPlan, UserStatus
from app.schemas.auth import GoogleAuthRequest, InstagramAuthRequest, AuthResponse, UserResponse

router = APIRouter()


@router.post("/google", response_model=AuthResponse)
async def google_auth(auth_request: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        if auth_request.id_token:
            # Verify the Google ID token
            idinfo = id_token.verify_oauth2_token(
                auth_request.id_token, 
                requests.Request(), 
                settings.GOOGLE_CLIENT_ID
            )
            
            # Get user info from token
            email = idinfo.get('email')
            name = idinfo.get('name', email)
            google_id = idinfo.get('sub')
            
        elif auth_request.code:
            # Handle OAuth code flow (requires additional implementation)
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="OAuth code flow not yet implemented"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either code or id_token must be provided"
            )
        
        # Check if user exists
        user = db.query(UserDetails).filter(UserDetails.user_email == email).first()
        
        if not user:
            # Create new user
            user = UserDetails(
                login_type=LoginType.GOOGLE,
                name=name,
                user_email=email,
                start_date=datetime.utcnow(),
                type=UserType.STUDENT,  # Default role
                plan=UserPlan.FREE,
                status=UserStatus.ACTIVE
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create access token
        token_data = {
            "sub": str(user.id),
            "email": user.user_email,
            "role": user.type.value
        }
        access_token = create_access_token(data=token_data)
        
        return AuthResponse(
            access_token=access_token,
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.from_orm(user)
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid Google token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )


@router.post("/instagram", response_model=AuthResponse)
async def instagram_auth(auth_request: InstagramAuthRequest, db: Session = Depends(get_db)):
    # Instagram OAuth implementation would go here
    # This is a placeholder for Instagram authentication
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Instagram authentication not yet implemented"
    )