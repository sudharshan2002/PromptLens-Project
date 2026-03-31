$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$python = Join-Path $repoRoot "venv\Scripts\python.exe"
$logDir = Join-Path $PSScriptRoot "artifacts\logs"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logPath = Join-Path $logDir "score-train-$timestamp.log"

New-Item -ItemType Directory -Force $logDir | Out-Null
Push-Location $repoRoot
Start-Transcript -Path $logPath -Force | Out-Null

Write-Host "=== FrigateScore Training ==="
Write-Host "Dataset: data\public\processed\frigate_score_labels.csv"
Write-Host "Output:  models\frigatescore\manifest.json"
Write-Host "Log:     $logPath"

& $python "training\scripts\train_linear_manifest.py" `
  --input "data\public\processed\frigate_score_labels.csv" `
  --output "models\frigatescore\manifest.json" `
  --alpha 0.35 `
  --validation-ratio 0.2 `
  --seed 42 `
  --model-name "FrigateScore Linear" `
  --model-version "0.1.0"

& $python "training\scripts\evaluate_manifest.py" `
  --manifest "models\frigatescore\manifest.json" `
  --input "data\public\processed\frigate_score_labels.csv"

Write-Host "FrigateScore training complete."
Write-Host "Manifest: models\frigatescore\manifest.json"

Stop-Transcript | Out-Null
Pop-Location
