# FreJun OAuth App Setup Guide

## 🎯 Overview

FreJun requires creating an **OAuth App** before you can use real VoIP calling. This guide walks you through the complete setup process.

---

## 📋 Prerequisites

1. FreJun account (sign up at [product.frejun.com](https://product.frejun.com))
2. Verified phone number in FreJun
3. Active FreJun subscription (if required)

---

## 🔧 Step-by-Step Setup

### Step 1: Create OAuth App on FreJun

1. **Login to FreJun**
   - Go to [product.frejun.com](https://product.frejun.com)
   - Login with your credentials

2. **Navigate to Developer Settings**
   - Click **Settings** (gear icon) in top-right
   - Select **Developer** tab from left sidebar

3. **Create New App**
   - Look for **"Create App"** or **"Register Application"** button
   - Click it to open the app creation form

4. **Fill in App Details**
   ```
   App Name: Advance Business OS
   Description: Internal CRM dialer for lead calling
   Redirect URI: http://localhost:5173/auth/callback
   (or your production domain: https://yourdomain.com/auth/callback)
   ```

5. **Submit and Get Credentials**
   - Click **Create** or **Register**
   - FreJun will generate:
     - **Client ID** (public identifier)
     - **Client Secret** (keep secure!)
     - **Access Token** (for widget authorization)

6. **Copy Your Access Token**
   - Find the **Access Token** in your app settings
   - Click **"Show"** or **"Copy"** button
   - Save it securely (you'll paste this in the dialer settings)

---

### Step 2: Configure Your Phone Number

FreJun needs to know which phone to call first (yours) when placing calls.

1. **Go to Calling Settings**
   - In FreJun dashboard: **Settings → Calling & SMS**

2. **Set "Connected to" Phone**
   - Find the **"Connected to"** field
   - Enter your phone number (the one FreJun should call)
   - Format: Include country code (e.g., +91 9876543210)

3. **Save Settings**

---

### Step 3: Enter Access Token in Your App

1. **Open Your App**
   - Navigate to your CRM/dialer interface

2. **Open Dialer Settings**
   - Click the **⚙ (gear icon)** next to the Dialer button

3. **Toggle to Real Mode**
   - Switch from "Simulated" to **"Real (FreJun)"**

4. **Enter Credentials**
   - **FreJun Account Email:** Your login email
   - **FreJun API Key:** (optional, for call logs)
   - **FreJun OAuth Access Token:** Paste the token you copied from Step 1.6

5. **Save Settings**
   - Click **"Save Settings"** button
   - You should see confirmation toast

---

## 🧪 Test the Setup

### Make a Test Call

1. **Click Dialer Button**
   - You'll see a green **"LIVE"** badge in Real mode

2. **Enter Any Phone Number**
   - Test with your own second number first

3. **Click Call**
   - **Widget should appear** (centered overlay, 420×600px)
   - **Browser prompts:** "Allow microphone?" → Click **Allow**
   - **FreJun connects:** You'll see the FreJun call interface

4. **Answer Your Phone**
   - FreJun calls YOUR phone first (the one you set in Step 2)
   - Answer it

5. **FreJun Bridges Call**
   - After you answer, FreJun dials the test number
   - Wait for connection

6. **Verify Audio**
   - ✅ Speak → Other party hears you
   - ✅ Other party speaks → You hear them
   - ✅ Mic/speaker working properly

7. **End Call**
   - Click **End** in widget or your app
   - Widget should disappear
   - Disposition panel appears

---

## 🔍 Troubleshooting

### "Create App" Button Not Found

**Possible reasons:**
1. **Account type:** Free accounts may not have API access
   - **Solution:** Upgrade to a paid plan or contact FreJun support

2. **Wrong section:** Make sure you're in Settings → Developer
   - **Solution:** Check left sidebar for "Developer" or "API" section

3. **Not yet approved:** FreJun may require manual approval
   - **Solution:** Fill their registration form or contact support

**Contact FreJun:**
- Email: support@frejun.com
- Ask: "How do I create an OAuth app for API access?"

### "OAuth Token Required" Error

**Cause:** No access token saved in app settings

**Solution:**
1. Go to FreJun → Settings → Developer → Your App
2. Copy the **Access Token**
3. Paste in app's Dialer Settings → OAuth Access Token field
4. Click Save Settings

### Widget Doesn't Appear

**Causes:**
1. No access token configured
2. Invalid access token
3. FreJun widget blocked by browser

**Solutions:**
1. Verify token is copied correctly (no extra spaces)
2. Check browser console for errors (F12 → Console tab)
3. Disable ad blockers/content blockers temporarily
4. Try different browser (Chrome recommended)

### No Microphone Permission Prompt

**Causes:**
1. Browser already denied permission
2. Running on HTTP (not HTTPS)
3. Widget not loaded properly

**Solutions:**
1. Click 🔒 in address bar → Reset microphone permission
2. Use HTTPS or localhost (HTTP blocked for mic access)
3. Refresh page and try again

### "FreJun calls your phone first" — But No Call

**Causes:**
1. Wrong phone number in "Connected to" field
2. Phone not reachable
3. FreJun account issue

**Solutions:**
1. Verify phone number in FreJun → Settings → Calling & SMS
2. Format: +[country code][number] (e.g., +919876543210)
3. Test with alternate number
4. Contact FreJun support

---

## 🔐 Security Best Practices

### Protect Your Access Token

1. **Never commit to Git**
   - Access tokens are stored in localStorage (browser-local)
   - Not in code/config files
   - Safe from Git commits

2. **Regenerate if leaked**
   - If token is exposed, regenerate in FreJun dashboard
   - Settings → Developer → Your App → Regenerate Token

3. **Use environment variables in production**
   ```bash
   # .env
   VITE_FREJUN_ACCESS_TOKEN=your_token_here
   ```
   - For server-side calls only
   - Client-side widget still needs user input

### OAuth App Permissions

- Only grant necessary permissions
- Review what FreJun app can access
- Revoke unused apps regularly

---

## 📚 Additional Resources

**FreJun Documentation:**
- Main docs: [frejun.com/docs](https://frejun.com/docs/)
- Knowledge base: [knowledge.frejun.com](https://knowledge.frejun.com/)
- API reference: Check FreJun dashboard after creating app

**Related Guides (in this repo):**
- `REAL_DIALER_IMPLEMENTATION.md` — Architecture overview
- `HARDWARE_MIC_SPEAKER_FIX.md` — WebRTC technical details
- `AGENTS.md` — AI agent configuration (if exists)

---

## 📧 Need Help?

### FreJun Support
- **Email:** support@frejun.com
- **Question:** "I need to create an OAuth app for API access. How do I get started?"
- **Include:** Your account email, use case (CRM dialer)

### Check Your Account Dashboard
- Login to [product.frejun.com](https://product.frejun.com)
- Look for:
  - Settings → Developer
  - Settings → API
  - Settings → Integrations
  - Or similar section with "Create App" option

---

## ✅ Checklist

Before testing calls, ensure:

- [ ] FreJun account created and verified
- [ ] OAuth app created in FreJun Developer settings
- [ ] Access Token copied from FreJun
- [ ] "Connected to" phone number set in FreJun
- [ ] Access Token pasted in app's Dialer Settings
- [ ] FreJun email entered in app settings
- [ ] Real mode enabled in app
- [ ] Browser microphone permission granted
- [ ] Test call placed successfully
- [ ] Audio working both ways (mic + speaker)

---

## 🎯 Summary

**What you need from FreJun:**
1. Create OAuth App → Get Access Token
2. Set "Connected to" phone number
3. Paste Access Token in your app

**What happens when you call:**
1. Your app tells FreJun widget to dial
2. FreJun calls YOUR phone first
3. You answer
4. FreJun bridges to lead's number
5. Both parties connected with audio

**If "Create App" option doesn't exist:**
- Contact FreJun support
- Ask about API access for your account tier
- May require paid plan or manual approval

