param(
  [string]$OutputDir = ".\dist\documents-helper",
  [string]$InstallerName = "CBSL-Documents-Helper-Setup.exe"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$outputRoot = [System.IO.Path]::GetFullPath((Resolve-Path $projectRoot).Path)
$targetDir = [System.IO.Path]::GetFullPath((Join-Path $outputRoot $OutputDir))
$buildRoot = Join-Path $env:TEMP "CBSLDocumentsHelperBuild"
$stagingDir = Join-Path $buildRoot "staging"
$helperSource = Join-Path $projectRoot "scripts\windows-document-helper.mjs"
$installScriptSource = Join-Path $projectRoot "scripts\install-documents-helper.ps1"
$cmdSource = Join-Path $stagingDir "Install-CBSL-Documents-Helper.cmd"
$sedPath = Join-Path $stagingDir "documents-helper-installer.sed"
$tempInstallerPath = Join-Path $buildRoot $InstallerName
$installerPath = [System.IO.Path]::GetFullPath((Join-Path $targetDir $InstallerName))

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
if (Test-Path $buildRoot) {
  Remove-Item -LiteralPath $buildRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $stagingDir | Out-Null

Copy-Item $helperSource (Join-Path $stagingDir "windows-document-helper.mjs") -Force
Copy-Item $installScriptSource (Join-Path $stagingDir "install-documents-helper.ps1") -Force

$cmdContent = @"
@echo off
setlocal
powershell -ExecutionPolicy Bypass -File "%~dp0install-documents-helper.ps1"
exit /b %errorlevel%
"@
Set-Content -Path $cmdSource -Value $cmdContent -Encoding ASCII

$sedContent = @"
[Version]
Class=IEXPRESS
SEDVersion=3
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=1
HideExtractAnimation=0
UseLongFileName=1
InsideCompressed=0
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=
DisplayLicense=
FinishMessage=CBSL Documents Helper instalado com sucesso.
TargetName=$tempInstallerPath
FriendlyName=CBSL Documents Helper
AppLaunched=Install-CBSL-Documents-Helper.cmd
PostInstallCmd=<None>
AdminQuietInstCmd=Install-CBSL-Documents-Helper.cmd
UserQuietInstCmd=Install-CBSL-Documents-Helper.cmd
SourceFiles=SourceFiles
[Strings]
InstallProgram=Install-CBSL-Documents-Helper.cmd
FILE0=windows-document-helper.mjs
FILE1=install-documents-helper.ps1
FILE2=Install-CBSL-Documents-Helper.cmd
[SourceFiles]
SourceFiles0=$stagingDir\
[SourceFiles0]
%FILE0%=
%FILE1%=
%FILE2%=
"@
Set-Content -Path $sedPath -Value $sedContent -Encoding ASCII

$iexpress = Join-Path $env:WINDIR "System32\iexpress.exe"
if (-not (Test-Path $iexpress)) {
  throw "IExpress não encontrado em $iexpress"
}

Write-Host ""
Write-Host "Gerando instalador do CBSL Documents Helper..." -ForegroundColor Cyan
$iexpressProcess = Start-Process -FilePath $iexpress -ArgumentList @('/N', $sedPath) -Wait -PassThru -WindowStyle Hidden

if ($iexpressProcess.ExitCode -ne 0) {
  throw "IExpress retornou código $($iexpressProcess.ExitCode) ao gerar o instalador."
}

if (-not (Test-Path $tempInstallerPath)) {
  throw "Falha ao gerar o instalador temporário em $tempInstallerPath"
}

Copy-Item $tempInstallerPath $installerPath -Force

Write-Host ""
Write-Host "Instalador gerado com sucesso:" -ForegroundColor Green
Write-Host $installerPath
Write-Host ""
Write-Host "Distribuição para usuários:"
Write-Host "1. Entregar o arquivo .exe"
Write-Host "2. Executar o instalador no Windows do usuário"
Write-Host "3. O helper será copiado para %LOCALAPPDATA% e configurado para iniciar com o Windows"
