# Learn English Application

A comprehensive web-based platform for improving English communication skills with interactive vocabulary, phrase, and grammar learning, plus real-time speaking practice with AI-powered feedback.

## 🚀 Quick Start

Get the application running in under 5 minutes with Docker:

```bash
# 1. Clone the repository
git clone <repository-url>
cd learn-english

# 2. Set up environment variables
cp .env.docker .env
# Edit .env with your API keys (at minimum, add your OpenAI API key)

# 3. Start all services
docker-compose up -d

# 4. Open in your browser
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

That's it! The application is now running with all services including database, Redis, background workers, and development tools.

### 📁 Project Files Overview

After cloning, you'll have these important configuration files:

```
learn-english/
├── .env.docker              # Docker environment template
├── .env.example              # General environment template  
├── .gitignore                # Git ignore rules (all technologies)
├── docker-compose.yml        # Docker services configuration
├── OAUTH_SETUP.md           # Google/Instagram login guide
├── README.md                # This documentation
├── backend/
│   ├── .env.example         # Backend environment template
│   └── requirements.txt     # Python dependencies
└── frontend/
    ├── .env.example         # Frontend environment template
    ├── package.json         # Node.js dependencies
    └── package-lock.json    # Dependency lock file
```

## 📖 Table of Contents

- [🚀 Quick Start](#-quick-start)
- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Technology Stack](#️-technology-stack)
- [💾 Database Schema](#-database-schema)
- [🔌 API Endpoints](#-api-endpoints)
- [📋 Getting Started](#-getting-started)
  - [Docker Setup (Recommended)](#quick-start-with-docker-recommended)
  - [Manual Installation](#manual-installation-alternative)
- [🔐 OAuth Setup Guide](./OAUTH_SETUP.md) - Google & Instagram Login
- [🎯 Key Features Implementation](#-key-features-implementation)
- [🔧 Troubleshooting](#-troubleshooting)
- [🚀 Production Deployment](#-production-deployment)
- [🤝 Contributing](#-contributing)

## ✨ Features

### 🎯 Core Functionality
- **Text Processing**: Vocabulary, phrases, and grammar learning with NLP-powered analysis
- **Speaking Practice**: Real-time speaking sessions with WebSocket-based audio streaming
- **AI Evaluation**: Automated speech evaluation with grammar, vocabulary, and pronunciation feedback
- **Progress Tracking**: Comprehensive user history and learning analytics
- **Tutor Portal**: Dedicated dashboard for tutors to monitor student progress

### 🔐 Authentication & Roles
- **Multi-provider OAuth**: Google and Instagram social login
- **Role-based Access**: Student, Tutor, and Admin roles with appropriate permissions
- **JWT Security**: Secure token-based authentication with refresh capabilities

### 🎨 User Experience
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Features**: WebSocket connections for live speaking sessions
- **Interactive Components**: Modern React components with smooth animations
- **Accessibility**: WCAG-compliant design with keyboard navigation support

## 🏗️ Architecture

### Backend (Python FastAPI)
```
backend/
├── app/
│   ├── main.py                 # FastAPI app entry point
│   ├── core/
│   │   ├── config.py          # Application configuration
│   │   └── security.py        # JWT authentication & authorization
│   ├── models/
│   │   └── models.py          # SQLAlchemy database models
│   ├── api/                   # REST API endpoints
│   │   ├── auth.py           # Authentication endpoints
│   │   ├── text.py           # Text processing & search
│   │   ├── speak.py          # Speaking session management
│   │   ├── tutor.py          # Tutor-specific endpoints
│   │   └── history.py        # User history & favorites
│   ├── ws/
│   │   └── speak_ws.py       # WebSocket handler for real-time speaking
│   ├── services/             # Business logic services
│   │   ├── nlp_service.py    # NLP processing & evaluation
│   │   ├── stt_service.py    # Speech-to-Text integration
│   │   ├── tts_service.py    # Text-to-Speech synthesis
│   │   └── rating_job.py     # Rating calculation service
│   ├── workers/              # Background task processing
│   │   ├── celery_app.py     # Celery configuration
│   │   └── tasks.py          # Background tasks (audio processing, etc.)
│   └── db/
│       ├── session.py        # Database session management
│       └── alembic/          # Database migrations
├── requirements.txt
└── .env.example
```

### Frontend (React)
```
frontend/
├── src/
│   ├── components/
│   │   ├── AppHeader/         # Global navigation header
│   │   ├── SearchBar/         # Smart search component
│   │   ├── Card/              # Resource display cards
│   │   ├── ModalDetail/       # Modal dialog component
│   │   └── Speak/             # Speaking session components
│   │       ├── SpeakSession.jsx    # Main speaking interface
│   │       ├── WSClient.js         # WebSocket client wrapper
│   │       └── MediaRecorderHook.js # Audio recording hook
│   ├── pages/
│   │   ├── Home.jsx          # Main dashboard
│   │   ├── Login.jsx         # Authentication page
│   │   ├── Speak.jsx         # Speaking practice dashboard
│   │   ├── Profile.jsx       # User profile management
│   │   └── TutorPortal/      # Tutor-specific pages
│   ├── services/             # API integration
│   │   ├── api.js           # Axios configuration
│   │   ├── auth.js          # Authentication service
│   │   ├── textService.js   # Text processing API
│   │   ├── speakService.js  # Speaking session API
│   │   └── tutorService.js  # Tutor portal API
│   ├── store/
│   │   └── authStore.js     # Authentication state management
│   └── hooks/
│       └── useDebounce.js   # Debouncing utility hook
├── package.json
└── .env.example
```

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Cache/Queue**: Redis for caching and Celery task queue
- **WebSockets**: Native FastAPI WebSocket support
- **Authentication**: JWT with OAuth2 social providers
- **Audio Processing**: OpenAI Whisper for STT
- **Text Processing**: OpenAI GPT for NLP evaluation
- **File Storage**: AWS S3 for audio files
- **TTS**: Amazon Polly for feedback audio

### Frontend
- **Framework**: React 18 with functional components
- **Routing**: React Router v6
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Context + useReducer
- **HTTP Client**: Axios with interceptors
- **WebSocket**: Native WebSocket API with reconnection
- **Audio**: MediaRecorder API for audio capture
- **Icons**: Heroicons

### Infrastructure
- **Containerization**: Docker & Docker Compose for development and production
- **Database Migrations**: Alembic with automatic schema management
- **Background Jobs**: Celery with Redis broker for async task processing
- **Environment Management**: python-dotenv with template configurations
- **API Documentation**: FastAPI automatic OpenAPI/Swagger documentation
- **Development Tools**: pgAdmin (database UI), Redis Commander (cache UI)
- **Process Management**: Multi-container orchestration with health checks

## 💾 Database Schema

### Core Tables
- **user_details**: User profiles and authentication data
- **text_resources**: Vocabulary, phrases, and grammar content
- **speak_resources**: Speaking session records and evaluations
- **user_history**: Activity tracking and learning progress
- **student_tutor_mapping**: Tutor-student relationships
- **user_favorites**: Bookmarked resources
- **tutor_ratings**: Tutor feedback and ratings

## 🔌 API Endpoints

### Authentication
```
POST /auth/google          # Google OAuth login
POST /auth/instagram       # Instagram OAuth login
```

### Text Processing
```
POST /api/process-text     # Process and analyze text queries
GET  /api/search           # Search resources with filters
GET  /api/history          # User activity history
POST /api/favorites        # Manage favorite resources
```

### Speaking Practice
```
WS   /ws/speak            # WebSocket for real-time speaking sessions
GET  /api/speakup/{id}    # Retrieve speaking session details
GET  /api/speakup         # List user's speaking sessions
```

### Tutor Portal
```
GET  /api/tutor/students           # List assigned students
GET  /api/tutor/student/{id}       # Student details and analytics
GET  /api/tutor/recommendation/{id} # Recommended resources for student
```

## 📋 Getting Started

### Quick Start with Docker (Recommended)

The easiest way to get the Learn English application running is using Docker Compose:

#### Prerequisites
- Docker Desktop installed and running
- Git (to clone the repository)

#### Setup Steps

1. **Clone the repository**:
```bash
git clone <repository-url>
cd learn-english
```

2. **Configure environment variables**:
```bash
# Copy the Docker environment template
cp .env.docker .env

