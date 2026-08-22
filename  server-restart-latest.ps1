$ErrorActionPreference = 'Stop'
$serverDir = 'C:\Users\user\Desktop\chulsoo-ya\Chulsoo-ya\server'
$jarPath = Join-Path $serverDir 'build\libs\server-0.0.1-SNAPSHOT.jar'
$logPath = Join-Path $serverDir 'build\server.log'
$errorLogPath = Join-Path $serverDir 'build\server-error.log'

Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force }

Start-Process -FilePath 'java' `
  -ArgumentList '-jar', $jarPath, '--spring.profiles.active=supabase' `
  -WorkingDirectory $serverDir `
  -RedirectStandardOutput $logPath `
  -RedirectStandardError $errorLogPath
