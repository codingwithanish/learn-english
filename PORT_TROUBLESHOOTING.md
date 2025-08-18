# Port 8000 Troubleshooting Guide

## 🚨 Problem: Port 8000 Still Running After Killing

### Quick Fix Options

#### Option 1: Enhanced PowerShell Script (Recommended)
```powershell
# Just check what's using the port
.\kill-port-enhanced.ps1

# Force kill everything
.\kill-port-enhanced.ps1 -Force

# Check specific port
.\kill-port-enhanced.ps1 -Port 3000 -Force
```

#### Option 2: Simple Batch File
```cmd
# Double-click or run:
kill-port-8000.bat
```

#### Option 3: Manual Commands

**Check what's using port 8000:**
```cmd
netstat -ano | findstr :8000
```

**Kill specific process (replace PID):**
```cmd
taskkill /F /PID 18052
```

### 🔍 Common Causes & Solutions

#### 1. Docker Containers
**Problem:** Docker containers still running in background

**Solution:**
```bash
# Stop all Learn English containers
docker-compose -f docker-compose.simple.yml down
docker-compose -f docker-compose.scaled.yml down

# Kill any container using port 8000
docker kill $(docker ps -q --filter "publish=8000")

# Nuclear option - stop all containers
docker stop $(docker ps -q)
```

#### 2. WSL Processes
**Problem:** Processes running in Windows Subsystem for Linux

**Solution:**
```bash
# Check WSL processes
wsl lsof -i :8000

# Kill WSL processes
wsl pkill -f ".*:8000"

# Restart WSL completely
wsl --shutdown
```

#### 3. FastAPI/Python Processes
**Problem:** Python/FastAPI processes running in background

**Solution:**
```cmd
# Kill all Python processes
taskkill /F /IM python.exe
taskkill /F /IM pythonw.exe

# Or specifically target FastAPI
wmic process where "CommandLine like '%uvicorn%'" delete
wmic process where "CommandLine like '%fastapi%'" delete
```

#### 4. VS Code Debug Sessions
**Problem:** VS Code debug session still active

**Solution:**
1. Close VS Code completely
2. Check Task Manager for any remaining Code.exe processes
3. Kill them manually

#### 5. Node.js Development Servers
**Problem:** React or other Node.js servers using port 8000

**Solution:**
```cmd
# Kill Node.js processes
taskkill /F /IM node.exe
taskkill /F /IM nodemon.exe

# Check for npm processes
wmic process where "CommandLine like '%npm%'" delete
```

### 🔧 Advanced Troubleshooting

#### Method 1: Resource Monitor
1. Press `Win + R`, type `resmon`
2. Go to "Network" tab
3. Look for processes using port 8000
4. Right-click and "End Process"

#### Method 2: PowerShell Admin Mode
```powershell
# Run PowerShell as Administrator
Get-NetTCPConnection -LocalPort 8000 | ForEach-Object {
    $process = Get-Process -Id $_.OwningProcess
    Write-Host "Killing: $($process.Name) (PID: $($_.OwningProcess))"
    Stop-Process -Id $_.OwningProcess -Force
}
```

#### Method 3: Network Stack Reset
```cmd
# Run as Administrator
netsh int ip reset
netsh winsock reset
# Restart computer
```

### 🔄 Complete Reset Procedure

If nothing else works, follow this nuclear option:

1. **Stop All Development Tools:**
   ```cmd
   taskkill /F /IM Code.exe
   taskkill /F /IM python.exe
   taskkill /F /IM node.exe
   ```

2. **Stop All Docker:**
   ```cmd
   docker stop $(docker ps -q)
   docker system prune -f
   ```

3. **Restart WSL:**
   ```cmd
   wsl --shutdown
   ```

4. **Reset Network:**
   ```cmd
   netsh int ip reset
   netsh winsock reset
   ```

5. **Restart Computer**

### 🔍 Diagnostic Commands

#### Check All Port Usage
```cmd
# All listening ports
netstat -ano | findstr LISTENING

# Specific port with process names
netstat -ano | findstr :8000
for /f "tokens=5" %a in ('netstat -ano ^| findstr :8000') do tasklist /FI "PID eq %a"
```

#### Check Docker Status
```cmd
docker ps -a
docker-compose ps
docker stats
```

#### Check WSL Status
```cmd
wsl -l -v
wsl --status
```

### 📋 Prevention Tips

#### 1. Proper Shutdown
Always stop services gracefully:
```bash
# Stop Docker Compose properly
docker-compose down

# Stop FastAPI with Ctrl+C
# Stop React with Ctrl+C
```

#### 2. Use Different Ports
Configure different ports for different services:
```yaml
# docker-compose.yml
ports:
  - "8001:8000"  # Map to different host port
```

#### 3. Environment Variables
```bash
# .env file
PORT=8001
FASTAPI_PORT=8001
```

### 🆘 Emergency Commands

#### One-liner to kill everything on port 8000:
```cmd
for /f "tokens=5" %a in ('netstat -ano ^| findstr :8000') do taskkill /F /PID %a
```

#### PowerShell one-liner:
```powershell
Get-NetTCPConnection -LocalPort 8000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

#### Docker nuclear option:
```cmd
docker kill $(docker ps -q) && docker rm $(docker ps -aq) && docker system prune -f
```

### 📞 When All Else Fails

1. **Restart your computer** - This always works
2. **Change the port** - Use port 8001, 8002, etc.
3. **Check antivirus** - Sometimes antivirus blocks port access
4. **Check firewall** - Windows Defender might be interfering

### 🔧 Tool Recommendations

1. **Process Explorer** (Microsoft Sysinternals) - Better than Task Manager
2. **TCPView** (Microsoft Sysinternals) - Shows network connections
3. **CurrPorts** (NirSoft) - Alternative port viewer

These tools give you better visibility into what's using your ports.