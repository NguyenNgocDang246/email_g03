# Email Management System - Backend API

A powerful email management system built with NestJS that integrates with Gmail API, featuring AI-powered email summarization, semantic search, and Kanban-style email organization.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Google OAuth Setup](#google-oauth-setup)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Token Storage & Authentication](#token-storage--authentication)
- [Security Considerations](#security-considerations)
- [Development](#development)

## Features

- Google OAuth 2.0 authentication
- Gmail API integration (read, send, modify emails)
- AI-powered email summarization using Google Gemini
- Semantic search for emails using embeddings
- Kanban board for email organization
- Attachment handling and streaming
- JWT-based authentication with refresh tokens
- MongoDB for data persistence

## Tech Stack

- **Framework**: NestJS 11.x
- **Database**: MongoDB (with Mongoose)
- **Authentication**: JWT, Passport, Google OAuth 2.0
- **Email**: Gmail API (googleapis)
- **AI**: Google Gemini AI (@google/generative-ai)
- **Language**: TypeScript
- **Password Hashing**: bcryptjs

## Prerequisites

Before setting up the project, ensure you have:

- Node.js (v18 or higher)
- npm or yarn
- MongoDB instance (local or MongoDB Atlas)
- Google Cloud Platform account with:
  - Gmail API enabled
  - OAuth 2.0 credentials configured
  - Google Gemini API key

## Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the backend root directory (see [Environment Variables](#environment-variables) section).

### 4. Run the application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API server will start on `http://localhost:3000` (or your configured port).

## Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Gmail API
   - Google+ API (for profile information)

### Step 2: Configure OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Configure the OAuth consent screen:
   - User Type: External (for public use) or Internal (for organization)
   - Add required scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`
     - `email`
     - `profile`
4. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: Your app name
   - Authorized redirect URIs:
     - Development: `http://localhost:3000/auth/google/callback`
     - Production: `https://yourdomain.com/auth/google/callback`
5. Save the **Client ID** and **Client Secret**

### Step 3: Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **Get API Key**
3. Create a new API key or use an existing one
4. Copy the API key for use in environment variables

### Step 4: Update Environment Variables

Add the credentials to your `.env` file:

```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"
GG_API_KEY="your-gemini-api-key"
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# JWT Secret (use a strong random string)
JWT_SECRET="your-secret-key-here"

# Google Gemini AI API Key
GG_API_KEY="your-gemini-api-key"

# MongoDB Connection String
MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# Frontend URL (for CORS and redirects)
FRONTEND_URL="http://localhost:5173"

# Environment (development or production)
ENVIRONMENT="development"
```

### Environment Variable Descriptions

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret key for JWT token signing | Yes |
| `GG_API_KEY` | Google Gemini API key for AI features | Yes |
| `MONGO_URI` | MongoDB connection string | Yes |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud | Yes |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret from Google Cloud | Yes |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL (must match Google Cloud config) | Yes |
| `FRONTEND_URL` | Frontend application URL for redirects | Yes |
| `ENVIRONMENT` | Environment mode (development/production) | Yes |

## API Documentation

Base URL: `http://localhost:3000` (or your configured domain)

### Authentication Endpoints

#### 1. Google OAuth Flow

**Initiate Google OAuth**
```http
GET /auth/google
```
Redirects user to Google OAuth consent screen.

**OAuth Callback**
```http
GET /auth/google/callback?code={authorization_code}
```
- Handles OAuth callback from Google
- Creates/updates user in database
- Sets authentication cookies
- Redirects to frontend

**Response**: Sets two HttpOnly cookies:
- `accessToken` (15 min expiry)
- `refreshToken` (7 days expiry)

#### 2. Email/Password Authentication

**Register**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "refreshToken": "...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Login**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response**: Sets authentication cookies and returns:
```json
{
  "success": true,
  "data": {
    "email": "user@example.com"
  }
}
```

**Logout**
```http
GET /auth/logout
Cookie: accessToken=...; refreshToken=...
```

**Response**:
```json
{
  "success": true,
  "data": null
}
```

### Token Management

**Refresh Access Token**
```http
GET /token/refresh
Cookie: refreshToken=...
```

**Response**: Sets new `accessToken` cookie
```json
{
  "success": true,
  "data": null
}
```

### User Endpoints

**Get User Info**
```http
GET /user/info
Cookie: accessToken=...
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Google Credential Login**
```http
POST /user/google
Content-Type: application/json

{
  "credential": "google_id_token"
}
```

### Mailbox Endpoints

**Get All Mailboxes**
```http
GET /mailboxes
Cookie: accessToken=...
```

**Response**:
```json
{
  "mailboxes": [
    {
      "id": "INBOX",
      "name": "Inbox",
      "messagesTotal": 150,
      "messagesUnread": 10,
      "threadsTotal": 120,
      "threadsUnread": 8
    }
  ]
}
```

**Get Emails in Mailbox**
```http
GET /mailboxes/:id/emails?pageToken={token}&maxResults=50&refresh=true
Cookie: accessToken=...
```

**Query Parameters**:
- `pageToken` (optional): Token for pagination
- `maxResults` (optional): Number of emails per page (default: 50)
- `refresh` (optional): Force refresh from Gmail API (`true` or `1`)

**Response**:
```json
{
  "data": [...],
  "nextPageToken": "token_string",
  "currentPage": 1,
  "total": 150
}
```

**Search Emails in Mailbox**
```http
GET /mailboxes/:id/emails/search?query=search+term&pageToken={token}
Cookie: accessToken=...
```

### Email Endpoints

**Get Email Detail**
```http
GET /emails/:id
Cookie: accessToken=...
```

**Response**:
```json
{
  "id": "email_id",
  "threadId": "thread_id",
  "subject": "Email Subject",
  "from": "sender@example.com",
  "to": ["recipient@example.com"],
  "date": "2024-01-01T12:00:00.000Z",
  "bodyHtml": "<p>Email content</p>",
  "bodyText": "Email content",
  "attachments": [...],
  "labels": ["INBOX", "UNREAD"],
  "status": "INBOX"
}
```

**Send Email**
```http
POST /emails/send
Content-Type: multipart/form-data
Cookie: accessToken=...

{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "html": "<p>Email content</p>",
  "attachments": [file1, file2]  // Optional files
}
```

**Reply to Email**
```http
POST /emails/:id/reply
Content-Type: multipart/form-data
Cookie: accessToken=...

{
  "to": "recipient@example.com",
  "subject": "Re: Original Subject",
  "html": "<p>Reply content</p>",
  "attachments": [file1, file2]  // Optional files
}
```

**Modify Email Labels**
```http
POST /emails/:id/modify
Content-Type: application/json
Cookie: accessToken=...

{
  "isStar": true,      // Add/remove STARRED label
  "isRead": false,     // Add/remove UNREAD label
  "isDelete": true,    // Add/remove TRASH label
  "addLabels": ["IMPORTANT"],
  "removeLabels": ["SPAM"]
}
```

**Update Email Status (Kanban)**
```http
POST /emails/:id/status
Content-Type: application/json
Cookie: accessToken=...

{
  "status": "IN_PROGRESS",
  "snoozedUntil": "2024-01-02T12:00:00.000Z",  // Optional, for SNOOZED status
  "previousStatus": "INBOX"
}
```

**Stream Attachment**
```http
GET /emails/:id/attachments/:index/stream
Cookie: accessToken=...
```

**Response**: Binary file stream with appropriate headers

**Sync Email Labels**
```http
POST /emails/:id/sync-labels
Cookie: accessToken=...
```

### Kanban Endpoints

**Get Kanban Columns**
```http
GET /kanban/columns
Cookie: accessToken=...
```

**Response**:
```json
[
  {
    "_id": "column_id",
    "userId": "user_id",
    "name": "TO_DO",
    "displayName": "To Do",
    "description": "Tasks to be done",
    "position": 0,
    "isLocked": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Create Kanban Column**
```http
POST /kanban/columns
Content-Type: application/json
Cookie: accessToken=...

{
  "displayName": "Urgent",
  "description": "Urgent emails requiring immediate attention"
}
```

**Update Kanban Column**
```http
PATCH /kanban/columns/:id
Content-Type: application/json
Cookie: accessToken=...

{
  "displayName": "Very Urgent",
  "description": "Updated description"
}
```

**Reorder Kanban Columns**
```http
PATCH /kanban/columns/reorder
Content-Type: application/json
Cookie: accessToken=...

{
  "order": ["INBOX", "TO_DO", "CUSTOM_1", "IN_PROGRESS", "DONE"]
}
```

**Delete Kanban Column**
```http
DELETE /kanban/columns/:id
Cookie: accessToken=...
```

Note: Default columns (INBOX, SNOOZED) cannot be deleted.

### AI Endpoints

**Semantic Search**
```http
POST /ai/search
Content-Type: application/json
Cookie: accessToken=...

{
  "query": "emails about project deadlines",
  "mailboxId": "INBOX",
  "limit": 20
}
```

**Response**:
```json
{
  "data": [
    {
      "id": "email_id",
      "subject": "Project Deadline Reminder",
      "similarity": 0.95,
      ...
    }
  ]
}
```

**Summarize Email**
```http
POST /ai/emails/:id/summarize?refresh=true
Cookie: accessToken=...
```

**Query Parameters**:
- `refresh` (optional): Force regenerate summary (`true` or `1`)

**Response**:
```json
{
  "summary": "This email discusses the upcoming project deadline...",
  "metadata": {
    "priority": "high",
    "category": "work",
    "action_required": true,
    "deadline": "2024-01-15"
  }
}
```

## Token Storage & Authentication

### Token Types

The system uses three types of tokens:

#### 1. Access Token (JWT)
- **Purpose**: Authenticates API requests
- **Storage**: HttpOnly cookie
- **Expiry**: 15 minutes
- **Payload**: `{ id: userId }`
- **Usage**: Automatically sent with each request via cookies

#### 2. Refresh Token
- **Purpose**: Generates new access tokens without re-authentication
- **Storage**:
  - HttpOnly cookie (client-side)
  - MongoDB User document (server-side)
- **Expiry**: 7 days
- **Usage**: Sent to `/token/refresh` to obtain new access token

#### 3. Google OAuth Tokens
- **Google Access Token**: Temporary token for Gmail API access
- **Google Refresh Token**: Long-lived token to refresh Google access
- **Storage**: MongoDB User document (encrypted at rest)
- **Usage**: Automatically managed by the backend for Gmail operations

### Authentication Flow

```
User Login
    ↓
1. POST /auth/google (redirect to Google)
    ↓
2. User authorizes on Google
    ↓
3. GET /auth/google/callback (with code)
    ↓
4. Backend exchanges code for tokens
    ↓
5. Backend stores Google tokens in DB
    ↓
6. Backend generates JWT access & refresh tokens
    ↓
7. Tokens set as HttpOnly cookies
    ↓
8. Redirect to frontend
    ↓
9. Frontend makes authenticated requests
    ↓
10. Middleware validates JWT from cookie
```

### Token Refresh Flow

```
Access Token Expired (401 error)
    ↓
1. Frontend calls GET /token/refresh
    ↓
2. Backend validates refresh token cookie
    ↓
3. Backend generates new access token
    ↓
4. New access token set as cookie
    ↓
5. Frontend retries original request
```

### Database Schema

**User Document (MongoDB)**:
```typescript
{
  _id: ObjectId,
  email: string,              // User email
  password: string,           // Hashed password (bcrypt)
  refreshToken: string,       // App refresh token
  googleAccessToken: string,  // Gmail API access token
  googleRefreshToken: string, // Gmail API refresh token
  createdAt: Date
}
```

## Security Considerations

### 1. Authentication & Authorization

- **JWT Tokens**: All API endpoints (except auth routes) require valid JWT authentication
- **HttpOnly Cookies**: Tokens stored in HttpOnly cookies prevent XSS attacks
- **Secure Flag**: In production, cookies use `Secure` flag (HTTPS only)
- **SameSite Policy**:
  - Development: `lax` - allows cookies in cross-site top-level navigation
  - Production: `none` - requires Secure flag, allows cross-site requests

### 2. Password Security

- **Hashing**: Passwords hashed using bcryptjs with salt rounds (10)
- **Never Stored Plain**: Original passwords never stored or logged
- **Validation**: Minimum password requirements should be enforced on frontend

### 3. Token Security

- **Short Access Token Lifetime**: 15 minutes reduces risk window
- **Rotating Refresh Tokens**: Refresh tokens regenerated on logout
- **Token Invalidation**: Logout immediately invalidates refresh token in database

### 4. Google OAuth Security

- **Scope Limitation**: Only request necessary Gmail scopes
- **Token Encryption**: Consider encrypting Google tokens at rest in MongoDB
- **Offline Access**: Uses `access_type: offline` for refresh token
- **Prompt Consent**: Forces user consent to ensure token freshness

### 5. API Security Best Practices

- **Environment Variables**: Never commit `.env` file to version control
- **CORS Configuration**: Restrict origins in production
- **Rate Limiting**: Consider implementing rate limiting for API endpoints
- **Input Validation**: Use `class-validator` and `class-transformer` for DTO validation
- **SQL/NoSQL Injection**: Mongoose provides built-in protection
- **File Upload Security**:
  - Limit file sizes (max 10 files, size limits per file)
  - Validate file types
  - Scan for malware in production

### 6. Data Privacy

- **User Isolation**: All queries filter by `userId` to prevent data leakage
- **Email Privacy**: Emails only accessible to authenticated owner
- **Sensitive Data**: Google tokens and passwords never exposed in API responses
- **Audit Logging**: Consider logging sensitive operations for security audits

### 7. Production Recommendations

1. **Use HTTPS**: Always use HTTPS in production
2. **Secrets Management**: Use secret management service (AWS Secrets Manager, Azure Key Vault)
3. **Database Security**:
   - Enable MongoDB authentication
   - Use IP whitelisting
   - Enable encryption at rest
4. **Monitoring**: Implement security monitoring and alerting
5. **Updates**: Keep dependencies updated for security patches
6. **Backup**: Regular database backups
7. **CSP Headers**: Implement Content Security Policy
8. **HSTS**: Enable HTTP Strict Transport Security

### 8. Known Security Considerations

- **Cookie Storage**: Consider JWT storage alternatives (localStorage vs cookies trade-offs)
- **Refresh Token Rotation**: Implement refresh token rotation for enhanced security
- **Multi-Factor Authentication**: Consider adding MFA for enhanced security
- **Session Management**: Implement session invalidation on suspicious activity
- **Google Token Refresh**: Monitor and refresh Google tokens proactively

## Development

### Available Scripts

```bash
# Development with hot reload
npm run start:dev

# Production build
npm run build

# Start production server
npm run start:prod

# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov

# Lint code
npm run lint

# Format code
npm run format
```

### Project Structure

```
backend/
├── src/
│   ├── ai/              # AI-related features (search, summarization)
│   ├── auth/            # Authentication logic
│   ├── emails/          # Email management
│   ├── kanban/          # Kanban board features
│   ├── mailboxes/       # Mailbox operations
│   ├── token/           # Token management
│   ├── user/            # User management
│   ├── app.module.ts    # Root module
│   └── main.ts          # Application entry point
├── test/                # E2E tests
├── .env                 # Environment variables
└── package.json
```

### Adding New Features

1. Generate new module: `nest g module feature-name`
2. Generate controller: `nest g controller feature-name`
3. Generate service: `nest g service feature-name`
4. Implement business logic
5. Add authentication guards if needed
6. Update this README with new endpoints

## Troubleshooting

### Common Issues

**Issue**: "Invalid OAuth credentials"
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- Ensure redirect URI matches Google Cloud Console configuration

**Issue**: "MongoDB connection failed"
- Check `MONGO_URI` in `.env`
- Verify MongoDB server is running
- Check network connectivity and firewall settings

**Issue**: "JWT token expired"
- Use `/token/refresh` endpoint to get new access token
- Check system clock sync (JWT exp depends on accurate time)

**Issue**: "Gmail API quota exceeded"
- Gmail API has daily quotas
- Implement caching to reduce API calls
- Request quota increase from Google Cloud Console

## License

This project is licensed under the UNLICENSED license.

## Support

For issues and questions, please open an issue on the project repository.
