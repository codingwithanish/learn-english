import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, JSON, Enum, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()


class LoginType(enum.Enum):
    GOOGLE = "GOOGLE"
    FACEBOOK = "FACEBOOK"
    INSTAGRAM = "INSTAGRAM"


class UserType(enum.Enum):
    TUTOR = "TUTOR"
    ADMIN = "ADMIN"
    STUDENT = "STUDENT"


class UserPlan(enum.Enum):
    FREE = "FREE"
    PREMIUM = "PREMIUM"


class UserStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    BLOCKED = "BLOCKED"


class ResourceType(enum.Enum):
    VOCABULARY = "VOCABULARY"
    PHRASE = "PHRASE"
    GRAMMAR = "GRAMMAR"


class ResourceStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    BLOCKED = "BLOCKED"


class SpeakResourceStatus(enum.Enum):
    INITIATED = "INITIATED"
    COMPLETED = "COMPLETED"


class SpeakResourceType(enum.Enum):
    SUBJECT_SPEAK = "SUBJECT_SPEAK"
    CONVERSATION = "CONVERSATION"


class InitiatedResourceType(enum.Enum):
    TUTOR = "TUTOR"
    STUDENT = "STUDENT"


class ActionType(enum.Enum):
    TEXT = "text"
    SPEAK = "speak"


class ReferenceTable(enum.Enum):
    TEXT_RESOURCES = "text_resources"
    SPEAK_RESOURCES = "speak_resources"


class ImpressionType(enum.Enum):
    NEW = "NEW"
    EXISTING = "EXISTING"


class UserDetails(Base):
    __tablename__ = "user_details"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    login_type = Column(Enum(LoginType), nullable=False)
    name = Column(String, nullable=False)
    user_email = Column(String, unique=True, nullable=True)
    profession = Column(String, nullable=True)
    communication_level = Column(String, nullable=True)
    targetting = Column(String, nullable=True)
    mobile = Column(String, nullable=True)
    start_date = Column(DateTime, nullable=False)
    type = Column(Enum(UserType), nullable=False)
    plan = Column(Enum(UserPlan), nullable=False)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)
    
    # Relationships
    text_resources = relationship("TextResources", back_populates="user")
    speak_resources = relationship("SpeakResources", back_populates="user")
    user_history = relationship("UserHistory", back_populates="user")
    student_mappings = relationship("StudentTutorMapping", foreign_keys="StudentTutorMapping.student_id", back_populates="student")
    tutor_mappings = relationship("StudentTutorMapping", foreign_keys="StudentTutorMapping.tutor_id", back_populates="tutor")
    user_favorites = relationship("UserFavorites", back_populates="user")
    tutor_ratings = relationship("TutorRatings", back_populates="tutor")


class TextResources(Base):
    __tablename__ = "text_resources"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_details.id"), nullable=True)
    type = Column(Enum(ResourceType), nullable=False)
    content = Column(Text, nullable=False)
    examples = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    is_favorate = Column(Boolean, default=False)  # Deprecated - use user_favorites
    impressions = Column(Integer, default=0)
    tutor_ratings = Column(JSON, nullable=True)  # Deprecated - use tutor_ratings table
    rating = Column(Integer, default=0)
    status = Column(Enum(ResourceStatus), default=ResourceStatus.ACTIVE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("UserDetails", back_populates="text_resources")


class SpeakResources(Base):
    __tablename__ = "speak_resources"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_details.id"), nullable=False)
    status = Column(Enum(SpeakResourceStatus), nullable=False)
    expiry = Column(DateTime, nullable=True)
    output_resource_location = Column(String, nullable=True)
    input_resource_location = Column(String, nullable=True)
    title = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    evaluation_result = Column(JSON, nullable=True)
    resource_config = Column(JSON, nullable=True)
    type = Column(Enum(SpeakResourceType), nullable=False)
    initiated_resource = Column(Enum(InitiatedResourceType), nullable=False)
    created_date = Column(DateTime, default=datetime.utcnow)
    completed_date = Column(DateTime, nullable=True)
    session_id = Column(String, nullable=True)
    
    # Relationships
    user = relationship("UserDetails", back_populates="speak_resources")


class UserHistory(Base):
    __tablename__ = "user_history"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_details.id"), nullable=False)
    action_time = Column(DateTime, default=datetime.utcnow)
    action_type = Column(Enum(ActionType), nullable=False)
    user_query = Column(Text, nullable=True)
    corrected_query = Column(Text, nullable=True)
    corrected_description = Column(Text, nullable=True)
    is_valid = Column(Boolean, default=True)
    reference_table = Column(Enum(ReferenceTable), nullable=True)
    type_of_impression = Column(Enum(ImpressionType), nullable=True)
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("UserDetails", back_populates="user_history")


class StudentTutorMapping(Base):
    __tablename__ = "student_tutor_mapping"
    
    id = Column(Integer, primary_key=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("user_details.id"), nullable=False)
    tutor_id = Column(UUID(as_uuid=True), ForeignKey("user_details.id"), nullable=False)
    joining_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student = relationship("UserDetails", foreign_keys=[student_id], back_populates="student_mappings")
    tutor = relationship("UserDetails", foreign_keys=[tutor_id], back_populates="tutor_mappings")


class UserFavorites(Base):
    __tablename__ = "user_favorites"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_details.id"), nullable=False)
    resource_id = Column(UUID(as_uuid=True), nullable=False)
    resource_type = Column(Enum(ActionType), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("UserDetails", back_populates="user_favorites")


class TutorRatings(Base):
    __tablename__ = "tutor_ratings"
    
    id = Column(Integer, primary_key=True)
    tutor_id = Column(UUID(as_uuid=True), ForeignKey("user_details.id"), nullable=False)
    resource_id = Column(UUID(as_uuid=True), nullable=False)
    resource_type = Column(Enum(ActionType), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tutor = relationship("UserDetails", back_populates="tutor_ratings")