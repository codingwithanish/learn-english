from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.models import LoginType, UserType, UserPlan, UserStatus


class GoogleAuthRequest(BaseModel):
    code: Optional[str] = None
    id_token: Optional[str] = None


class InstagramAuthRequest(BaseModel):
    code: str


class UserResponse(BaseModel):
    id: str
    name: str
    user_email: Optional[str]
    profession: Optional[str]
    communication_level: Optional[str]
    targetting: Optional[str]
    mobile: Optional[str]
    type: UserType
    plan: UserPlan
    status: UserStatus
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    expires_in: int
    user: UserResponse