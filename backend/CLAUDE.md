# Learn English Backend - Technical Context

## Overview

This is the FastAPI backend for the Learn English application, providing REST APIs, WebSocket endpoints, and background job processing for English language learning platform.

## Technology Stack

- **Framework**: FastAPI with async/await support
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Migrations**: Alembic for database schema management
- **Authentication**: JWT tokens with OAuth2 social providers
- **Background Jobs**: Celery with Redis as broker
- **External APIs**: OpenAI (GPT/Whisper), AWS S3, Google OAuth
- **WebSocket**: Native FastAPI WebSocket support for real-time communication
- **Audio Processing**: OpenAI Whisper for Speech-to-Text, AWS Polly for Text-to-Speech

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── core/
│   │   ├── config.py          # Environment configuration
│   │   └── security.py        # JWT authentication utilities
│   ├── models/
│   │   └── models.py          # SQLAlchemy database models
│   ├── api/                   # REST API endpoints
│   │   ├── auth.py           # Authentication endpoints
│   │   ├── text.py           # Text processing endpoints
│   │   ├── speak.py          # Speaking session REST endpoints
│   │   ├── tutor.py          # Tutor portal endpoints
│   │   └── history.py        # User history endpoints
│   ├── ws/                    # WebSocket handlers
│   │   └── speak_ws.py       # Real-time speaking WebSocket
│   ├── services/              # Business logic services
│   │   ├── nlp_service.py    # NLP processing with OpenAI
│   │   ├── stt_service.py    # Speech-to-Text service
│   │   ├── tts_service.py    # Text-to-Speech service
│   │   └── rating_job.py     # Rating calculation service
│   ├── workers/               # Background task processing
│   │   ├── celery_app.py     # Celery configuration
│   │   └── tasks.py          # Async tasks for audio processing
│   ├── schemas/               # Pydantic request/response models
│   ├── db/
│   │   ├── session.py        # Database session management
│   │   └── alembic/          # Database migration files
│   └── utils/
│       └── seed_data.py      # Database seeding utilities
├── requirements.txt           # Python dependencies
├── alembic.ini               # Alembic configuration
└── Dockerfile                # Container configuration
```

## Database Models

### Core Entities

#### UserDetails
- Primary user table with OAuth authentication
- Roles: STUDENT, TUTOR, ADMIN
- Plans: FREE, PREMIUM
- Status tracking and profile information

#### TextResources
- Vocabulary, phrases, and grammar content
- User-generated and system content
- Rating system with tutor feedback
- JSON fields for examples and metadata

#### SpeakResources
- Speaking session records and evaluations
- Audio file locations in S3
- AI evaluation results with detailed feedback
- Session configuration and timing

#### UserHistory
- Activity tracking for all user interactions
- Links to both text and speak resources
- Impression tracking and validation status

### Database Features
- UUID primary keys for scalability
- Enum types for status and type fields
- JSON columns for flexible metadata storage
- Foreign key relationships with proper cascading
- Indexes on frequently queried fields

## API Architecture

### Authentication Flow
1. OAuth redirect to Google/Instagram
2. Provider callback with authorization code
3. Token exchange and user creation/lookup
4. JWT token generation with user claims
5. Token validation on protected endpoints

### REST Endpoints

#### Authentication (`/auth`)
- Google OAuth flow with callback handling
- Instagram OAuth (placeholder implementation)
- JWT token creation and validation

#### Text Processing (`/api`)
- `POST /process-text`: NLP analysis of user queries
- `GET /search`: Resource search with filters and pagination
- `GET /history`: User activity history with filters

#### Speaking Practice (`/api/speakup`)
- Session management REST endpoints
- Resource retrieval and status tracking
- Integration with WebSocket sessions

#### Tutor Portal (`/api/tutor`)
- Student list and details
- Progress analytics and recommendations
- Feedback and rating systems

### WebSocket Protocol (`/ws/speak`)

Real-time speaking session protocol:

#### Client → Server Messages
- `start`: Begin session with configuration
- `audio_chunk`: Streaming audio data (base64 or binary)
- `stop`: End session and trigger evaluation
- `ping`: Connection keepalive

#### Server → Client Messages
- `ack`: Session started confirmation
- `interim_transcript`: Real-time transcription
- `processing`: Evaluation started notification
- `final`: Complete evaluation results with feedback
- `error`: Error notifications

## Services Architecture

### NLPService (`services/nlp_service.py`)
- OpenAI GPT integration for text analysis
- Query type detection (vocabulary/phrase/grammar)
- Content generation with examples and explanations
- Speech evaluation with detailed feedback

### Audio Processing Services
- **STT**: Speech-to-text transcription
- **TTS**: Text-to-speech feedback generation
- **S3 Integration**: Audio file storage and retrieval with pre-signed URLs

### Background Workers

#### Celery Tasks (`workers/tasks.py`)
- Audio processing pipeline
- Rating calculation jobs
- Notification delivery
- Data synchronization tasks

#### Rating Algorithm
Weighted scoring system:
- Recent usage (40%): Activity in last 30 days
- Tutor ratings (40%): Average feedback scores
- Impressions (20%): Total view count

## Configuration

### Environment Variables (`core/config.py`)
```python
# Database
DATABASE_URL: PostgreSQL connection string