# Edit .env with your API keys and configuration
nano .env  # or use your preferred editor
```

> 💡 **Environment Templates Available:**
> - `.env.docker` - Docker-optimized template (recommended)
> - `.env.example` - General template for manual setup
> - `backend/.env.example` - Backend-specific variables
> - `frontend/.env.example` - Frontend-specific variables

Required environment variables:
```bash
# API Keys (required for full functionality)
OPENAI_API_KEY=your-openai-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AWS (optional - for production features)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET=learn-english-audio

# Instagram OAuth (optional)
INSTAGRAM_CLIENT_ID=your-instagram-client-id
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret
```

> 📋 **Need help setting up OAuth?** See our comprehensive [OAuth Setup Guide](./OAUTH_SETUP.md) for step-by-step instructions to configure Google and Instagram login for both development and production environments.

3. **Start all services**:
```bash
docker-compose up -d
```

4. **Access the application**:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database Admin** (pgAdmin): http://localhost:5050
- **Redis Commander**: http://localhost:8081

#### Docker Services Overview

| Service | Container Name | Port | Description |
|---------|----------------|------|-------------|
| Frontend | learn-english-frontend | 3000 | React development server |
| Backend | learn-english-backend | 8000 | FastAPI server with auto-reload |
| Database | learn-english-postgres | 5432 | PostgreSQL 15 with persistent data |
| Cache/Queue | learn-english-redis | 6379 | Redis for caching and task queue |
| Worker | learn-english-celery-worker | - | Background task processing |
| Scheduler | learn-english-celery-beat | - | Scheduled task management |
| DB Admin | learn-english-pgadmin | 5050 | Database management interface |
| Redis UI | learn-english-redis-commander | 8081 | Redis monitoring interface |

#### Docker Management Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Rebuild containers (after code changes)
docker-compose build --no-cache
docker-compose up -d

# Reset database (removes all data)
docker-compose down -v
docker-compose up -d
```

