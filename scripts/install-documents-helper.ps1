param(
  [switch]$StartupOnly
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$helperSource = Join-Path $projectRoot "scripts\windows-document-helper.mjs"

if (-not (Test-Path $helperSource)) {
  throw "Arquivo do helper não encontrado em $helperSource"
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
  throw "Node.js não encontrado. Instale o Node.js antes de instalar o helper."
}

$installDir = Join-Path $env:LOCALAPPDATA "CBSLDocumentsHelper"
New-Item -ItemType Directory -Force -Path $installDir | Out-Null

$helperTarget = Join-Path $installDir "windows-document-helper.mjs"
$cmdTarget = Join-Path $installDir "run-helper.cmd"
$vbsTarget = Join-Path $installDir "run-helper-hidden.vbs"
$startupFolder = [Environment]::GetFolderPath("Startup")
$shortcutTarget = Join-Path $startupFolder "CBSL Documents Helper.lnk"

Copy-Item $helperSource $helperTarget -Force

$cmdContent = @"
@echo off
cd /d "$installDir"
node "$helperTarget"
"@
Set-Content -Path $cmdTarget -Value $cmdContent -Encoding ASCII

$vbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "$cmdTarget" & chr(34), 0
Set WshShell = Nothing
"@
Set-Content -Path $vbsTarget -Value $vbsContent -Encoding ASCII

$wshShell = New-Object -ComObject WScript.Shell
$shortcut = $wshShell.CreateShortcut($shortcutTarget)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsTarget`""
$shortcut.WorkingDirectory = $installDir
$shortcut.Description = "CBSL Documents Helper"
$shortcut.Save()

Write-Host ""
Write-Host "CBSL Documents Helper instalado com sucesso." -ForegroundColor Green
Write-Host "Pasta: $installDir"
Write-Host "Atalho de inicialização automática criado em: $shortcutTarget"
Write-Host ""
Write-Host "Para iniciar agora, execute:"
Write-Host "wscript `"$vbsTarget`""
