param(
  [switch]$Reload
)

$localVenvPython = Join-Path $PSScriptRoot "..\venv\Scripts\python.exe"

$candidates = @(
  $localVenvPython,
  $env:PYTHON,
  (Get-Command python -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue),
  (Get-Command py -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue),
  "C:\Users\USER\AppData\Local\Programs\Python\Python312\python.exe"
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique

if (-not $candidates) {
  throw "No Python executable was found. Install Python or set the PYTHON environment variable."
}

$pythonExe = $candidates[0]

Push-Location $PSScriptRoot
try {
  if ($Reload) {
    $env:RELOAD = "true"
  }

  & $pythonExe run.py
} finally {
  Pop-Location
}
