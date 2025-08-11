#!/usr/bin/env python3
"""
Learn English Application - Setup Verification Script
Run this script to verify your development environment is properly configured.
"""

import os
import sys
import subprocess
import importlib
from pathlib import Path

def print_header(title):
    """Print a formatted header."""
    print(f"\n{'=' * 60}")
    print(f" {title}")
    print(f"{'=' * 60}")

def print_status(message, status, details=None):
    """Print status with colored indicators."""
    status_char = "[OK]" if status else "[FAIL]"
    print(f"{status_char} {message}")
    if details and not status:
        print(f"   -> {details}")

def check_python_version():
    """Check Python version."""
    print_header("Python Environment")
    
    version = sys.version_info
    required_version = (3, 9)
    
    is_valid = version >= required_version
    print_status(
        f"Python version: {version.major}.{version.minor}.{version.micro}",
        is_valid,
        f"Requires Python {required_version[0]}.{required_version[1]}+" if not is_valid else None
    )
    
    return is_valid

def check_virtual_environment():
    """Check if virtual environment exists and is activated."""
    print_header("Virtual Environment")
    
    backend_path = Path("backend")
    venv_path = backend_path / ".venv"
    
    # Check if virtual environment exists
    venv_exists = venv_path.exists() and (venv_path / "Scripts" / "python.exe").exists()
    print_status("Virtual environment exists", venv_exists, "Run: python -m venv backend/.venv")
    
    # Check if we're in virtual environment
    in_venv = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
    print_status("Virtual environment activated", in_venv, "Run: backend\\.venv\\Scripts\\activate.bat")
    
    return venv_exists

def check_dependencies():
    """Check if required Python packages are installed."""
    print_header("Python Dependencies")
    
    required_packages = [
        "fastapi", "uvicorn", "sqlalchemy", "alembic", "psycopg2",
        "pydantic", "python_jose", "passlib", "celery", "redis",
        "httpx", "python_dotenv", "openai", "google_auth", "boto3"
    ]
    
    all_installed = True
    for package in required_packages:
        try:
            importlib.import_module(package)
            print_status(f"Package: {package}", True)
        except ImportError:
            print_status(f"Package: {package}", False, "Install with: pip install -r requirements.txt")
            all_installed = False
    
    return all_installed

def check_node_environment():
    """Check Node.js and npm."""
    print_header("Node.js Environment")
    
    # Check Node.js
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        node_version = result.stdout.strip()
        node_available = result.returncode == 0
        print_status(f"Node.js: {node_version}", node_available)
    except FileNotFoundError:
        print_status("Node.js", False, "Install Node.js 16+ from nodejs.org")
        node_available = False
    
    # Check npm
    try:
        result = subprocess.run(["npm", "--version"], capture_output=True, text=True)
        npm_version = result.stdout.strip()
        npm_available = result.returncode == 0
        print_status(f"npm: {npm_version}", npm_available)
    except FileNotFoundError:
        print_status("npm", False, "npm should come with Node.js")
        npm_available = False
    
    # Check frontend dependencies
    frontend_node_modules = Path("frontend/node_modules")
    frontend_deps = frontend_node_modules.exists()
    print_status("Frontend dependencies installed", frontend_deps, "Run: cd frontend && npm install")
    
    return node_available and npm_available

def check_environment_files():
    """Check environment configuration files."""
    print_header("Environment Configuration")
    
    env_files = [
        ("Main .env file", Path(".env")),
        ("Backend .env file", Path("backend/.env")),
        ("Frontend .env file", Path("frontend/.env")),
    ]
    
    all_exist = True
    for name, path in env_files:
        exists = path.exists()
        print_status(name, exists, f"Copy from {path}.example or {path}.docker")
        all_exist = all_exist and exists
    
    return all_exist

def check_docker():
    """Check Docker availability."""
    print_header("Docker (Optional)")
    
    try:
        result = subprocess.run(["docker", "--version"], capture_output=True, text=True)
        docker_available = result.returncode == 0
        docker_version = result.stdout.strip()
        print_status(f"Docker: {docker_version}", docker_available)
    except FileNotFoundError:
        print_status("Docker", False, "Install Docker Desktop (optional)")
        docker_available = False
    
    try:
        result = subprocess.run(["docker-compose", "--version"], capture_output=True, text=True)
        compose_available = result.returncode == 0
        compose_version = result.stdout.strip()
        print_status(f"Docker Compose: {compose_version}", compose_available)
    except FileNotFoundError:
        print_status("Docker Compose", False, "Install Docker Desktop (optional)")
        compose_available = False
    
    return docker_available and compose_available

def check_database_services():
    """Check if database services are available."""
    print_header("Database Services")
    
    # Check PostgreSQL
    try:
        result = subprocess.run(["pg_config", "--version"], capture_output=True, text=True)
        postgres_available = result.returncode == 0
        if postgres_available:
            postgres_version = result.stdout.strip()
            print_status(f"PostgreSQL: {postgres_version}", True)
        else:
            print_status("PostgreSQL", False, "Install PostgreSQL or use Docker")
    except FileNotFoundError:
        print_status("PostgreSQL", False, "Install PostgreSQL or use Docker")
        postgres_available = False
    
    # Check Redis
    try:
        result = subprocess.run(["redis-server", "--version"], capture_output=True, text=True)
        redis_available = result.returncode == 0
        if redis_available:
            redis_version = result.stdout.strip().split()[2]  # Extract version
            print_status(f"Redis: {redis_version}", True)
        else:
            print_status("Redis", False, "Install Redis or use Docker")
    except FileNotFoundError:
        print_status("Redis", False, "Install Redis or use Docker")
        redis_available = False
    
    # Check if using Docker instead
    docker_running = False
    try:
        result = subprocess.run(["docker-compose", "ps"], capture_output=True, text=True, cwd=".")
        if result.returncode == 0 and "learn-english" in result.stdout:
            docker_running = True
            print_status("Docker services", True, "Database services running in Docker")
    except:
        pass
    
    return postgres_available or redis_available or docker_running

def main():
    """Main setup verification function."""
    print("Learn English Application - Setup Verification")
    print("=" * 60)
    print("Checking your development environment setup...")
    
    checks = [
        check_python_version(),
        check_virtual_environment(),
        check_dependencies(),
        check_node_environment(),
        check_environment_files(),
        check_docker(),
        check_database_services()
    ]
    
    print_header("Summary")
    passed_checks = sum(checks)
    total_checks = len(checks)
    
    if passed_checks == total_checks:
        print("[SUCCESS] All checks passed! Your environment is ready for development.")
        print("\nTo start development:")
        print("1. With Docker: docker-compose up -d")
        print("2. Manual: Follow the manual setup guide in README.md")
    else:
        print(f"[WARNING] {passed_checks}/{total_checks} checks passed. Please fix the issues above.")
        print("\nFor detailed setup instructions, see:")
        print("- README.md - Main setup guide")
        print("- OAUTH_SETUP.md - OAuth configuration guide")
    
    print(f"\nPython executable: {sys.executable}")
    print(f"Working directory: {os.getcwd()}")
    print(f"Script location: {__file__}")

if __name__ == "__main__":
    main()