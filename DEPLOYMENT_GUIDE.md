# Docker Deployment Guide - Learn English Application

## Overview

The Learn English application now supports flexible deployment options:

1. **Simple Deployment**: FastAPI with BackgroundTasks only (single container)
2. **Scaled Deployment**: FastAPI + Optional Celery workers (multi-container)
3. **Production Deployment**: Load balanced with monitoring

## Quick Start

### Option 1: Simple Deployment (Recommended for Development)

```bash
# Start core services only
docker-compose -f docker-compose.simple.yml up -d

# With development tools (pgAdmin, Redis Commander)
docker-compose -f docker-compose.simple.yml --profile dev-tools up -d
```

**What you get:**
- FastAPI backend with BackgroundTasks
- PostgreSQL database
- Redis for caching and task results
- React frontend
- Optional: pgAdmin + Redis Commander

**Resource Usage:**
- ~500MB RAM total
- 3 containers (postgres, redis, backend+frontend)

### Option 2: Scaled Deployment (Production Ready)

```bash
# Start with Celery workers for heavy tasks
docker-compose -f docker-compose.scaled.yml --profile scaled up -d

# With monitoring tools
docker-compose -f docker-compose.scaled.yml --profile scaled --profile dev-tools up -d
```

**What you get:**
- FastAPI backend with Hybrid Task System
- Celery workers for heavy tasks
- Celery Beat scheduler
- All services from Simple + worker scaling
- Optional: Celery Flower monitoring

## Deployment Configurations

### Environment Variables

#### Core Configuration
```bash
# Task System
TASK_EXECUTOR=background|hybrid|celery
ENABLE_CELERY=true|false
HEAVY_TASKS=process_speak_audio,calculate_all_ratings,sync_impressions_from_redis

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Redis
REDIS_URL=redis://host:port/db
```

#### Production Settings
```bash
# Security
JWT_SECRET_KEY=your-super-secret-key
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# External Services
OPENAI_API_KEY=sk-...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
GOOGLE_CLIENT_ID=...
```

## Deployment Strategies

### 1. Development Setup

```bash
# Clone and setup
git clone <repository>
cd learn-english

# Simple development environment
docker-compose -f docker-compose.simple.yml up -d

# Check logs
docker-compose -f docker-compose.simple.yml logs -f backend
```

### 2. Single Container Production

```bash
# Production with BackgroundTasks only
docker-compose -f docker-compose.simple.yml up -d

# Scale backend for load balancing
docker-compose -f docker-compose.simple.yml up -d --scale backend=2
```

### 3. Multi-Container Production

```bash
# Full production setup
docker-compose -f docker-compose.scaled.yml --profile scaled up -d

# Scale workers based on load
docker-compose -f docker-compose.scaled.yml --profile scaled up -d --scale celery-worker=3

# Add monitoring
docker-compose -f docker-compose.scaled.yml --profile scaled --profile dev-tools up -d
```

### 4. Cloud Deployment (AWS/GCP/Azure)

```bash
# Use production compose with external services
export DATABASE_URL="postgresql://user:pass@rds-endpoint:5432/db"
export REDIS_URL="redis://elasticache-endpoint:6379"

docker-compose -f docker-compose.scaled.yml --profile production up -d
```

## Container Architecture

### Simple Deployment Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   PostgreSQL    │
│   (React)       │◄──►│   (FastAPI +    │◄──►│                 │
│   Port 3000     │    │   BackgroundTasks)   │   Port 5432     │
└─────────────────┘    │   Port 8000     │    └─────────────────┘
                       └─────────────────┘              │
                                ▲                       │
                                │                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │     Redis       │    │   Volume        │
                       │   (Cache +      │    │   (postgres_    │
                       │   Task Results) │    │    data)        │
                       │   Port 6379     │    └─────────────────┘
                       └─────────────────┘
```

### Scaled Deployment Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   PostgreSQL    │
│   (React)       │◄──►│   (FastAPI +    │◄──►│                 │
│   Port 3000     │    │   Hybrid Tasks) │    │   Port 5432     │
└─────────────────┘    │   Port 8000     │    └─────────────────┘
                       └─────────────────┘              
                                ▲                       
                                │                       
                       ┌─────────────────┐              
                       │     Redis       │              
                       │  (Broker + Cache)│              
                       │   Port 6379     │              
                       └─────────────────┘              
                                ▲                       
                                │                       
                    ┌───────────────────────┐           
                    │                       │           
          ┌─────────────────┐    ┌─────────────────┐    
          │  Celery Worker  │    │  Celery Beat    │    
          │  (Heavy Tasks)  │    │  (Scheduler)    │    
          │                 │    │                 │    
          └─────────────────┘    └─────────────────┘    
                    ▲                       
                    │ (Optional)             
          ┌─────────────────┐              
          │ Celery Flower   │              
          │  (Monitoring)   │              
          │   Port 5555     │              
          └─────────────────┘              
```