#### Development with Docker

The Docker setup is configured for development with:
- **Hot reloading**: Both frontend and backend auto-reload on code changes
- **Volume mounting**: Local code is mounted into containers
- **Debug support**: Compatible with VSCode debugging (see `.vscode/launch.json`)

### Manual Installation (Alternative)

If you prefer to run the services manually without Docker:

#### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Redis 6+
- AWS Account (for S3 and Polly)
- OpenAI API Key
- Google OAuth credentials

#### Backend Setup

1. **Navigate to backend directory**:
```bash
cd backend
```

2. **Create virtual environment and install dependencies**:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

3. **Configure environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up database**:
```bash
# Create PostgreSQL database
createdb learn_english

# Run migrations
alembic upgrade head

# Seed sample data (optional)
python -m app.utils.seed_data
```

5. **Start the backend server**:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

6. **Start Celery worker (separate terminal)**:
```bash
celery -A app.workers.celery_app worker --loglevel=info
```

7. **Start Celery beat scheduler (separate terminal)**:
```bash
celery -A app.workers.celery_app beat --loglevel=info
```

#### Frontend Setup

1. **Navigate to frontend directory**:
```bash
cd frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the development server**:
```bash
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 🎯 Key Features Implementation

### Real-time Speaking Sessions
- WebSocket connection for low-latency audio streaming
- Chunked audio processing for real-time feedback
- Session state management with automatic cleanup
- Reconnection logic with exponential backoff

### NLP-Powered Text Analysis
- Automatic detection of vocabulary, phrases, and grammar
- Context-aware corrections and suggestions
- Example generation for learning reinforcement
- Similarity matching for existing resources

### Audio Processing Pipeline
1. Client captures audio using MediaRecorder API
2. Audio chunks sent via WebSocket in base64 format
3. Server processes with OpenAI Whisper for transcription
4. NLP evaluation generates detailed feedback
5. Amazon Polly synthesizes feedback audio
6. Results stored and delivered to client

### Rating Algorithm
Resources are rated using weighted factors:
- Recent pickups (40%): Usage in last 30 days
- Tutor ratings (40%): Average tutor feedback scores
- Impressions (20%): Total view count

