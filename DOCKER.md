# Docker Setup Guide

This guide explains how to run the Learn English application using Docker and docker-compose.

## Quick Start

1. **Prerequisites:**
   - Docker Desktop installed and running
   - Docker Compose (included with Docker Desktop)

2. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd learn-english
   cp .env.docker .env
   # Edit .env with your API keys and configuration
   ```

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Database Admin (development): http://localhost:5050
   - Redis Commander (development): http://localhost:8081

## Services Overview

### Core Services
- **postgres**: PostgreSQL database
- **redis**: Redis cache and message broker
- **backend**: FastAPI application server
- **celery-worker**: Background task processor
- **celery-beat**: Scheduled task scheduler
- **frontend**: React development server

### Development Services (profile: development)
- **pgadmin**: PostgreSQL administration interface
- **redis-commander**: Redis management interface

### Production Services (profile: production)
- **nginx**: Reverse proxy and load balancer

## Docker Compose Commands

### Basic Operations
```bash
# Start all services
docker-compose up -d

# Start with logs visible
docker-compose up

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ This will delete all data!)
docker-compose down -v

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
```

### Development Mode
```bash
# Start with development services (includes pgadmin, redis-commander)
COMPOSE_PROFILES=development docker-compose up -d

# Or set in .env file:
# COMPOSE_PROFILES=development
docker-compose up -d
```

### Production Mode
```bash
# Start with production configuration
COMPOSE_PROFILES=production docker-compose up -d
```

### Service Management
```bash
# Restart a specific service
docker-compose restart backend

# Scale workers (run multiple celery workers)
docker-compose up -d --scale celery-worker=3

# Rebuild services after code changes
docker-compose build
docker-compose up -d

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend
```

## Environment Configuration

### Required Environment Variables (.env)

```bash
# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
INSTAGRAM_CLIENT_ID=your-instagram-client-id-here
INSTAGRAM_CLIENT_SECRET=your-instagram-client-secret-here

# AWS Configuration (for S3 and Polly)
AWS_ACCESS_KEY_ID=your-aws-access-key-here
AWS_SECRET_ACCESS_KEY=your-aws-secret-key-here
AWS_REGION=us-east-1
S3_BUCKET=learn-english-audio

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Development flags
COMPOSE_PROFILES=development  # or 'production'
```

## Database Operations

### Initial Setup
The database is automatically initialized when you first start the services:
1. PostgreSQL container starts
2. Database `learn_english` is created
3. Backend waits for database to be ready
4. Alembic migrations are applied
5. Sample data is seeded

### Manual Database Operations
```bash
# Run migrations manually
docker-compose exec backend alembic upgrade head

# Seed sample data
docker-compose exec backend python -m app.utils.seed_data

# Access PostgreSQL directly
docker-compose exec postgres psql -U postgres -d learn_english

# Backup database
docker-compose exec postgres pg_dump -U postgres learn_english > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres learn_english < backup.sql
```

## Development Workflow

### Code Changes
The containers are configured with volume mounts for development:
- Backend: `./backend:/app` - Changes trigger automatic reload
- Frontend: `./frontend:/app` - Hot reload enabled

### Debugging
```bash
# View container logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f celery-worker

# Access container shell
docker-compose exec backend bash
docker-compose exec frontend sh

# Monitor resource usage
docker stats
```

### Testing
```bash
# Run backend tests
docker-compose exec backend pytest -v

# Run frontend tests
docker-compose exec frontend npm test -- --watchAll=false

# Run specific test file
docker-compose exec backend pytest tests/test_auth.py
```

## Production Deployment

### Build Production Images
```bash
# Build optimized images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start production services
COMPOSE_PROFILES=production docker-compose up -d
```

### Health Checks
All services include health checks:
```bash
# Check service health
docker-compose ps

# View health check logs
docker inspect learn-english-backend | grep -A 10 Health
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using ports
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :8000
   
   # Change ports in docker-compose.yml if needed
   ```

2. **Database connection issues:**
   ```bash
   # Check if PostgreSQL is ready
   docker-compose logs postgres
   
   # Test connection
   docker-compose exec backend python -c "
   import psycopg2
   conn = psycopg2.connect('postgresql://postgres:password@postgres:5432/learn_english')
   print('Database connected successfully')
   "
   ```

3. **Frontend not loading:**
   ```bash
   # Check frontend logs
   docker-compose logs frontend
   
   # Verify environment variables
   docker-compose exec frontend env | grep REACT_APP
   ```

4. **Celery worker not processing tasks:**
   ```bash
   # Check worker logs
   docker-compose logs celery-worker
   
   # Verify Redis connection
   docker-compose exec backend python -c "
   import redis
   r = redis.from_url('redis://redis:6379/0')
   print(r.ping())
   "
   ```

5. **Permission issues:**
   ```bash
   # Fix file permissions (Linux/Mac)
   sudo chown -R $(id -u):$(id -g) .
   
   # Or run containers as current user
   docker-compose run --user $(id -u):$(id -g) backend bash
   ```

### Clean Up
```bash
# Remove all containers, networks, volumes, and images
docker-compose down -v --rmi all

# Clean up Docker system
docker system prune -a --volumes

# Reset to clean state
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Performance Optimization

### Production Optimizations
- Use multi-stage Docker builds
- Enable compression in nginx
- Use production database with connection pooling
- Scale celery workers based on load
- Use Redis clustering for high availability

### Monitoring
```bash
# Monitor container resource usage
docker stats

# View system information
docker system df
docker system info
```

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` file to version control
   - Use Docker secrets in production
   - Rotate API keys regularly

2. **Network Security:**
   - Services communicate via internal Docker network
   - Only necessary ports are exposed to host
   - Use nginx proxy with SSL in production

3. **Container Security:**
   - Containers run as non-root users where possible
   - Regular security updates for base images
   - Minimal attack surface with Alpine Linux images

## CI/CD Integration

Example GitHub Actions workflow:
```yaml
name: Docker Build and Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and test
        run: |
          docker-compose build
          docker-compose up -d
          docker-compose exec -T backend pytest
          docker-compose exec -T frontend npm test -- --watchAll=false
```