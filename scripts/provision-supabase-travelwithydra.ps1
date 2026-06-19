# Provision travelwithydra on the travelwithhydra Supabase organization.
#
# Prerequisites:
#   1. Create an access token: https://supabase.com/dashboard/account/tokens
#   2. In PowerShell: $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
#   3. Run: .\scripts\provision-supabase-travelwithydra.ps1
#
# Optional flags:
#   -ProjectName travelwithydra
#   -Region eu-west-2
#   -SkipNetlify

param(
  [string]$ProjectName = "travelwithydra",
  [string]$OrgName = "travelwithhydra",
  [string]$Region = "eu-west-2",
  [switch]$SkipNetlify
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Host "ERROR: Set SUPABASE_ACCESS_TOKEN first (https://supabase.com/dashboard/account/tokens)" -ForegroundColor Red
  exit 1
}

function Get-JsonLines($cmd) {
  $raw = Invoke-Expression $cmd 2>&1 | Out-String
  return $raw | ConvertFrom-Json
}

Write-Host "Looking up organization '$OrgName'..." -ForegroundColor Cyan
$orgs = supabase orgs list -o json | ConvertFrom-Json
$org = $orgs | Where-Object { $_.name -eq $OrgName -or $_.slug -eq $OrgName } | Select-Object -First 1
if (-not $org) {
  Write-Host "Available orgs:" -ForegroundColor Yellow
  $orgs | ForEach-Object { Write-Host "  - $($_.name) ($($_.id))" }
  throw "Organization '$OrgName' not found. Log in with the travelwithhydra account."
}

Write-Host "Looking for project '$ProjectName'..." -ForegroundColor Cyan
$projects = supabase projects list -o json | ConvertFrom-Json
$project = $projects | Where-Object { $_.name -eq $ProjectName } | Select-Object -First 1

if (-not $project) {
  Write-Host "Creating project '$ProjectName' in $($org.name)..." -ForegroundColor Cyan
  $dbPassword = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
  $passwordFile = Join-Path $Root "supabase\.db-password.$ProjectName.txt"
  $dbPassword | Out-File -FilePath $passwordFile -Encoding utf8 -NoNewline
  Write-Host "Database password saved to $passwordFile (keep this safe)" -ForegroundColor Yellow

  supabase projects create $ProjectName --org-id $org.id --region $Region --db-password $dbPassword --yes | Out-Host
  Start-Sleep -Seconds 15
  $projects = supabase projects list -o json | ConvertFrom-Json
  $project = $projects | Where-Object { $_.name -eq $ProjectName } | Select-Object -First 1
}

if (-not $project) { throw "Failed to resolve project ref for '$ProjectName'" }
$ref = $project.id
$url = "https://$ref.supabase.co"
Write-Host "Project ref: $ref" -ForegroundColor Green
Write-Host "Project URL: $url" -ForegroundColor Green

Write-Host "Linking local repo..." -ForegroundColor Cyan
supabase unlink 2>$null | Out-Null
supabase link --project-ref $ref --yes | Out-Host

Write-Host "Pushing database migrations..." -ForegroundColor Cyan
supabase db push --yes | Out-Host

Write-Host "Fetching API keys..." -ForegroundColor Cyan
$keys = supabase projects api-keys --project-ref $ref -o json | ConvertFrom-Json
$anon = ($keys | Where-Object { $_.name -eq 'anon' -or $_.name -eq 'anon public' } | Select-Object -First 1).api_key
$service = ($keys | Where-Object { $_.name -eq 'service_role' } | Select-Object -First 1).api_key

if (-not $anon) { throw "Could not read anon key from Supabase CLI output" }

$envLines = @(
  "# Supabase — travelwithhydra org / $ProjectName",
  "VITE_SUPABASE_URL=$url",
  "VITE_SUPABASE_ANON_KEY=$anon",
  "REACT_APP_SUPABASE_URL=$url",
  "REACT_APP_SUPABASE_ANON_KEY=$anon"
)
if ($service) {
  $envLines += "SUPABASE_SERVICE_ROLE_KEY=$service"
}

$localEnv = Join-Path $Root ".env.local"
$existing = if (Test-Path $localEnv) { Get-Content $localEnv -Raw } else { "" }
$updated = $existing
foreach ($line in $envLines) {
  if ($line.StartsWith('#')) { continue }
  $key = ($line -split '=', 2)[0]
  if ($updated -match "(?m)^$key=.*$") {
    $updated = [regex]::Replace($updated, "(?m)^$key=.*$", $line)
  } else {
    $updated += "`n$line"
  }
}
if ($existing -notmatch 'Supabase — travelwithhydra') {
  $updated = ($envLines -join "`n") + "`n`n" + $existing
}
Set-Content -Path $localEnv -Value $updated.Trim() -Encoding utf8
Write-Host "Updated $localEnv" -ForegroundColor Green

npm run generate-env | Out-Host

if (-not $SkipNetlify) {
  if (Get-Command netlify -ErrorAction SilentlyContinue) {
    Write-Host "Updating Netlify environment variables..." -ForegroundColor Cyan
    netlify env:set VITE_SUPABASE_URL $url | Out-Host
    netlify env:set VITE_SUPABASE_ANON_KEY $anon | Out-Host
    netlify env:set REACT_APP_SUPABASE_URL $url | Out-Host
    netlify env:set REACT_APP_SUPABASE_ANON_KEY $anon | Out-Host
    if ($service) {
      netlify env:set SUPABASE_SERVICE_ROLE_KEY $service | Out-Host
    }
    Write-Host "Redeploy with: netlify deploy --prod" -ForegroundColor Yellow
  } else {
    Write-Host "Netlify CLI not found — set env vars manually in the Netlify dashboard." -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "Done. Next steps in Supabase Dashboard ($url):" -ForegroundColor Green
Write-Host "  Authentication -> URL Configuration:"
Write-Host "    Site URL: https://travelwithydra.com"
Write-Host "    Redirect URLs: https://travelwithydra.com/**, http://localhost:5173/**"
Write-Host "  Authentication -> Providers: enable Email, Google, Apple as needed"
