[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$EnvFile,
  [string]$TaskName = "PTE Pilot Gateway"
)

$ErrorActionPreference = "Stop"
$resolvedEnv = (Resolve-Path -LiteralPath $EnvFile).Path
$gatewayRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$entrypoint = Join-Path $gatewayRoot "dist\main.js"
if (-not (Test-Path -LiteralPath $entrypoint -PathType Leaf)) {
  throw "Gateway build missing: $entrypoint. Run pnpm --filter @pte-pilot/gateway build first."
}

$node = (Get-Command node.exe -ErrorAction Stop).Source
$arguments = "--env-file=`"$resolvedEnv`" `"$entrypoint`""
$action = New-ScheduledTaskAction -Execute $node -Argument $arguments -WorkingDirectory $gatewayRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
Write-Output "Installed scheduled task: $TaskName"
