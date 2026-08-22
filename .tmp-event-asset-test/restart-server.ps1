$ErrorActionPreference = 'Stop'
$listener = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($listener) { Stop-Process -Id $listener.OwningProcess -Force }
Start-Process -FilePath 'java' -ArgumentList '-jar', 'C:\Users\user\Desktop\chulsoo-ya\Chulsoo-ya\server\build\libs\server-0.0.1-SNAPSHOT.jar' -WorkingDirectory 'C:\Users\user\Desktop\chulsoo-ya\Chulsoo-ya\server' -RedirectStandardOutput 'C:\Users\user\Desktop\chulsoo-ya\Chulsoo-ya\_server.log' -NoNewWindow
