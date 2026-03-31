param(
  [int]$Epochs = 1,
  [string]$RunName = "",
  [string]$OutputDir = "",
  [string]$MetricsPath = "",
  [string]$TrainJsonl = "data\public\processed\frigate_segmentation_train.jsonl",
  [string]$ValidationJsonl = "data\public\processed\frigate_segmentation_validation.jsonl",
  [int]$TrainBatchSize = 4,
  [int]$EvalBatchSize = 4,
  [switch]$ForceCpu
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$python = Join-Path $repoRoot "venv\Scripts\python.exe"
$logDir = Join-Path $PSScriptRoot "artifacts\logs"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
if (-not $RunName) {
  $RunName = "epoch$Epochs"
}
if (-not $OutputDir) {
  $OutputDir = "models\frigate-segmenter-$RunName"
}
if (-not $MetricsPath) {
  $MetricsPath = "training\artifacts\segmenter_metrics_$RunName.json"
}
$safeRunName = $RunName -replace "[^a-zA-Z0-9_-]", "-"
$logPath = Join-Path $logDir "segmenter-train-$safeRunName-$timestamp.log"

New-Item -ItemType Directory -Force $logDir | Out-Null
Push-Location $repoRoot
Start-Transcript -Path $logPath -Force | Out-Null

Write-Host "=== Frigate Segmenter Training ==="
Write-Host "Train file: $TrainJsonl"
Write-Host "Val file:   $ValidationJsonl"
Write-Host "Model:      distilbert-base-uncased"
Write-Host "Run name:   $RunName"
Write-Host "Output:     $OutputDir"
Write-Host "Epochs:     $Epochs"
Write-Host "Train batch:$TrainBatchSize"
Write-Host "Eval batch: $EvalBatchSize"
Write-Host "Metrics:    $MetricsPath"
Write-Host "Log:        $logPath"

& $python "training\models\train_segmenter.py" `
  --train $TrainJsonl `
  --validation $ValidationJsonl `
  --model-name "distilbert-base-uncased" `
  --output-dir $OutputDir `
  --epochs $Epochs `
  --train-batch-size $TrainBatchSize `
  --eval-batch-size $EvalBatchSize `
  $(if ($ForceCpu) { "--force-cpu" })

& $python "training\models\evaluate_segmenter.py" `
  --model-dir $OutputDir `
  --validation $ValidationJsonl `
  --output $MetricsPath `
  $(if ($ForceCpu) { "--force-cpu" })

Write-Host "Segmenter training complete."
Write-Host "Model dir: $OutputDir"
Write-Host "Metrics : $MetricsPath"

Stop-Transcript | Out-Null
Pop-Location
