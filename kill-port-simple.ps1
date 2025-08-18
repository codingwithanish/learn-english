# Simple but effective port killer for port 8000
param([int]$Port = 8000)

Write-Host "🔍 Checking port $Port..." -ForegroundColor Yellow

# 1. Check what's using the port
$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

if (-not $connections) {
    Write-Host "✅ Port $Port is already free!" -ForegroundColor Green
    exit 0
}

Write-Host "📡 Found processes using port $Port:" -ForegroundColor White

foreach ($conn in $connections) {
    $pid = $conn.OwningProcess
    try {
        $process = Get-Process -Id $pid -ErrorAction Stop
        Write-Host "   - $($process.ProcessName) (PID: $pid)" -ForegroundColor Gray
    } catch {
        Write-Host "   - Unknown process (PID: $pid)" -ForegroundColor Gray
    }
}

Write-Host ""

# 2. Stop Docker containers first
Write-Host "🐳 Stopping Docker containers..." -ForegroundColor Cyan
try {
    docker-compose -f docker-compose.simple.yml down 2>$null | Out-Null
    docker-compose -f docker-compose.scaled.yml down 2>$null | Out-Null
    docker-compose down 2>$null | Out-Null
    
    $dockerContainers = docker ps -q --filter "publish=$Port" 2>$null
    if ($dockerContainers) {
        foreach ($containerId in $dockerContainers) {
            if ($containerId) {
                Write-Host "   Killing container: $containerId" -ForegroundColor Yellow
                docker kill $containerId | Out-Null
                docker rm $containerId 2>$null | Out-Null
            }
        }
    }
} catch {
    Write-Host "   Docker not available" -ForegroundColor Gray
}

# 3. Kill WSL processes
Write-Host "🐧 Stopping WSL processes..." -ForegroundColor Cyan
try {
    wsl pkill -f ".*:$Port" 2>$null
    wsl lsof -ti:$Port 2>$null | ForEach-Object { wsl kill -9 $_ 2>$null }
} catch {
    Write-Host "   WSL not available" -ForegroundColor Gray
}

# 4. Kill Windows processes
Write-Host "🖥️ Stopping Windows processes..." -ForegroundColor Cyan

$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

foreach ($conn in $connections) {
    $pid = $conn.OwningProcess
    try {
        $process = Get-Process -Id $pid -ErrorAction Stop
        Write-Host "   Killing: $($process.ProcessName) (PID: $pid)" -ForegroundColor Red
        Stop-Process -Id $pid -Force -ErrorAction Stop
        Write-Host "   ✅ Killed successfully" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Failed to kill PID $pid" -ForegroundColor Red
        Write-Host "   💡 Try running as Administrator or use: taskkill /F /PID $pid" -ForegroundColor Yellow
    }
}

# 5. Final check
Write-Host ""
Write-Host "🔍 Final verification..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$finalConnections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

if ($finalConnections) {
    Write-Host "❌ Port $Port is still in use by:" -ForegroundColor Red
    foreach ($conn in $finalConnections) {
        $pid = $conn.OwningProcess
        try {
            $process = Get-Process -Id $pid -ErrorAction Stop
            Write-Host "   - $($process.ProcessName) (PID: $pid)" -ForegroundColor Gray
        } catch {
            Write-Host "   - Unknown process (PID: $pid)" -ForegroundColor Gray
        }
    }
    Write-Host ""
    Write-Host "🔧 Try these solutions:" -ForegroundColor Yellow
    Write-Host "   1. Run PowerShell as Administrator" -ForegroundColor White
    Write-Host "   2. Restart your computer" -ForegroundColor White
    Write-Host "   3. Use command: taskkill /F /PID <PID>" -ForegroundColor White
} else {
    Write-Host "✅ Port $Port is now free!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 If port is still busy, try these manual commands:" -ForegroundColor Cyan
Write-Host "   netstat -ano | findstr :$Port" -ForegroundColor Gray
Write-Host "   taskkill /F /PID <PID>" -ForegroundColor Gray
Write-Host "   docker kill `$(docker ps -q --filter `"publish=$Port`")" -ForegroundColor Gray