# Redis
REDIS_URL: Cache and task queue connection

# JWT Authentication
JWT_SECRET_KEY: Token signing key
JWT_ALGORITHM: HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES: 60

# OAuth Providers
GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET
INSTAGRAM_CLIENT_ID & INSTAGRAM_CLIENT_SECRET
GOOGLE_REDIRECT_URI: OAuth callback URL

# AWS Services
AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY
AWS_REGION: us-east-1
S3_BUCKET: Audio file storage

# External APIs
OPENAI_API_KEY: NLP and speech processing

# CORS
ALLOWED_HOSTS: Frontend URLs for CORS policy

# Celery
CELERY_BROKER_URL & CELERY_RESULT_BACKEND: Redis URLs
```

## Development Workflow

### Database Management
```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Seed initial data
python -m app.utils.seed_data
```

### Running Services
```bash
# Main FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Celery worker
celery -A app.workers.celery_app worker --loglevel=info

# Celery beat scheduler
celery -A app.workers.celery_app beat --loglevel=info
```

### API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

## Security Implementation

### JWT Authentication
- Secure token generation and validation
- User role and permission checking
- Token expiration and refresh handling
- Protected endpoint decorators

### Input Validation
- Pydantic schemas for request validation
- SQL injection prevention with SQLAlchemy
- File upload size and type restrictions
- Rate limiting on API endpoints

### Data Protection
- Environment variable configuration
- Secure OAuth token handling
- S3 pre-signed URLs for file access
- User data anonymization support

## Testing Strategy

### Test Structure
- Unit tests for individual services
- Integration tests for API endpoints
- WebSocket connection testing
- Background job testing with mocked dependencies

### Test Database
- Separate test database configuration
- Fixture-based test data management
- Async test support with pytest-asyncio

## Deployment Considerations

### Docker Configuration
- Multi-stage build for production optimization
- Health check endpoints for container orchestration
- Environment-based configuration
- Volume mounts for development

### Production Settings
- Gunicorn WSGI server with Uvicorn workers
- PostgreSQL with connection pooling
- Redis cluster for high availability
- AWS S3 with CloudFront CDN
- Monitoring with health check endpoints

## Performance Optimization

### Database
- Proper indexing strategy
- Query optimization with SQLAlchemy
- Connection pooling configuration
- Read replica support for analytics

### Caching
- Redis caching for frequent queries
- Session state management
- Task result caching

### Background Processing
- Celery worker scaling
- Task prioritization and routing
- Error handling and retry logic
- Monitoring and alerting

## Monitoring and Logging

### Health Checks
- `/healthz`: Application health status
- `/metrics`: Prometheus-compatible metrics
- Database connection monitoring
- External service dependency checks

### Logging
- Structured JSON logging
- Request ID tracking
- Error logging with context
- Performance metrics collection

## Integration Points

### External Services
- **OpenAI API**: GPT for text analysis, Whisper for STT
- **AWS Services**: S3 for file storage, Polly for TTS
- **Google OAuth**: User authentication
- **Instagram API**: Alternative authentication (planned)

### Internal Communication
- FastAPI ↔ PostgreSQL: Primary data operations
- FastAPI ↔ Redis: Caching and task queuing
- FastAPI ↔ Celery: Background job coordination
- WebSocket ↔ Client: Real-time communication