$ErrorActionPreference = 'Stop'

$root = 'D:\Chulsoo-ya'
$envFile = Join-Path $root 'server\.env'
if (-not (Test-Path $envFile)) {
    throw "서버 환경 파일을 찾을 수 없습니다: $envFile"
}

$settings = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
        $settings[$matches[1]] = $matches[2].Trim('"').Trim("'")
    }
}

$baseUrl = $settings['SUPABASE_URL'].TrimEnd('/')
$serviceKey = $settings['SUPABASE_SECRET_KEY']
if ([string]::IsNullOrWhiteSpace($baseUrl) -or [string]::IsNullOrWhiteSpace($serviceKey)) {
    throw 'SUPABASE_URL 또는 SUPABASE_SECRET_KEY가 설정되지 않았습니다.'
}

$clientPublic = Join-Path $root 'client\public'
$brandDir = Join-Path $clientPublic 'brand'
New-Item -ItemType Directory -Force -Path $brandDir | Out-Null

Invoke-WebRequest -Uri 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663542095017/iAkFpYopdykRVyod.ico' -OutFile (Join-Path $clientPublic 'favicon.ico')

$assets = @(
    @{ Key = 'brand/chulsooya-main-logo-check-outline.webp'; Source = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663542095017/qNptLFUsBBDrMNCW.webp'; Local = (Join-Path $brandDir 'chulsooya-main-logo.webp'); ContentType = 'image/webp' },
    @{ Key = 'brand/chulsooya-favicon-check-outline.webp'; Source = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663542095017/zgyWzJxJblzDpWlw.webp'; Local = (Join-Path $brandDir 'favicon.webp'); ContentType = 'image/webp' }
)

$headers = @{ apikey = $serviceKey; Authorization = "Bearer $serviceKey"; 'x-upsert' = 'true' }
$results = @()
foreach ($asset in $assets) {
    Invoke-WebRequest -Uri $asset.Source -OutFile $asset.Local
    $uploadUrl = "$baseUrl/storage/v1/object/event-assets/$($asset.Key)"
    Invoke-RestMethod -Uri $uploadUrl -Method Post -Headers $headers -ContentType $asset.ContentType -InFile $asset.Local | Out-Null
    $publicUrl = "$baseUrl/storage/v1/object/public/event-assets/$($asset.Key)"
    $probe = Invoke-WebRequest -Uri $publicUrl -UseBasicParsing
    if ($probe.StatusCode -ne 200) {
        throw "Storage 공개 자산 검증 실패: $publicUrl"
    }
    $results += [PSCustomObject]@{ StorageKey = $asset.Key; PublicUrl = $publicUrl; LocalFile = $asset.Local; Bytes = (Get-Item $asset.Local).Length }
}

$results | Format-Table -AutoSize
