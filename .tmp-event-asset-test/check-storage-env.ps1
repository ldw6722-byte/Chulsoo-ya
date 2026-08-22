$ErrorActionPreference = 'Stop'
$keys = Get-Content 'C:\Users\user\Desktop\chulsoo-ya\Chulsoo-ya\server\.env' | ForEach-Object {
  if ($_ -match '^\s*([^#=][^=]*)=') { $Matches[1].Trim() }
}
'SUPABASE_URL=' + $keys.Contains('SUPABASE_URL')
'SUPABASE_SERVICE_ROLE_KEY=' + $keys.Contains('SUPABASE_SERVICE_ROLE_KEY')
'SUPABASE_SECRET_KEY=' + $keys.Contains('SUPABASE_SECRET_KEY')
'SUPABASE_ANON_KEY=' + $keys.Contains('SUPABASE_ANON_KEY')
