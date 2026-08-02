# Get FreJun Access Token — Simple Guide

## 🎯 Problem

FreJun only gives you **Client ID** and **Client Secret** after creating an OAuth app. You need an **Access Token** to use the dialer widget.

## ✅ Solution: Manual OAuth Flow

Since implementing full OAuth 2.0 flow in the app is complex, use this manual process to get your access token.

---

## 📋 Step-by-Step: Get Your Access Token

### Step 1: Get Authorization Code

1. **Build the authorization URL:**

```
https://product.frejun.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code
```

**Replace:**
- `YOUR_CLIENT_ID` = Your Client ID from FreJun app
- `YOUR_REDIRECT_URI` = The redirect URI you set when creating the app (e.g., `http://localhost:5173/auth/callback`)

**Example:**
```
https://product.frejun.com/oauth/authorize?client_id=abc123def456&redirect_uri=http://localhost:5173/auth/callback&response_type=code
```

2. **Open this URL in your browser**
   - You'll be prompted to login to FreJun (if not already logged in)
   - You'll see a consent screen: "Allow Advance Business OS to access your FreJun account?"
   - Click **"Accept"** or **"Allow"**

3. **Get the authorization code from redirect**
   - Browser will redirect to: `http://localhost:5173/auth/callback?code=AUTHORIZATION_CODE`
   - Copy the `code` parameter value (the long string after `code=`)
   - Example: `code=def50200a1b2c3d4e5f6...` → Copy `def50200a1b2c3d4e5f6...`

---

### Step 2: Exchange Code for Access Token

Now use the authorization code to get your access token.

#### Option A: Using curl (Command Line)

```bash
# 1. Create Base64 encoded credentials
# Format: Base64(client_id:client_secret)

# On Windows PowerShell:
$creds = "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($creds)
$encoded = [Convert]::ToBase64String($bytes)
echo $encoded

# On Mac/Linux:
echo -n "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET" | base64
```

**Example:**
```
Client ID: abc123
Client Secret: secret456
Encoded: YWJjMTIzOnNlY3JldDQ1Ng==
```

```bash
# 2. Make the token request
curl -X GET "https://api.frejun.com/api/v1/oauth/token/?code=YOUR_AUTHORIZATION_CODE" \
  -H "Authorization: Bearer YOUR_BASE64_CREDENTIALS"
```

**Replace:**
- `YOUR_AUTHORIZATION_CODE` = The code from Step 1.3
- `YOUR_BASE64_CREDENTIALS` = The Base64 string you created above

**Full example:**
```bash
curl -X GET "https://api.frejun.com/api/v1/oauth/token/?code=def50200a1b2c3d4e5f6..." \
  -H "Authorization: Bearer YWJjMTIzOnNlY3JldDQ1Ng=="
```

#### Option B: Using Postman/Insomnia

1. **Create a new GET request:**
   - URL: `https://api.frejun.com/api/v1/oauth/token/?code=YOUR_AUTHORIZATION_CODE`

2. **Add Authorization header:**
   - Header: `Authorization`
   - Value: `Bearer YOUR_BASE64_CREDENTIALS`

3. **Send request**

#### Option C: Using Browser Console

```javascript
// 1. Base64 encode your credentials
const clientId = "YOUR_CLIENT_ID";
const clientSecret = "YOUR_CLIENT_SECRET";
const credentials = btoa(`${clientId}:${clientSecret}`);

// 2. Make the request
const authCode = "YOUR_AUTHORIZATION_CODE"; // from Step 1.3

fetch(`https://api.frejun.com/api/v1/oauth/token/?code=${authCode}`, {
  headers: {
    'Authorization': `Bearer ${credentials}`
  }
})
.then(res => res.json())
.then(data => {
  console.log("Access Token:", data.access_token);
  console.log("Refresh Token:", data.refresh_token);
  console.log("Expires in:", data.expires_in, "seconds");
});
```

**To run:**
1. Open browser console (F12 → Console tab)
2. Paste the code above
3. Replace YOUR_CLIENT_ID, YOUR_CLIENT_SECRET, YOUR_AUTHORIZATION_CODE
4. Press Enter
5. Copy the `access_token` from the output

---

### Step 3: Response — Your Tokens

You'll receive a JSON response:

```json
{
  "success": true,
  "message": "Successfully generated access and refresh tokens",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "def50200a1b2c3d4e5f6...",
  "expires_in": 7200,
  "token_type": "Bearer",
  "org_identifier": "your_org_id"
}
```

**Copy the `access_token` value** — this is what you need!

---

### Step 4: Save Token in Your App

1. **Open your app**
2. **Click ⚙ (gear icon)** next to Dialer button
3. **Toggle to "Real (FreJun)" mode**
4. **Paste the `access_token`** into the **"FreJun OAuth Access Token"** field
5. **Enter your FreJun email**
6. **Click "Save Settings"**

Done! Your app can now make real calls.

---

## ⏰ Token Expiration

**Access tokens expire after ~2 hours (7200 seconds).**

When expired, you'll need to either:

### Option 1: Get a new authorization code (repeat Steps 1-4)
- Simple but requires user interaction each time

### Option 2: Use refresh token (automated)
```bash
curl -X POST "https://api.frejun.com/api/v1/oauth/refresh/" \
  -H "Authorization: Bearer YOUR_BASE64_CREDENTIALS" \
  -d "refresh_token=YOUR_REFRESH_TOKEN"
