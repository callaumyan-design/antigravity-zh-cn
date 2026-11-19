# Antigravity 简体中文汉化 —— 还原英文原版
$ErrorActionPreference = 'Stop'
$res = Join-Path $env:LOCALAPPDATA 'Programs\antigravity\resources'
$bak = Join-Path $res 'app.asar.en-backup'
if (-not (Test-Path $bak)) { throw "没有找到备份：$bak" }
Get-Process -Name 'Antigravity','language_server' -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Copy-Item $bak (Join-Path $res 'app.asar') -Force
Write-Host '已还原为英文原版。' -ForegroundColor Green