### Security Features
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Request rate limiting
- Input validation and sanitization
- Secure WebSocket authentication
- CORS configuration for cross-origin requests

## 🔧 Troubleshooting

### Docker Issues

#### Containers not starting
```bash
# Check container status
docker-compose ps

# View logs for failing service
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]
```

#### Database connection issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Reset database
docker-compose down
docker volume rm learn-english_postgres_data
docker-compose up -d
```

#### Frontend not loading
```bash
# Rebuild frontend container
docker-compose build frontend --no-cache
docker-compose up -d frontend

# Check for port conflicts
netstat -an | grep 3000
```

#### Celery worker issues
```bash
# Check worker status
docker-compose logs celery-worker

# Restart background services
docker-compose restart celery-worker celery-beat
```

### Common Issues

#### Port Already in Use
If you get port conflicts:
```bash
# Find process using the port
lsof -i :3000  # or :8000, :5432, etc.

# Kill the process or change ports in docker-compose.yml
```

#### Permission Issues (Linux/Mac)
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

#### Memory Issues
```bash
# Increase Docker memory limit in Docker Desktop settings
# Or reduce service memory usage in docker-compose.yml
```

### Development Tips

#### VSCode Integration
1. Install recommended extensions when prompted
2. Use **Ctrl+Shift+P** → **Tasks: Run Task** for common operations
3. Debug with **F5** using the configured launch profiles

#### API Testing
- Use the built-in Swagger UI at http://localhost:8000/docs
- Test WebSocket connections with tools like WebSocket King
- Monitor database with pgAdmin at http://localhost:5050

#### OAuth Authentication Issues
- For Google/Instagram login setup problems, see the [OAuth Setup Guide](./OAUTH_SETUP.md)
- Check redirect URI configuration in provider consoles
- Verify environment variables are set correctly

## 🚀 Production Deployment

### Docker Production Setup

For production deployment, create a separate `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - ENV=production
    command: gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
    
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    command: nginx -g 'daemon off;'
```

### Environment Variables
Ensure all environment variables are properly configured:
- Database connection strings
- Redis configuration
- AWS credentials and S3 bucket
- OAuth client IDs and secrets
- JWT secret keys
- OpenAI API key

### Scaling Considerations
- **Load balancer**: Multiple backend instances behind nginx/haproxy
- **Database**: PostgreSQL with read replicas for analytics
- **Cache**: Redis Cluster for high availability
- **Storage**: AWS S3 with CloudFront CDN
- **Monitoring**: Prometheus + Grafana for metrics
- **Logging**: ELK Stack for centralized logging

### Security Checklist
- [ ] Use HTTPS/TLS certificates
- [ ] Configure CORS properly
- [ ] Set secure JWT secrets
- [ ] Enable rate limiting
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Database access restrictions
- [ ] API key rotation

### Monitoring
- Health check endpoints: `/healthz`, `/metrics`
- Structured JSON logging with request IDs
- Performance metrics for API response times
- WebSocket connection monitoring
- Background job success/failure tracking
- Database query performance monitoring

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Copy environment templates: `cp .env.docker .env`
5. Start development: `docker-compose up -d`

### Code Standards
1. **Environment Variables**: Never commit `.env` files or real credentials
2. **Dependencies**: Update `requirements.txt` (Python) and `package.json` (Node.js)
3. **Testing**: Write tests for new features and ensure existing tests pass
4. **Documentation**: Update README.md and relevant docs for new features
5. **Linting**: Ensure code passes linting and type checking

### Submission
1. Test your changes thoroughly
2. Update documentation if needed
3. Commit with clear, descriptive messages
4. Push to your fork: `git push origin feature/your-feature-name`
5. Submit a pull request with detailed description

### What's Ignored
The `.gitignore` file covers:
- Environment variables (`.env*` files)
- Dependencies (`node_modules/`, `__pycache__/`)
- Build outputs (`build/`, `dist/`)
- IDE files (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)
- Log files (`*.log`)
- Database files (`*.sqlite`, `*.db`)

## License

This project is licensed under the MIT License - see the LICENSE file for details.