```

This gives you a new access token without user consent again.

**To implement in your app:** We'd need to add a token refresh mechanism (future enhancement).

---

## 🔧 Full Example (Copy-Paste Ready)

### Windows PowerShell

```powershell
# === CONFIGURATION ===
$clientId = "YOUR_CLIENT_ID"
$clientSecret = "YOUR_CLIENT_SECRET"
$redirectUri = "http://localhost:5173/auth/callback"

# === STEP 1: Get authorization URL ===
$authUrl = "https://product.frejun.com/oauth/authorize?client_id=$clientId&redirect_uri=$redirectUri&response_type=code"
Write-Host "1. Open this URL in browser:" -ForegroundColor Green
Write-Host $authUrl
Write-Host ""
Write-Host "2. Accept consent screen"
Write-Host "3. Copy the 'code' parameter from redirect URL"
Write-Host ""

$authCode = Read-Host "4. Paste authorization code here"

# === STEP 2: Create Base64 credentials ===
$creds = "$clientId:$clientSecret"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($creds)
$encoded = [Convert]::ToBase64String($bytes)

# === STEP 3: Get access token ===
$response = Invoke-RestMethod -Uri "https://api.frejun.com/api/v1/oauth/token/?code=$authCode" `
  -Headers @{ "Authorization" = "Bearer $encoded" } `
  -Method Get

# === STEP 4: Display tokens ===
Write-Host ""
Write-Host "=== SUCCESS ===" -ForegroundColor Green
Write-Host "Access Token:" -ForegroundColor Yellow
Write-Host $response.access_token
Write-Host ""
Write-Host "Refresh Token:" -ForegroundColor Yellow
Write-Host $response.refresh_token
Write-Host ""
Write-Host "Expires in: $($response.expires_in) seconds (~$([math]::Round($response.expires_in / 3600, 1)) hours)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy the Access Token and paste it in your app's Dialer Settings!" -ForegroundColor Green
```

**Save as:** `get-frejun-token.ps1`

**Run:**
```powershell
.\get-frejun-token.ps1
```

### Mac/Linux Bash

```bash
#!/bin/bash

# === CONFIGURATION ===
CLIENT_ID="YOUR_CLIENT_ID"
CLIENT_SECRET="YOUR_CLIENT_SECRET"
REDIRECT_URI="http://localhost:5173/auth/callback"

# === STEP 1: Get authorization URL ===
AUTH_URL="https://product.frejun.com/oauth/authorize?client_id=$CLIENT_ID&redirect_uri=$REDIRECT_URI&response_type=code"
echo "1. Open this URL in browser:"
echo "$AUTH_URL"
echo ""
echo "2. Accept consent screen"
echo "3. Copy the 'code' parameter from redirect URL"
echo ""

read -p "4. Paste authorization code here: " AUTH_CODE

# === STEP 2: Create Base64 credentials ===
CREDENTIALS=$(echo -n "$CLIENT_ID:$CLIENT_SECRET" | base64)

# === STEP 3: Get access token ===
RESPONSE=$(curl -s -X GET "https://api.frejun.com/api/v1/oauth/token/?code=$AUTH_CODE" \
  -H "Authorization: Bearer $CREDENTIALS")

# === STEP 4: Display tokens ===
echo ""
echo "=== SUCCESS ==="
echo "Access Token:"
echo "$RESPONSE" | jq -r '.access_token'
echo ""
echo "Refresh Token:"
echo "$RESPONSE" | jq -r '.refresh_token'
echo ""
echo "Expires in: $(echo "$RESPONSE" | jq -r '.expires_in') seconds"
echo ""
echo "Copy the Access Token and paste it in your app's Dialer Settings!"
```

**Save as:** `get-frejun-token.sh`

**Run:**
```bash
chmod +x get-frejun-token.sh
./get-frejun-token.sh
```

---

## 🔍 Troubleshooting

### "Invalid authorization code"

**Cause:** Code expired or already used (codes are single-use)

**Solution:** Go back to Step 1, get a new authorization code

### "Unauthorized" / "Invalid credentials"

**Cause:** Wrong Client ID or Client Secret, or incorrect Base64 encoding

**Solution:**
1. Verify Client ID and Secret from FreJun dashboard
2. Check Base64 encoding (no extra spaces or newlines)
3. Ensure format is exactly: `client_id:client_secret`

### "Redirect URI mismatch"

**Cause:** Redirect URI in authorization URL doesn't match what you set in FreJun app

**Solution:** Use the EXACT same redirect URI you entered when creating the app

### Access token doesn't work in app

**Cause:** Token expired (2-hour lifetime)

**Solution:** Get a fresh token using the refresh token or repeat the process

---

## 📚 Summary

**You have:** Client ID + Client Secret (from FreJun OAuth app)

**To get Access Token:**
1. Open authorization URL in browser
2. Accept consent → Get authorization code
3. Exchange code for access token via API call
4. Copy access token
5. Paste in your app's Dialer Settings

**Token lasts:** ~2 hours, then you need to refresh or get a new one

**Future enhancement:** Implement automatic token refresh using refresh token

