from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from google.auth.transport import requests
from google.oauth2 import id_token
from typing import Dict, Any
import urllib.parse
import uuid

from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.models import UserDetails, LoginType, UserType, UserPlan, UserStatus
from app.schemas.auth import GoogleAuthRequest, InstagramAuthRequest, AuthResponse, UserResponse

router = APIRouter()


@router.get("/google")
async def google_oauth_redirect():
    """Redirect to Google OAuth authorization"""
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={urllib.parse.quote(settings.GOOGLE_REDIRECT_URI)}&"
        f"scope=openid email profile&"
        f"response_type=code&"
        f"access_type=offline&"
        f"prompt=consent"
    )
    return RedirectResponse(url=google_auth_url)


@router.get("/google/callback")
async def google_oauth_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    try:
        import requests as http_requests
        import json
        
        # Exchange code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        }
        
        print(f"DEBUG: Making token request with CLIENT_ID: {settings.GOOGLE_CLIENT_ID}")
        print(f"DEBUG: CLIENT_SECRET starts with: {settings.GOOGLE_CLIENT_SECRET[:10]}...")
        print(f"DEBUG: REDIRECT_URI: {settings.GOOGLE_REDIRECT_URI}")
        
        token_response = http_requests.post(token_url, data=token_data)
        
        if not token_response.ok:
            print(f"DEBUG: Token response status: {token_response.status_code}")
            print(f"DEBUG: Token response body: {token_response.text}")
        
        token_response.raise_for_status()
        tokens = token_response.json()
        
        # Verify and decode the ID token
        idinfo = id_token.verify_oauth2_token(
            tokens['id_token'], 
            requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )
        
        # Get user info from token
        email = idinfo.get('email')
        name = idinfo.get('name', email)
        google_id = idinfo.get('sub')
        
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
        
        # Prepare user data
        user_data = {
            "id": str(user.id),
            "name": user.name,
            "email": user.user_email,
            "type": user.type.value,
            "plan": user.plan.value,
            "status": user.status.value
        }
        
        # Redirect to frontend with tokens
        frontend_callback_url = (
            f"{settings.FRONTEND_URL}/oauth/callback?"
            f"token={access_token}&"
            f"user={urllib.parse.quote(json.dumps(user_data))}"
        )
        
        return RedirectResponse(url=frontend_callback_url)
        
    except Exception as e:
        # Redirect to frontend with error
        error_url = (
            f"{settings.FRONTEND_URL}/oauth/callback?"
            f"error={urllib.parse.quote(str(e))}"
        )
        return RedirectResponse(url=error_url)


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