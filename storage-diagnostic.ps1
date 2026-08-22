$ErrorActionPreference = 'Stop'
$configPath = 'C:\Users\user\Desktop\chulsoo-ya\Chulsoo-ya\server\src\main\resources\application.yaml'
$serverLogPath = 'C:\Users\user\Desktop\chulsoo-ya\Chulsoo-ya\server\build\server.log'

Select-String -Path $configPath -Pattern 'supabase|secret-key|service-role|storage|profiles' -Context 0,2 |
  ForEach-Object { $_.Line -replace '(:\s*).+$', '$1[configured-value-hidden]' }

Get-Content -Path $serverLogPath -Tail 260 -ErrorAction SilentlyContinue |
  Select-String -Pattern 'seller|certificate|storage|Exception|ERROR|500' -CaseSensitive:$false
