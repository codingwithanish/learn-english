$port = 8000

# 1️⃣ Try killing Windows process
$winPID = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess
if ($winPID) {
    try {
        Stop-Process -Id $winPID -Force -ErrorAction Stop
        Write-Host "Killed Windows process on port $port (PID: $winPID)"
        return
    } catch {
        Write-Host "Found PID $winPID but couldn't kill (might be Docker/WSL)"
    }
}

# 2️⃣ Try killing Docker container
$dockerId = docker ps --filter "publish=$port" --format "{{.ID}}"
if ($dockerId) {
    docker kill $dockerId | Out-Null
    Write-Host "Killed Docker container on port $port"
    return
}

# 3️⃣ Try killing WSL process
$wslPID = wsl lsof -t -i :$port 2>$null
if ($wslPID) {
    wsl kill -9 $wslPID
    Write-Host "Killed WSL process on port $port"
    return
}

Write-Host "No process found using port $port"