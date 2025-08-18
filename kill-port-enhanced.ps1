# Enhanced Port Killer Script
param(
    [int]$Port = 8000,
    [switch]$Force
)

Write-Host "🔍 Analyzing port $Port..." -ForegroundColor Yellow
Write-Host ""

# Function to check if running as admin
function Test-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Function to get detailed process info
function Get-ProcessDetails {
    param([int]$PID)
    
    try {
        $process = Get-Process -Id $PID -ErrorAction Stop
        $path = try { $process.Path } catch { "N/A" }
        $commandLine = try { 
            (Get-CimInstance Win32_Process -Filter "ProcessId = $PID").CommandLine 
        } catch { "N/A" }
        
        return @{
            Name = $process.ProcessName
            Path = $path
            CommandLine = $commandLine
            StartTime = try { $process.StartTime } catch { "N/A" }
        }
    } catch {
        return $null
    }
}

# 1️⃣ Check what's using the port
Write-Host "1️⃣ Checking what's using port $Port..." -ForegroundColor Cyan

try {
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    
    if ($connections) {
        foreach ($conn in $connections) {
            $pid = $conn.OwningProcess
            $state = $conn.State
            $localAddr = $conn.LocalAddress
            $remoteAddr = $conn.RemoteAddress
            
            Write-Host "   📡 Connection: $localAddr:$Port -> $remoteAddr (State: $state, PID: $pid)" -ForegroundColor Gray
            
            $processInfo = Get-ProcessDetails -PID $pid
            if ($processInfo) {
                Write-Host "   🔍 Process: $($processInfo.Name) (PID: $pid)" -ForegroundColor White
                Write-Host "   📁 Path: $($processInfo.Path)" -ForegroundColor Gray
                Write-Host "   ⚡ Command: $($processInfo.CommandLine)" -ForegroundColor Gray
                Write-Host "   ⏰ Started: $($processInfo.StartTime)" -ForegroundColor Gray
                Write-Host ""
            }
        }
    } else {
        Write-Host "   ✅ No active connections found on port $Port" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "   ❌ Error checking connections: $($_.Exception.Message)" -ForegroundColor Red
}

# 2️⃣ Check Docker containers
Write-Host "2️⃣ Checking Docker containers..." -ForegroundColor Cyan

try {
    $dockerContainers = docker ps --filter "publish=$Port" --format "table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" 2>$null
    
    if ($dockerContainers -and $dockerContainers.Count -gt 1) {
        Write-Host "   🐳 Docker containers using port $Port:" -ForegroundColor White
        $dockerContainers | ForEach-Object { Write-Host "   $($_)" -ForegroundColor Gray }
        Write-Host ""
        
        if ($Force) {
            $containerIds = docker ps --filter "publish=$Port" --format "{{.ID}}" 2>$null
            foreach ($id in $containerIds) {
                if ($id) {
                    Write-Host "   🔥 Killing Docker container: $id" -ForegroundColor Red
                    docker kill $id | Out-Null
                    docker rm $id 2>$null | Out-Null
                }
            }
        }
    } else {
        Write-Host "   ✅ No Docker containers found using port $Port" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️ Docker not available or error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 3️⃣ Check Docker Compose
Write-Host "3️⃣ Checking Docker Compose..." -ForegroundColor Cyan

$composeFiles = @("docker-compose.yml", "docker-compose.simple.yml", "docker-compose.scaled.yml")
foreach ($file in $composeFiles) {
    if (Test-Path $file) {
        Write-Host "   📄 Found compose file: $file" -ForegroundColor Gray
        
        if ($Force) {
            Write-Host "   🔥 Stopping services in $file" -ForegroundColor Red
            docker-compose -f $file down 2>$null | Out-Null
        }
    }
}

# 4️⃣ Check WSL processes
Write-Host "4️⃣ Checking WSL processes..." -ForegroundColor Cyan

try {
    $wslProcesses = wsl bash -c "lsof -i :$Port 2>/dev/null || echo 'No WSL processes found'"
    
    if ($wslProcesses -and $wslProcesses -ne "No WSL processes found") {
        Write-Host "   🐧 WSL processes using port $Port:" -ForegroundColor White
        $wslProcesses | ForEach-Object { Write-Host "   $($_)" -ForegroundColor Gray }
        
        if ($Force) {
            $wslPIDs = wsl bash -c "lsof -t -i :$Port 2>/dev/null"
            foreach ($pid in $wslPIDs) {
                if ($pid) {
                    Write-Host "   🔥 Killing WSL process: $pid" -ForegroundColor Red
                    wsl kill -9 $pid 2>$null
                }
            }
        }
    } else {
        Write-Host "   ✅ No WSL processes found using port $Port" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️ WSL not available: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 5️⃣ Kill Windows processes
if ($Force) {
    Write-Host "5️⃣ Force killing Windows processes..." -ForegroundColor Cyan
    
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $pid = $conn.OwningProcess
        $processInfo = Get-ProcessDetails -PID $pid
        
        Write-Host "   🔥 Killing process: $($processInfo.Name) (PID: $pid)" -ForegroundColor Red
        
        try {
            if (Test-Admin) {
                Stop-Process -Id $pid -Force -ErrorAction Stop
                Write-Host "   ✅ Process killed successfully" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️ Need admin privileges to kill this process" -ForegroundColor Yellow
                Write-Host "   💡 Run as Administrator or use: taskkill /F /PID $pid" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "   ❌ Failed to kill process: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# 6️⃣ Advanced cleanup
if ($Force) {
    Write-Host "6️⃣ Advanced cleanup..." -ForegroundColor Cyan
    
    # Kill any Python processes that might be FastAPI
    $pythonProcesses = Get-Process python* -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*uvicorn*" -or $_.CommandLine -like "*fastapi*" -or $_.CommandLine -like "*app.main*"
    }
    
    foreach ($proc in $pythonProcesses) {
        Write-Host "   🔥 Killing Python/FastAPI process: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Red
        try {
            Stop-Process -Id $proc.Id -Force
        } catch {
            Write-Host "   ❌ Failed to kill: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    # Reset network stack (requires admin)
    if (Test-Admin) {
        Write-Host "   🔄 Resetting network stack..." -ForegroundColor Yellow
        try {
            netsh int ip reset | Out-Null
            netsh winsock reset | Out-Null
            Write-Host "   ✅ Network stack reset (restart may be required)" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Network reset failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# 7️⃣ Final verification
Write-Host "7️⃣ Final verification..." -ForegroundColor Cyan

Start-Sleep -Seconds 2

$finalCheck = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($finalCheck) {
    Write-Host "   ❌ Port $Port is still in use:" -ForegroundColor Red
    foreach ($conn in $finalCheck) {
        $processInfo = Get-ProcessDetails -PID $conn.OwningProcess
        Write-Host "   📡 $($conn.LocalAddress):$Port -> $($conn.RemoteAddress) ($($processInfo.Name), PID: $($conn.OwningProcess))" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "🔧 Suggestions:" -ForegroundColor Yellow
    Write-Host "   1. Run this script as Administrator: Right-click PowerShell -> Run as Administrator" -ForegroundColor White
    Write-Host "   2. Use the -Force parameter: .\kill-port-enhanced.ps1 -Port $Port -Force" -ForegroundColor White
    Write-Host "   3. Restart your computer if all else fails" -ForegroundColor White
    Write-Host "   4. Check Task Manager for any stubborn processes" -ForegroundColor White
    
} else {
    Write-Host "   ✅ Port $Port is now free!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Usage examples:" -ForegroundColor Cyan
Write-Host "   .\kill-port-enhanced.ps1                    # Check what's using port 8000" -ForegroundColor Gray
Write-Host "   .\kill-port-enhanced.ps1 -Port 3000         # Check port 3000" -ForegroundColor Gray
Write-Host "   .\kill-port-enhanced.ps1 -Force             # Force kill everything on port 8000" -ForegroundColor Gray
Write-Host "   .\kill-port-enhanced.ps1 -Port 8000 -Force  # Force kill everything on port 8000" -ForegroundColor Gray