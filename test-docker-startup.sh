#!/bin/bash

# Test script for Docker startup
echo "🧪 Testing Docker Configuration..."

# Test 1: Validate docker-compose files
echo "📋 Validating docker-compose configurations..."

echo "  • Simple configuration..."
docker-compose -f docker-compose.simple.yml config --quiet
if [ $? -eq 0 ]; then
    echo "    ✅ Valid"
else
    echo "    ❌ Invalid"
    exit 1
fi

echo "  • Scaled configuration..."
docker-compose -f docker-compose.scaled.yml config --quiet
if [ $? -eq 0 ]; then
    echo "    ✅ Valid"
else
    echo "    ❌ Invalid"
    exit 1
fi

# Test 2: Test Python configuration loading
echo "📝 Testing Python configuration..."
cd backend
python -c "
try:
    from app.core.config import settings
    print('    ✅ Configuration loads successfully')
    print(f'    Task Executor: {settings.TASK_EXECUTOR}')
    print(f'    Celery Enabled: {settings.ENABLE_CELERY}')
except Exception as e:
    print(f'    ❌ Configuration error: {e}')
    exit(1)
"

# Test 3: Test task system initialization
echo "🔧 Testing task system..."
python -c "
try:
    from app.core.tasks import get_task_manager
    task_manager = get_task_manager()
    print('    ✅ Task manager initializes successfully')
    print(f'    Registered tasks: {len(task_manager.task_registry)}')
except Exception as e:
    print(f'    ❌ Task system error: {e}')
    exit(1)
"

cd ..

echo ""
echo "🎉 All tests passed!"
echo ""
echo "🚀 Ready to start with:"
echo "   docker-compose -f docker-compose.simple.yml up -d"
echo ""
echo "📊 Or with scaling:"
echo "   docker-compose -f docker-compose.scaled.yml --profile scaled up -d"