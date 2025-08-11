# OAuth Setup Guide - Google & Instagram Login

This guide walks you through setting up Google and Instagram OAuth authentication for the Learn English application in both development and production environments.

## 📖 Table of Contents

- [🔑 Overview](#-overview)
- [🟢 Google OAuth Setup](#-google-oauth-setup)
  - [Development Setup](#google-development-setup)
  - [Production Setup](#google-production-setup)
  - [Testing Google Login](#testing-google-login)
- [📸 Instagram OAuth Setup](#-instagram-oauth-setup)
  - [Development Setup](#instagram-development-setup)
  - [Production Setup](#instagram-production-setup)
  - [Testing Instagram Login](#testing-instagram-login)
- [⚙️ Application Configuration](#️-application-configuration)
- [🔧 Troubleshooting](#-troubleshooting)
- [🔒 Security Best Practices](#-security-best-practices)

## 🔑 Overview

The Learn English application supports OAuth authentication through:
- **Google OAuth 2.0**: For Gmail/Google account users
- **Instagram Basic Display API**: For Instagram account users

Both providers require creating applications in their respective developer consoles and configuring redirect URLs for your environment.

### OAuth Flow Diagram

```
┌─────────────────┐    1. Click Login     ┌─────────────────┐
│                 │ ──────────────────── →│                 │
│   Frontend      │                       │   Backend       │
│   (React)       │←─────────────────────  │   (FastAPI)     │
│                 │    8. Return JWT      │                 │
└─────────────────┘                       └─────────────────┘
          │                                         │
          │                                         │
          │ 2. Redirect to Provider                 │ 3. OAuth Request
          │                                         │
          ▼                                         ▼
┌─────────────────┐    4. User Consent     ┌─────────────────┐
│                 │ ──────────────────── →│                 │
│   User Browser  │                       │ OAuth Provider  │
│                 │←─────────────────────  │ (Google/Insta)  │
│                 │ 5. Auth Code + Redirect│                 │
└─────────────────┘                       └─────────────────┘
                                                    │
                                                    │ 6. Exchange Code
                                                    │    for Token
                                                    ▼
                                          ┌─────────────────┐
                                          │                 │
                                          │   User Info     │
                                          │   + Profile     │
                                          │                 │
                                          └─────────────────┘
                                                    │
                                                    │ 7. Create/Login
                                                    │    User Account
                                                    ▼
                                          ┌─────────────────┐
                                          │                 │
                                          │   Database      │
                                          │   (User Data)   │
                                          │                 │
                                          └─────────────────┘
```

### OAuth Sequence

1. **User Clicks Login**: Frontend button triggers OAuth flow
2. **Redirect to Provider**: Backend redirects to Google/Instagram
3. **User Consents**: User approves app permissions
4. **Authorization Code**: Provider returns code to backend
5. **Exchange Code**: Backend exchanges code for access token
6. **Get User Info**: Backend fetches user profile data
7. **Create/Login User**: User account created or logged in
8. **Return JWT**: Backend returns JWT token to frontend

## 🟢 Google OAuth Setup

### Google Development Setup

#### Step 1: Create a Google Cloud Project

1. **Go to Google Cloud Console**:
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create a New Project**:
   ```
   - Click "Select a project" → "New Project"
   - Project Name: "Learn English App" (or your preferred name)
   - Click "Create"
   ```

3. **Enable Google+ API** (if needed):
   ```
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" 
   - Click "Enable" (may already be enabled)
   ```

#### Step 2: Configure OAuth Consent Screen

1. **Navigate to OAuth Consent Screen**:
   ```
   APIs & Services → OAuth consent screen
   ```

2. **Choose User Type**:
   ```
   ✅ External (for testing with any Google account)
   ⚠️  Internal (only for G Suite/Workspace domains)
   ```

3. **Fill Required Information**:
   ```
   App name: Learn English Application
   User support email: your-email@example.com
   Developer contact email: your-email@example.com
   ```

4. **Add Scopes**:
   ```
   - Add or remove scopes → Add the following:
   - ../auth/userinfo.email
   - ../auth/userinfo.profile
   - openid
   ```

5. **Add Test Users** (for development):
   ```
   - Add your Gmail addresses for testing
   - Click "Save and Continue"
   ```

#### Step 3: Create OAuth Client Credentials

1. **Go to Credentials**:
   ```
   APIs & Services → Credentials → Create Credentials → OAuth client ID
   ```

2. **Configure OAuth Client**:
   ```
   Application type: Web application
   Name: Learn English Web Client
   ```

3. **Add Authorized URLs**:

   **For Local Development:**
   ```
   Authorized JavaScript origins:
   - http://localhost:3000
   - http://localhost:8000

   Authorized redirect URIs:
   - http://localhost:8000/auth/google
   - http://localhost:3000/auth/callback
   ```

4. **Save and Download**:
   ```
   - Click "Create"
   - Copy Client ID and Client Secret
   - Download the JSON file (optional, for backup)
   ```

### Google Production Setup

#### Step 1: Update OAuth Consent Screen for Production

1. **Domain Verification**:
   ```
   - Go to OAuth consent screen
   - Add your production domain to "Authorized domains"
   - Example: yourdomain.com
   ```

2. **Submit for Verification** (if needed):
   ```
   - For apps requiring sensitive scopes
   - Follow Google's app verification process
   - This can take several days
   ```

#### Step 2: Add Production URLs

1. **Update Authorized URLs**:
   ```
   Authorized JavaScript origins:
   - https://yourdomain.com
   - https://api.yourdomain.com

   Authorized redirect URIs:
   - https://api.yourdomain.com/auth/google
   - https://yourdomain.com/auth/callback
   ```

2. **SSL Requirements**:
   ```
   ⚠️  Production URLs MUST use HTTPS
   ⚠️  No localhost URLs in production
   ```

### Testing Google Login

#### Frontend Test Code (React)
```javascript
// In your component
const handleGoogleLogin = async () => {
  try {
    // Redirect to backend Google OAuth endpoint
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  } catch (error) {
    console.error('Google login failed:', error);
  }
};

return (
  <button onClick={handleGoogleLogin}>
    Sign in with Google
  </button>
);
```

#### Backend Verification
```bash
# Test the Google OAuth endpoint
curl -v http://localhost:8000/auth/google

# Should redirect to Google's authorization server
# After authorization, user will be redirected back with code
```

## 📸 Instagram OAuth Setup

### Instagram Development Setup

#### Step 1: Create Facebook App

1. **Go to Meta for Developers**:
   - Visit [Meta for Developers](https://developers.facebook.com/)
   - Sign in with your Facebook account

2. **Create App**:
   ```
   - Click "Create App"
   - Choose "Consumer" or "Business"
   - App Name: "Learn English App"
   - Contact Email: your-email@example.com
   - Click "Create App"
   ```

#### Step 2: Add Instagram Basic Display Product

1. **Add Product**:
   ```
   - In your app dashboard
   - Click "Add Product"
   - Find "Instagram Basic Display"
   - Click "Set Up"
   ```

2. **Create Instagram App**:
   ```
   - Click "Create New App"
   - Display Name: Learn English
   - Click "Create App"
   ```

#### Step 3: Configure Basic Display Settings

1. **Add OAuth Redirect URIs**:

   **For Local Development:**
   ```
   Valid OAuth Redirect URIs:
   - http://localhost:8000/auth/instagram
   - http://localhost:3000/auth/callback
   ```

2. **Add Deauthorize Callback URL**:
   ```
   - http://localhost:8000/auth/instagram/deauthorize
   ```

3. **Add Data Deletion Request URL**:
   ```
   - http://localhost:8000/auth/instagram/delete
   ```

#### Step 4: Get App Credentials

1. **Copy Credentials**:
   ```
   - Instagram App ID (Client ID)
   - Instagram App Secret (Client Secret)
   - Save these securely
   ```

### Instagram Production Setup

#### Step 1: App Review Process

1. **Submit for Review**:
   ```
   ⚠️  Instagram requires app review for production use
   - Go to "App Review" tab
   - Submit required information
   - Provide detailed use case
   - Process can take 1-2 weeks
   ```

2. **Required Information**:
   ```
   - Detailed description of your app
   - Screenshots of the login flow
   - Privacy policy URL
   - Terms of service URL
   - Valid business verification
   ```

#### Step 2: Update Production URLs

1. **Update OAuth Redirect URIs**:
   ```
   Valid OAuth Redirect URIs:
   - https://api.yourdomain.com/auth/instagram
   - https://yourdomain.com/auth/callback
   
   Deauthorize Callback URL:
   - https://api.yourdomain.com/auth/instagram/deauthorize
   
   Data Deletion Request URL:
   - https://api.yourdomain.com/auth/instagram/delete
   ```

2. **SSL Requirements**:
   ```
   ⚠️  All production URLs MUST use HTTPS
   ⚠️  No localhost URLs in production
   ```

### Testing Instagram Login

#### Frontend Test Code (React)
```javascript
// In your component
const handleInstagramLogin = async () => {
  try {
    // Redirect to backend Instagram OAuth endpoint
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/instagram`;
  } catch (error) {
    console.error('Instagram login failed:', error);
  }
};

return (
  <button onClick={handleInstagramLogin}>
    Sign in with Instagram
  </button>
);
```

#### Backend Verification
```bash
# Test the Instagram OAuth endpoint
curl -v http://localhost:8000/auth/instagram

# Should redirect to Instagram's authorization server
# After authorization, user will be redirected back with code
```

## ⚙️ Application Configuration

### Environment Variables

#### Development (.env)
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret-here

# Instagram OAuth
INSTAGRAM_CLIENT_ID=your-instagram-app-id-here
INSTAGRAM_CLIENT_SECRET=your-instagram-app-secret-here

# Frontend URLs
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

#### Production (.env.production)
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-prod-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-prod-google-client-secret

# Instagram OAuth
INSTAGRAM_CLIENT_ID=your-prod-instagram-app-id
INSTAGRAM_CLIENT_SECRET=your-prod-instagram-app-secret

# Frontend URLs
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_GOOGLE_CLIENT_ID=your-prod-google-client-id.apps.googleusercontent.com
```

### Docker Configuration

Update your `docker-compose.yml` environment section:

```yaml
environment:
  - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
  - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
  - INSTAGRAM_CLIENT_ID=${INSTAGRAM_CLIENT_ID}
  - INSTAGRAM_CLIENT_SECRET=${INSTAGRAM_CLIENT_SECRET}
```

### Backend Code Verification

Ensure your FastAPI backend has the proper OAuth routes configured:

```python
# app/api/auth.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/auth/google")
async def google_login():
    # Redirect to Google OAuth
    pass

@router.get("/auth/instagram")
async def instagram_login():
    # Redirect to Instagram OAuth
    pass
```

## 🔧 Troubleshooting

### Common Google OAuth Issues

#### Issue: "redirect_uri_mismatch"
```bash
❌ Problem: The redirect URI in the request doesn't match configured URIs

✅ Solution:
1. Check that redirect URIs exactly match in Google Console
2. Ensure no trailing slashes unless your app expects them
3. Verify HTTP vs HTTPS protocol matches
4. Check for typos in the domain name
```

#### Issue: "invalid_client"
```bash
❌ Problem: Client ID or Client Secret is incorrect

✅ Solution:
1. Verify GOOGLE_CLIENT_ID in your .env file
2. Verify GOOGLE_CLIENT_SECRET in your .env file
3. Ensure no extra spaces or characters
4. Re-download credentials from Google Console if needed
```

#### Issue: "access_denied"
```bash
❌ Problem: User denied permission or app not approved

✅ Solution:
1. Add test users in Google Console (development)
2. Complete app verification (production)
3. Check OAuth consent screen configuration
4. Ensure required scopes are properly requested
```

### Common Instagram OAuth Issues

#### Issue: "Invalid redirect_uri"
```bash
❌ Problem: Redirect URI not configured properly

✅ Solution:
1. Check Instagram Basic Display settings
2. Add exact redirect URI to Valid OAuth Redirect URIs
3. Ensure HTTPS for production URLs
4. No query parameters in redirect URIs
```

#### Issue: "App not approved"
```bash
❌ Problem: App not submitted for review or rejected

✅ Solution:
1. Submit app for Instagram review
2. Provide detailed app description
3. Include privacy policy and terms of service
4. Wait for approval (1-2 weeks typically)
```

#### Issue: "Invalid client_id"
```bash
❌ Problem: Instagram App ID is incorrect

✅ Solution:
1. Verify INSTAGRAM_CLIENT_ID in your .env file
2. Check Instagram Basic Display settings
3. Ensure App ID matches exactly
4. No extra characters or spaces
```

### Testing OAuth Flows

#### Development Testing Checklist
```bash
□ Environment variables are set correctly
□ OAuth consent screens are configured
□ Test users are added (Google)
□ Redirect URIs match exactly
□ Backend endpoints are responding
□ Frontend buttons trigger correct redirects
□ Success/error callbacks work properly
```

#### Production Testing Checklist
```bash
□ Production URLs use HTTPS
□ SSL certificates are valid
□ Apps are approved by providers
□ Production environment variables are set
□ Domain verification completed (Google)
□ App review passed (Instagram)
□ End-to-end flow works for real users
```

## 🔒 Security Best Practices

### Credential Management
```bash
✅ DO:
- Store client secrets in secure environment variables
- Use different credentials for development/production
- Rotate secrets periodically
- Use secrets management services in production

❌ DON'T:
- Hardcode credentials in source code
- Commit .env files with real credentials
- Share credentials in plain text
- Use development credentials in production
```

### Redirect URI Security
```bash
✅ DO:
- Use exact redirect URI matches
- Validate redirect URIs on backend
- Use HTTPS in production
- Keep redirect URIs as specific as possible

❌ DON'T:
- Use wildcard redirect URIs
- Allow open redirects
- Use HTTP in production
- Trust frontend-only validation
```

### Token Handling
```bash
✅ DO:
- Validate OAuth tokens on backend
- Store tokens securely (encrypted)
- Implement token expiry handling
- Use refresh tokens where available

❌ DON'T:
- Store tokens in localStorage without encryption
- Trust expired tokens
- Expose tokens in URLs or logs
- Skip token validation
```

### User Data Privacy
```bash
✅ DO:
- Request minimal required scopes
- Inform users about data usage
- Provide data deletion mechanisms
- Comply with GDPR/privacy laws

❌ DON'T:
- Request excessive permissions
- Store unnecessary user data
- Share user data without consent
- Ignore data deletion requests
```

## 📚 Additional Resources

### Google OAuth
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)

### Instagram OAuth
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Meta for Developers](https://developers.facebook.com/)
- [Instagram Platform Policy](https://developers.facebook.com/docs/instagram-api/overview#instagram-platform-policy)

### OAuth Best Practices
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
- [OWASP OAuth 2.0 Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)

## 📋 Quick Reference

### Important URLs

#### Google OAuth
```bash
# Developer Console
https://console.cloud.google.com/

# OAuth Consent Screen
https://console.cloud.google.com/apis/credentials/consent

# Credentials
https://console.cloud.google.com/apis/credentials

# OAuth Playground (for testing)
https://developers.google.com/oauthplayground/
```

#### Instagram OAuth
```bash
# Meta for Developers
https://developers.facebook.com/

# App Dashboard
https://developers.facebook.com/apps/

# Instagram Basic Display
https://developers.facebook.com/docs/instagram-basic-display-api
```

### Environment Variable Template

```bash
# Copy to your .env file and fill in the values

# Google OAuth (Required)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret

# Instagram OAuth (Optional)
INSTAGRAM_CLIENT_ID=your-instagram-app-id
INSTAGRAM_CLIENT_SECRET=your-instagram-app-secret

# Frontend (React)
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Common Redirect URIs

#### Development
```bash
# Google
http://localhost:8000/auth/google
http://localhost:3000/auth/callback

# Instagram  
http://localhost:8000/auth/instagram
http://localhost:3000/auth/callback
```

#### Production
```bash
# Google
https://api.yourdomain.com/auth/google
https://yourdomain.com/auth/callback

# Instagram
https://api.yourdomain.com/auth/instagram
https://yourdomain.com/auth/callback
```

### Testing Commands

```bash
# Test OAuth endpoints
curl -v http://localhost:8000/auth/google
curl -v http://localhost:8000/auth/instagram

# Check environment variables are loaded
docker-compose exec backend env | grep GOOGLE
docker-compose exec backend env | grep INSTAGRAM

# View OAuth-related logs
docker-compose logs backend | grep -i oauth
docker-compose logs backend | grep -i auth
```

### Validation Checklist

#### Development Setup ✅
```bash
□ Google/Instagram apps created in developer consoles
□ OAuth consent screens configured
□ Client credentials copied to .env file
□ Redirect URIs added to provider configurations
□ Test users added (Google development)
□ Backend OAuth routes are responding
□ Frontend login buttons redirect correctly
□ Full OAuth flow completes successfully
```

#### Production Setup ✅
```bash
□ Production apps approved by providers
□ Domain verification completed (Google)
□ App review passed (Instagram)
□ Production credentials configured
□ HTTPS URLs configured everywhere
□ SSL certificates are valid
□ Production environment variables set
□ End-to-end flow tested with real users
□ Error handling and edge cases tested
```

---

**Need Help?** If you encounter issues not covered in this guide, please check the troubleshooting section or create an issue in the repository with detailed error messages and steps to reproduce.

**🔐 Security Note**: Never commit real OAuth credentials to version control. Always use environment variables and keep your `.env` files in `.gitignore`.