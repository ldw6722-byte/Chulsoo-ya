$ErrorActionPreference = 'Stop'
$baseUrl = $env:SUPABASE_URL
$serviceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY

if ([string]::IsNullOrWhiteSpace($baseUrl) -or [string]::IsNullOrWhiteSpace($serviceRoleKey)) {
  Write-Output 'STORAGE_CONFIGURATION=UNAVAILABLE_IN_SHELL'
  exit 0
}

$headers = @{ Authorization = "Bearer $serviceRoleKey"; apikey = $serviceRoleKey }
try {
  $response = Invoke-WebRequest -Uri "$baseUrl/storage/v1/bucket/seller-verification-documents" -Headers $headers -Method Get -UseBasicParsing -ErrorAction Stop
  $bucket = $response.Content | ConvertFrom-Json
  Write-Output "STORAGE_BUCKET_HTTP_STATUS=$($response.StatusCode)"
  Write-Output "STORAGE_BUCKET_ID=$($bucket.id)"
  Write-Output "STORAGE_BUCKET_PUBLIC=$($bucket.public)"
} catch {
  $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 'NO_HTTP_RESPONSE' }
  Write-Output "STORAGE_BUCKET_HTTP_STATUS=$status"
  Write-Output "STORAGE_BUCKET_CHECK_FAILED=$($_.Exception.GetType().Name)"
}
