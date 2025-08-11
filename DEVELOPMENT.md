# Development Guide

This guide provides instructions for setting up and debugging the Learn English application.

## Project Structure

```
learn-english/
├── backend/                 # Python FastAPI backend
├── frontend/               # React frontend
├── .vscode/               # VSCode configuration
├── learn-english.code-workspace
└── README.md
```

## Development Setup

### Prerequisites

Make sure you have the following installed:
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Redis 6+
- VSCode (recommended)

### Quick Start

1. **Clone the repository:**
```bash
git clone <repository-url>
cd learn-english
```

2. **Open in VSCode:**
```bash
code learn-english.code-workspace
```

3. **Install recommended extensions** when prompted by VSCode

4. **Set up backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
```

5. **Set up database:**
```bash
# From backend directory
alembic upgrade head
python -m app.utils.seed_data
```

6. **Set up frontend:**
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
```

## Alternative: Docker Setup

If you prefer to use Docker for development:

1. **Prerequisites:**
   - Docker Desktop installed and running

2. **Quick start with Docker:**
```bash
# Copy environment template
cp .env.docker .env
# Edit .env with your API keys

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

3. **Access services:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000
   - Database Admin: http://localhost:5050 (admin@learnenglish.com / admin123)
   - Redis Commander: http://localhost:8081

See [DOCKER.md](DOCKER.md) for detailed Docker setup instructions.

## Debugging with VSCode

### Available Debug Configurations

1. **Debug FastAPI Backend** - Debug the main FastAPI server
2. **Debug Celery Worker** - Debug background task processing
3. **Debug React Frontend (Browser)** - Debug React in Chrome browser
4. **Debug React Frontend (Node)** - Debug React using Node.js debugger
5. **Debug Frontend Tests** - Debug React tests
6. **Debug Backend Tests** - Debug Python tests

### Compound Configurations

1. **Debug Full Stack** - Runs both backend and frontend (Node) simultaneously
2. **Debug Backend with Worker** - Runs API server and Celery worker

### How to Debug

1. **Single Service:**
   - Open VSCode with the workspace file
   - Go to Run and Debug (Ctrl+Shift+D)
   - Select your desired configuration
   - Press F5 to start debugging

2. **Full Stack:**
   - Select "Debug Full Stack" from the dropdown
   - This will start both backend and frontend
   - Set breakpoints in either codebase
   - Both services will stop when any breakpoint is hit

### Debugging Features

- **Breakpoints**: Set breakpoints in Python or JavaScript/React code
- **Variable inspection**: Hover over variables to see values
- **Call stack**: View the execution path
- **Console**: Interactive debugging console
- **Hot reload**: Both backend and frontend support hot reloading

## Common Development Tasks

Use VSCode Command Palette (Ctrl+Shift+P) and type "Tasks: Run Task" to access these:

### Installation Tasks
- **Install Backend Dependencies**
- **Install Frontend Dependencies**

### Development Tasks
- **Start Backend Server**
- **Start Frontend Server**
- **Start Celery Worker**
- **Start Celery Beat Scheduler**

### Database Tasks
- **Run Database Migration**
- **Seed Sample Data**

### Testing Tasks
- **Run Backend Tests**
- **Run Frontend Tests**

### Build Tasks
- **Build Frontend**
- **Lint Backend Code**
- **Format Backend Code**

## Environment Configuration

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/learn_english
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET=learn-english-audio
OPENAI_API_KEY=your-openai-api-key
```

### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

## Debugging Tips

### Backend Debugging
- Set breakpoints in Python files
- Use `print()` statements for quick debugging
- Check FastAPI automatic docs at `http://localhost:8000/docs`
- Monitor Celery worker logs for background task debugging

### Frontend Debugging
- Use browser DevTools for React debugging
- Install React Developer Tools extension
- Set breakpoints in VSCode or browser
- Check Network tab for API call debugging
- Use Redux DevTools if using Redux

### WebSocket Debugging
- Use browser DevTools Network tab to inspect WebSocket traffic
- Add logging to WSClient.js for message inspection
- Test WebSocket connection manually using tools like WebSocket King

### Database Debugging
- Use a database client like pgAdmin or DBeaver
- Check Alembic migration status: `alembic current`
- View database logs for query debugging

## Testing

### Backend Tests
```bash
cd backend
pytest -v                    # Run all tests
pytest tests/test_auth.py   # Run specific test file
pytest -k "test_login"      # Run tests matching pattern
```

### Frontend Tests
```bash
cd frontend
npm test                    # Run all tests in watch mode
npm test -- --watchAll=false  # Run tests once
npm test -- --coverage     # Run with coverage report
```

## Build and Deployment

### Frontend Build
```bash
cd frontend
npm run build
```
This creates a production build in the `build/` directory.

### Backend Production
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Troubleshooting

### Common Issues

1. **Import errors in Python:**
   - Make sure PYTHONPATH includes the backend directory
   - Activate the virtual environment
   - Check if all dependencies are installed

2. **Frontend not connecting to backend:**
   - Verify REACT_APP_API_URL in frontend/.env
   - Check if backend is running on the correct port
   - Look for CORS issues in browser console

3. **WebSocket connection fails:**
   - Check REACT_APP_WS_URL configuration
   - Verify WebSocket server is running
   - Check browser console for connection errors

4. **Database connection issues:**
   - Verify DATABASE_URL in backend/.env
   - Ensure PostgreSQL is running
   - Check if database exists

5. **Celery worker not processing tasks:**
   - Verify Redis is running
   - Check CELERY_BROKER_URL configuration
   - Look at worker logs for errors

### Getting Help

1. Check the browser console for frontend errors
2. Check the terminal output for backend errors
3. Review the VSCode Problems panel for syntax errors
4. Use the integrated terminal in VSCode for commands
5. Check the Output panel for build/test results

## Code Style and Formatting

- **Python**: Uses Black formatter with 88-character line length
- **JavaScript/React**: Uses Prettier with 2-space indentation
- **Auto-formatting**: Enabled on save in VSCode configuration

## Git Workflow

1. Create feature branches from `main`
2. Make changes and commit with descriptive messages
3. Run tests before pushing
4. Create pull requests for review
5. Merge only after tests pass and review is complete