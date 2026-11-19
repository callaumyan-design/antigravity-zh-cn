# Antigravity 简体中文汉化 —— 安装
# 用法：右键 → 使用 PowerShell 运行（不需要管理员；需要已安装 Node.js）
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$res  = Join-Path $env:LOCALAPPDATA 'Programs\antigravity\resources'
$asar = Join-Path $res 'app.asar'
$bak  = Join-Path $res 'app.asar.en-backup'
$new  = Join-Path $here 'out\app.asar'
if (-not (Test-Path $asar)) { throw "未找到 Antigravity：$asar" }

Write-Host '正在关闭 Antigravity…'
Get-Process -Name 'Antigravity','language_server' -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 首次安装时备份英文原版；Antigravity 自动更新后，新的 app.asar 不含汉化标记，需要刷新备份
$isZh = Select-String -Path $asar -Pattern 'agy-zh-CN patch' -SimpleMatch -Quiet
if (-not $isZh) { Copy-Item $asar $bak -Force; Write-Host "已备份英文原版 → $bak" }

Write-Host '正在生成汉化包…'
& node (Join-Path $here 'tools\build.mjs') $bak $new
if ($LASTEXITCODE -ne 0) { throw '生成汉化包失败' }

Copy-Item $new $asar -Force
Write-Host '汉化已安装。正在启动 Antigravity…' -ForegroundColor Green
Start-Process (Join-Path $env:LOCALAPPDATA 'Programs\antigravity\Antigravity.exe')
