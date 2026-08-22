$path = 'C:\Users\user\Desktop\chulsoo-ya\Chulsoo-ya\server\.env'
if (-not (Test-Path $path)) { exit 0 }
Get-Content $path | Where-Object { $_ -match '^KAKAO_' } | ForEach-Object { ($_ -split '=', 2)[0] }
