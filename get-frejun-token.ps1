# FreJun Access Token Generator
# This script helps you get an access token from FreJun OAuth app

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host " FreJun Access Token Generator" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# === CONFIGURATION ===
Write-Host "Enter your FreJun OAuth App credentials:" -ForegroundColor Yellow
$clientId = Read-Host "Client ID"
$clientSecret = Read-Host "Client Secret" -AsSecureString
$clientSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($clientSecret)
)
$redirectUri = Read-Host "Redirect URI (default: http://localhost:5173/auth/callback)" 
if ([string]::IsNullOrWhiteSpace($redirectUri)) {
    $redirectUri = "http://localhost:5173/auth/callback"
}

Write-Host ""

# === STEP 1: Get authorization URL ===
$authUrl = "https://product.frejun.com/oauth/authorize?client_id=$clientId&redirect_uri=$redirectUri&response_type=code"
Write-Host "STEP 1: Get Authorization Code" -ForegroundColor Green
Write-Host "------------------------------" -ForegroundColor Green
Write-Host "1. Copy this URL and open it in your browser:"
Write-Host ""
Write-Host $authUrl -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Login to FreJun (if not already logged in)"
Write-Host "3. Click 'Accept' or 'Allow' on the consent screen"
Write-Host "4. Browser will redirect to: $redirectUri`?code=..."
Write-Host "5. Copy ONLY the 'code' parameter value (the long string after 'code=')"
Write-Host ""

# Copy URL to clipboard
Set-Clipboard -Value $authUrl
Write-Host "✓ URL copied to clipboard!" -ForegroundColor Green
Write-Host ""

$authCode = Read-Host "Paste the authorization code here"

if ([string]::IsNullOrWhiteSpace($authCode)) {
    Write-Host ""
    Write-Host "ERROR: Authorization code cannot be empty!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "STEP 2: Exchanging code for access token..." -ForegroundColor Green
Write-Host ""

# === STEP 2: Create Base64 credentials ===
$creds = "$clientId:$clientSecretPlain"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($creds)
$encoded = [Convert]::ToBase64String($bytes)

# === STEP 3: Get access token ===
try {
    $response = Invoke-RestMethod -Uri "https://api.frejun.com/api/v1/oauth/token/?code=$authCode" `
        -Headers @{ "Authorization" = "Bearer $encoded" } `
        -Method Get

    # === STEP 4: Display tokens ===
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "        SUCCESS!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access Token:" -ForegroundColor Yellow
    Write-Host $response.access_token
    Write-Host ""
    Write-Host "Refresh Token:" -ForegroundColor Yellow
    Write-Host $response.refresh_token
    Write-Host ""
    Write-Host "Expires in: $($response.expires_in) seconds (~$([math]::Round($response.expires_in / 3600, 1)) hours)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Copy the Access Token above"
    Write-Host "2. Open your app"
    Write-Host "3. Click the ⚙ (gear icon) next to Dialer button"
    Write-Host "4. Toggle to 'Real (FreJun)' mode"
    Write-Host "5. Paste Access Token in the OAuth field"
    Write-Host "6. Enter your FreJun email"
    Write-Host "7. Click 'Save Settings'"
    Write-Host ""
    
    # Copy access token to clipboard
    Set-Clipboard -Value $response.access_token
    Write-Host "✓ Access Token copied to clipboard!" -ForegroundColor Green
    Write-Host ""
    
    # Save tokens to file
    $tokensFile = "frejun-tokens.txt"
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    @"
FreJun Access Tokens
Generated: $timestamp

Access Token:
$($response.access_token)

Refresh Token:
$($response.refresh_token)

Expires in: $($response.expires_in) seconds
Token Type: $($response.token_type)
Org Identifier: $($response.org_identifier)

---
NOTE: Keep this file secure! Access tokens are sensitive credentials.
"@ | Out-File -FilePath $tokensFile -Encoding UTF8
    
    Write-Host "✓ Tokens saved to: $tokensFile" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host "        ERROR!" -ForegroundColor Red
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Failed to get access token." -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message
    Write-Host ""
    Write-Host "Common causes:" -ForegroundColor Yellow
    Write-Host "- Invalid authorization code (codes are single-use and expire quickly)"
    Write-Host "- Wrong Client ID or Client Secret"
    Write-Host "- Redirect URI mismatch"
    Write-Host ""
    Write-Host "Try again by running this script again." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

