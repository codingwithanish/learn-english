# Learn English Application - Project Context

## Project Overview

Learn English is a comprehensive web-based platform for improving English communication skills. It provides interactive vocabulary, phrase, and grammar learning, plus real-time speaking practice with AI-powered feedback.

### Core Features
- **Text Processing**: Vocabulary, phrases, and grammar learning with NLP-powered analysis
- **Speaking Practice**: Real-time speaking sessions with WebSocket-based audio streaming
- **AI Evaluation**: Automated speech evaluation with grammar, vocabulary, and pronunciation feedback
- **Progress Tracking**: Comprehensive user history and learning analytics
- **Tutor Portal**: Dedicated dashboard for tutors to monitor student progress
- **Multi-provider OAuth**: Google and Instagram social login
- **Role-based Access**: Student, Tutor, and Admin roles

## Technology Stack

### Backend (FastAPI + Python)
- **Framework**: FastAPI with async/await
- **Database**: PostgreSQL with SQLAlchemy ORM and Alembic migrations
- **Cache/Queue**: Redis for caching and Celery task queue
- **Authentication**: JWT with OAuth2 social providers (Google, Instagram)
- **Audio Processing**: OpenAI Whisper for Speech-to-Text
- **Text Processing**: OpenAI GPT for NLP evaluation and text analysis
- **File Storage**: AWS S3 for audio files with pre-signed URLs
- **TTS**: Amazon Polly for feedback audio generation
- **Background Jobs**: Celery workers for audio processing and rating calculations

### Frontend (React 18 + TypeScript)
- **Framework**: React 18 with functional components and hooks, full TypeScript implementation
- **Language**: TypeScript with strict type checking and comprehensive type definitions
- **Routing**: React Router v6 with typed route parameters
- **Styling**: Tailwind CSS with custom components and design system
- **State Management**: React Context + useReducer pattern with full TypeScript typing
- **HTTP Client**: Axios with JWT token interceptors and typed API responses
- **WebSocket**: Native WebSocket API for real-time speaking sessions with typed message protocols
- **Audio**: MediaRecorder API for audio capture with TypeScript interfaces
- **UI Components**: Headless UI and Heroicons with typed component props

### Infrastructure
- **Containerization**: Docker & Docker Compose for development
- **Development Tools**: pgAdmin for database management, Redis Commander
- **Process Management**: Multi-container orchestration with health checks

## Architecture

```
Frontend (React + TypeScript) ←→ Backend (FastAPI) ←→ Database (PostgreSQL)
              ↓                           ↓                    ↓
          WebSocket                Celery Workers         Redis Cache
       (Real-time TS)           (Background Jobs)      (Sessions/Queue)
              ↓                           ↓
      Audio Capture (TS)          Audio Processing
                                  (STT/TTS/S3)
```

## Database Schema

### Key Tables
- **user_details**: User profiles, authentication, roles (STUDENT/TUTOR/ADMIN)
- **text_resources**: Vocabulary, phrases, grammar content with ratings
- **speak_resources**: Speaking session records and AI evaluations
- **user_history**: Activity tracking and learning progress
- **student_tutor_mapping**: Tutor-student relationships
- **user_favorites**: Bookmarked resources
- **tutor_ratings**: Tutor feedback system

### User Roles
- **STUDENT**: Can search, learn, practice speaking
- **TUTOR**: Can monitor assigned students, provide feedback
- **ADMIN**: Full system access and user management

## Project Structure

```
learn-english/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI application entry
│   │   ├── api/            # REST API endpoints
│   │   ├── ws/             # WebSocket handlers
│   │   ├── core/           # Configuration and security
│   │   ├── models/         # SQLAlchemy database models
│   │   ├── services/       # Business logic (NLP, STT, TTS)
│   │   ├── workers/        # Celery background tasks
│   │   └── db/             # Database session and migrations
│   └── requirements.txt    # Python dependencies
├── frontend/               # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components (TypeScript)
│   │   ├── pages/          # Route components (TypeScript)
│   │   ├── services/       # API integration with typed responses
│   │   ├── store/          # State management with TypeScript
│   │   ├── hooks/          # Custom React hooks (TypeScript)
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions and helpers
│   ├── package.json        # Node.js dependencies
│   └── tsconfig.json       # TypeScript configuration
├── docker-compose.yml      # Development environment
└── README.md              # Comprehensive setup guide
```

## Key Workflows

### Text Learning Flow
1. User enters text query in search bar
2. Backend processes with NLP (OpenAI GPT) to detect type (vocabulary/phrase/grammar)
3. System searches existing resources or generates new explanation
4. Results displayed as interactive cards with examples
5. User activity tracked in history

### Speaking Practice Flow
1. User initiates speaking session via WebSocket
2. Real-time audio streaming and transcription
3. AI evaluation for grammar, vocabulary, pronunciation
4. Feedback generation with TTS audio
5. Results stored and available for tutor review

### Tutor Portal Flow
1. Tutors view assigned students list
2. Access student progress and speaking evaluations
3. Provide feedback and ratings
4. Recommend learning resources

## API Endpoints

### Authentication
- `GET /auth/google` - Google OAuth redirect
- `GET /auth/google/callback` - OAuth callback handler
- `POST /auth/google` - Direct token authentication

### Text Processing
- `POST /api/process-text` - Analyze and process text queries
- `GET /api/search` - Search resources with filters
- `GET /api/history` - User learning history

### Speaking Practice
- `WS /ws/speak` - WebSocket for real-time speaking sessions
- `GET /api/speakup/{id}` - Retrieve speaking session details
- `GET /api/speakup` - List user's speaking sessions

### Tutor Portal
- `GET /api/tutor/students` - List assigned students
- `GET /api/tutor/student/{id}` - Student details and analytics
- `GET /api/tutor/recommendation/{id}` - Recommended resources

## Environment Setup

### Quick Start (Docker)
```bash
# Clone and setup
git clone <repository-url>
cd learn-english
cp .env.docker .env

# Start all services
docker-compose up -d

# Access points
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Required Environment Variables
- `OPENAI_API_KEY`: For NLP text processing and evaluation
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: OAuth authentication
- `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`: S3 audio storage
- `DATABASE_URL`: PostgreSQL connection
- `REDIS_URL`: Redis cache and task queue

## Development Notes

### Code Conventions
- **Backend**: FastAPI with async/await, Pydantic schemas, SQLAlchemy models
- **Frontend**: React functional components with TypeScript, custom hooks, strict typing
- **TypeScript**: Comprehensive type system with interfaces, enums, and utility types
- **Database**: UUID primary keys, enum types for status fields
- **API**: RESTful design with JWT authentication and typed responses
- **WebSocket**: Binary audio frames with TypeScript message protocols
- **Styling**: Tailwind CSS with consistent design system and typed theme

### Testing Strategy
- Unit tests for business logic services
- Integration tests for API endpoints
- E2E tests for WebSocket audio flows
- Load testing for concurrent speaking sessions

### Security Features
- JWT-based authentication with role-based access control
- Input validation and sanitization
- Secure WebSocket authentication
- S3 pre-signed URLs for audio file access
- OAuth2 social login integration

## Recent Development Status

The project includes comprehensive documentation:
- **README.md**: Complete setup and development guide
- **OAUTH_SETUP.md**: OAuth provider configuration guide  
- **tech-spec.md**: Detailed technical specifications
- **implementation.md**: Implementation requirements

All core features are implemented including real-time speaking sessions, NLP-powered text analysis, tutor portal, and role-based authentication system.