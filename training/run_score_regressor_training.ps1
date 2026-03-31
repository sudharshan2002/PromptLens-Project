param(
  [int]$Epochs = 1,
  [string]$RunName = "distilbert-v1",
  [switch]$IncludeOutputText,
  [string]$TrainCsv = "data\public\processed\frigate_score_train_3way.csv",
  [string]$ValidationCsv = "data\public\processed\frigate_score_validation_3way.csv",
  [string]$TestCsv = "data\public\processed\frigate_score_test_3way.csv",
  [int]$TrainBatchSize = 4,
  [int]$EvalBatchSize = 4,
  [switch]$ForceCpu
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$python = Join-Path $repoRoot "venv\Scripts\python.exe"
$logDir = Join-Path $PSScriptRoot "artifacts\logs"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$safeRunName = $RunName -replace "[^a-zA-Z0-9_-]", "-"
$outputDir = "models\frigatescore-regressor-$RunName"
$metricsPath = "training\artifacts\score_regressor_metrics_$RunName.json"
$logPath = Join-Path $logDir "score-regressor-$safeRunName-$timestamp.log"

New-Item -ItemType Directory -Force $logDir | Out-Null
Push-Location $repoRoot
Start-Transcript -Path $logPath -Force | Out-Null

Write-Host "=== FrigateScore Regressor Training ==="
Write-Host "Train:   $TrainCsv"
Write-Host "Val:     $ValidationCsv"
Write-Host "Test:    $TestCsv"
Write-Host "Model:   distilbert-base-uncased"
Write-Host "Output:  $outputDir"
Write-Host "Metrics: $metricsPath"
Write-Host "Epochs:  $Epochs"
Write-Host "Train batch: $TrainBatchSize"
Write-Host "Eval batch:  $EvalBatchSize"
Write-Host "Log:     $logPath"

$extraArgs = @()
if ($IncludeOutputText) {
  $extraArgs += "--include-output-text"
}
if ($ForceCpu) {
  $extraArgs += "--force-cpu"
}

& $python "training\models\train_score_regressor.py" `
  --train $TrainCsv `
  --validation $ValidationCsv `
  --model-name "distilbert-base-uncased" `
  --output-dir $outputDir `
  --epochs $Epochs `
  --train-batch-size $TrainBatchSize `
  --eval-batch-size $EvalBatchSize `
  @extraArgs

& $python "training\models\evaluate_score_regressor.py" `
  --model-dir $outputDir `
  --input $TestCsv `
  --output $MetricsPath `
  @extraArgs

Write-Host "FrigateScore regressor training complete."
Write-Host "Model dir: $outputDir"
Write-Host "Metrics : $metricsPath"

Stop-Transcript | Out-Null
Pop-Location