## Task Execution Flow

### BackgroundTasks Mode
1. API receives request
2. Task submitted to BackgroundTasks
3. Task executes in same process
4. Result stored in Redis (optional)
5. Client can poll for status

### Hybrid Mode
1. API receives request
2. Task router checks task type
3. Lightweight tasks → BackgroundTasks
4. Heavy tasks → Celery workers
5. Results aggregated from both systems

## Monitoring and Maintenance

### Health Checks
```bash
# Check application health
curl http://localhost:8000/healthz

# Check task system status
curl http://localhost:8000/api/tasks/status

# Check Redis connection
docker-compose exec redis redis-cli ping
```

### Log Management
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f celery-worker

# Follow logs in real-time
docker-compose logs -f --tail=100 backend
```

### Performance Monitoring
```bash
# Container resource usage
docker stats

# Celery worker monitoring (if enabled)
# Visit http://localhost:5555

# Database monitoring
# Visit http://localhost:5050 (pgAdmin)

# Redis monitoring
# Visit http://localhost:8081 (Redis Commander)
```

### Scaling Operations
```bash
# Scale backend horizontally
docker-compose up -d --scale backend=3

# Scale Celery workers
docker-compose --profile scaled up -d --scale celery-worker=5

# Update without downtime
docker-compose pull
docker-compose up -d --no-deps backend
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database status
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Connect to database directly
docker-compose exec postgres psql -U postgres -d learn_english
```

#### 2. Task Execution Problems
```bash
# Check Redis connection
docker-compose exec redis redis-cli ping

# View task results in Redis
docker-compose exec redis redis-cli keys "task_result:*"

# Monitor Celery workers (if using scaled mode)
docker-compose logs celery-worker
```

#### 3. Memory Issues
```bash
# Check container memory usage
docker stats

# Restart services if needed
docker-compose restart backend

# Clean up unused resources
docker system prune
```

### Performance Tuning

#### BackgroundTasks Optimization
```yaml
# In docker-compose
environment:
  - UVICORN_WORKERS=4  # Scale FastAPI workers
  - MAX_BACKGROUND_TASKS=100  # Limit concurrent tasks
```

#### Celery Optimization
```yaml
# Worker configuration
environment:
  - CELERY_WORKER_CONCURRENCY=8
  - CELERY_MAX_TASKS_PER_CHILD=1000
  - CELERY_TASK_TIME_LIMIT=1800
```

## Migration Guide

### From Pure Celery to Hybrid
1. Update environment variables
2. Deploy with `TASK_EXECUTOR=hybrid`
3. Monitor task distribution
4. Gradually migrate heavy tasks to Celery

### From BackgroundTasks to Scaled
1. Deploy scaled configuration
2. Enable Celery workers
3. Update task routing configuration
4. Monitor performance improvements

## Security Considerations

### Production Security
```yaml
# Use secrets management
secrets:
  db_password:
    external: true
  jwt_secret:
    external: true

# Non-root user
user: appuser

# Read-only filesystem
read_only: true
tmpfs:
  - /tmp
  - /var/tmp
```

### Environment Isolation
```bash
# Separate networks
networks:
  frontend_network:
  backend_network:
  database_network:
```

## Backup and Recovery

### Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres learn_english > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres learn_english < backup.sql
```

### Volume Backup
```bash
# Backup volumes
docker run --rm -v learn-english_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore volumes
docker run --rm -v learn-english_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

## Cost Optimization

### Resource Allocation
- **Development**: Use `docker-compose.simple.yml`
- **Small Production**: Simple deployment with scaled backend
- **Large Production**: Scaled deployment with dedicated workers

### Auto-scaling
```bash
# Use Docker Swarm or Kubernetes for auto-scaling
docker service create --replicas 3 --name backend learn-english_backend
docker service scale backend=5
```

This deployment guide provides everything needed to run the Learn English application efficiently at any scale, from development to production.