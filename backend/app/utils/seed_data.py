import uuid
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.models import (
    UserDetails, TextResources, SpeakResources, StudentTutorMapping,
    LoginType, UserType, UserPlan, UserStatus, ResourceType, ResourceStatus,
    SpeakResourceStatus, SpeakResourceType, InitiatedResourceType
)

# Database connection
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def seed_sample_data():
    """Seed the database with sample data for development and testing"""
    db = SessionLocal()
    
    try:
        print("Seeding sample data...")
        
        # Create sample users
        admin_user = UserDetails(
            id=uuid.uuid4(),
            login_type=LoginType.GOOGLE,
            name="Admin User",
            user_email="admin@learnenglish.com",
            profession="Administrator",
            communication_level="Native",
            targetting="Platform Management",
            start_date=datetime.utcnow(),
            type=UserType.ADMIN,
            plan=UserPlan.PREMIUM,
            status=UserStatus.ACTIVE,
            created_at=datetime.utcnow()
        )
        
        tutor_user = UserDetails(
            id=uuid.uuid4(),
            login_type=LoginType.GOOGLE,
            name="Jane Smith",
            user_email="tutor@learnenglish.com",
            profession="English Teacher",
            communication_level="Native",
            targetting="Teaching English",
            start_date=datetime.utcnow(),
            type=UserType.TUTOR,
            plan=UserPlan.PREMIUM,
            status=UserStatus.ACTIVE,
            created_at=datetime.utcnow()
        )
        
        student_user1 = UserDetails(
            id=uuid.uuid4(),
            login_type=LoginType.GOOGLE,
            name="John Doe",
            user_email="student1@example.com",
            profession="Software Engineer",
            communication_level="Intermediate",
            targetting="Business Communication",
            start_date=datetime.utcnow(),
            type=UserType.STUDENT,
            plan=UserPlan.FREE,
            status=UserStatus.ACTIVE,
            created_at=datetime.utcnow()
        )
        
        student_user2 = UserDetails(
            id=uuid.uuid4(),
            login_type=LoginType.GOOGLE,
            name="Maria Garcia",
            user_email="student2@example.com",
            profession="Marketing Manager",
            communication_level="Upper Intermediate",
            targetting="Academic English",
            start_date=datetime.utcnow(),
            type=UserType.STUDENT,
            plan=UserPlan.PREMIUM,
            status=UserStatus.ACTIVE,
            created_at=datetime.utcnow()
        )
        
        # Add users to database
        users = [admin_user, tutor_user, student_user1, student_user2]
        for user in users:
            db.add(user)
        
        db.commit()
        print(f"Created {len(users)} sample users")
        
        # Create student-tutor mappings
        mapping1 = StudentTutorMapping(
            student_id=student_user1.id,
            tutor_id=tutor_user.id,
            joining_date=date.today(),
            created_at=datetime.utcnow()
        )
        
        mapping2 = StudentTutorMapping(
            student_id=student_user2.id,
            tutor_id=tutor_user.id,
            joining_date=date.today(),
            created_at=datetime.utcnow()
        )
        
        db.add(mapping1)
        db.add(mapping2)
        db.commit()
        print("Created student-tutor mappings")
        
        # Create sample text resources
        text_resources = [
            {
                "type": ResourceType.VOCABULARY,
                "content": "serendipity",
                "description": "The occurrence and development of events by chance in a happy or beneficial way",
                "examples": [
                    "Finding this job was pure serendipity",
                    "Their meeting was a beautiful serendipity",
                    "Sometimes serendipity leads to great discoveries"
                ]
            },
            {
                "type": ResourceType.PHRASE,
                "content": "break the ice",
                "description": "To initiate conversation in a social setting; to make people feel more comfortable",
                "examples": [
                    "She told a joke to break the ice at the meeting",
                    "Small talk helps to break the ice with new colleagues",
                    "The host played music to break the ice at the party"
                ]
            },
            {
                "type": ResourceType.GRAMMAR,
                "content": "Present Perfect vs Past Simple",
                "description": "Present Perfect is used for actions that started in the past and continue to the present or have present relevance. Past Simple is for completed actions at specific times in the past.",
                "examples": [
                    "I have lived here for 5 years (still living here)",
                    "I lived in Paris for 2 years (no longer living there)",
                    "Have you ever been to Japan? (life experience)"
                ]
            },
            {
                "type": ResourceType.VOCABULARY,
                "content": "ubiquitous",
                "description": "Present, appearing, or found everywhere",
                "examples": [
                    "Smartphones have become ubiquitous in modern society",
                    "Coffee shops are ubiquitous in this city",
                    "Social media is ubiquitous among young people"
                ]
            },
            {
                "type": ResourceType.PHRASE,
                "content": "hit the nail on the head",
                "description": "To describe exactly what is causing a situation or problem",
                "examples": [
                    "You hit the nail on the head with your analysis",
                    "Her comment really hit the nail on the head",
                    "That explanation hits the nail on the head"
                ]
            }
        ]
        
        for resource_data in text_resources:
            resource = TextResources(
                id=uuid.uuid4(),
                user_id=None,  # Public resources
                type=resource_data["type"],
                content=resource_data["content"],
                description=resource_data["description"],
                examples=resource_data["examples"],
                impressions=0,
                rating=4,
                status=ResourceStatus.ACTIVE,
                created_at=datetime.utcnow()
            )
            db.add(resource)
        
        db.commit()
        print(f"Created {len(text_resources)} sample text resources")
        
        # Create sample speaking resources
        speak_resource1 = SpeakResources(
            id=uuid.uuid4(),
            user_id=student_user1.id,
            status=SpeakResourceStatus.COMPLETED,
            title="My Daily Routine",
            summary="Student spoke about their daily routine and work schedule",
            evaluation_result=[
                {
                    "criteria": "grammar",
                    "reference_sentence": "Overall grammar assessment",
                    "suggestion": "Good use of present tense. Consider using more time connectors like 'then', 'after that', 'finally'",
                    "examples": ["First I wake up, then I have breakfast, after that I go to work"]
                },
                {
                    "criteria": "vocabulary",
                    "reference_sentence": "Vocabulary usage evaluation", 
                    "suggestion": "Good basic vocabulary. Try using more descriptive adjectives",
                    "examples": ["Instead of 'good breakfast', try 'nutritious breakfast' or 'hearty breakfast'"]
                }
            ],
            resource_config={
                "subject": "My Daily Routine",
                "speak_time": 60,
                "type": "SUBJECT_SPEAK"
            },
            type=SpeakResourceType.SUBJECT_SPEAK,
            initiated_resource=InitiatedResourceType.STUDENT,
            created_date=datetime.utcnow(),
            completed_date=datetime.utcnow(),
            input_resource_location="s3://learn-english-audio/input/sample-input.wav",
            output_resource_location="s3://learn-english-audio/output/sample-feedback.mp3"
        )
        
        speak_resource2 = SpeakResources(
            id=uuid.uuid4(),
            user_id=student_user2.id,
            status=SpeakResourceStatus.INITIATED,
            title="Travel Experiences",
            resource_config={
                "subject": "Travel Experiences",
                "speak_time": 90,
                "type": "SUBJECT_SPEAK"
            },
            type=SpeakResourceType.SUBJECT_SPEAK,
            initiated_resource=InitiatedResourceType.TUTOR,
            created_date=datetime.utcnow()
        )
        
        db.add(speak_resource1)
        db.add(speak_resource2)
        db.commit()
        print("Created sample speaking resources")
        
        print("Sample data seeding completed successfully!")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_sample_data()