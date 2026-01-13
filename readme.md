# Email Management System

A modern, full-stack email management application that integrates with Gmail API, featuring AI-powered email summarization, semantic search, and Kanban-style email organization.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Deployed URLs](#deployed-urls)
- [Google OAuth Setup](#google-oauth-setup)
- [Token Storage & Security](#token-storage--security)
- [Token Expiry Simulation](#token-expiry-simulation)
- [Third-party Services](#third-party-services)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

This Email Management System provides a powerful interface for managing Gmail emails with modern features like AI-powered email analysis, semantic search, and Kanban board organization.

The application consists of two main parts:
- **Frontend**: React-based SPA with modern UI/UX (Vite + React 19)
- **Backend**: NestJS REST API with Gmail and AI integration

## Features

### Core Features
- **Google OAuth Authentication**: Secure login with Google accounts
- **Gmail Integration**: Full read, send, and modify permissions
- **Email Management**: View, search, compose, reply, and organize emails
- **Attachment Support**: Upload, download, and preview email attachments
- **Real-time Sync**: Automatic synchronization with Gmail

### AI-Powered Features
- **Email Summarization**: AI-generated summaries using Google Gemini
- **Semantic Search**: Find emails by meaning using vector embeddings
- **Smart Metadata Extraction**: Automatic priority, category, and deadline detection

### Advanced Features
- **Kanban Board**: Organize emails into customizable columns (up to 10 custom columns)
- **Dual View Modes**: Toggle between List and Kanban views
- **Keyword & Semantic Search**: Two search modes for different use cases
- **Email Status Management**: Track email progress (Inbox, To Do, In Progress, Done)
- **Open in Gmail**: Quick access to emails in Gmail web interface
- **Drag-and-Drop**: Organize emails by dragging between Kanban columns

## Tech Stack

### Frontend
- **Framework**: React 19.2 with TypeScript
- **Build Tool**: Vite 7.x
- **Routing**: React Router DOM 7.x
- **State Management**: Zustand + TanStack Query
- **UI**: Tailwind CSS 4.x, Lucide React icons
- **Drag & Drop**: @dnd-kit
- **HTTP Client**: Axios

### Backend
- **Framework**: NestJS 11.x with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Passport.js + Google OAuth 2.0
- **Email Service**: Gmail API (googleapis)
- **AI Services**: Google Gemini AI for summarization and semantic search
- **Security**: bcryptjs for password hashing

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd email_g03
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file (see Configuration section)
# Add your credentials to .env

# Start development server
npm run start:dev
```

Backend will run on `http://localhost:3000`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Access the Application

Open your browser and navigate to `http://localhost:5173` and click "Sign in with Google" to authenticate.

## Deployed URLs

### Live Production URLs

- **Frontend**: [https://email-g03.vercel.app](https://email-g03.vercel.app)
- **Backend**: [https://email-g03-backend.vercel.app](https://email-g03-backend.vercel.app)

Both frontend and backend are deployed on **Vercel** for optimal performance and reliability.

## Google OAuth Setup

### Steps to Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Create **OAuth Client ID** → Application type: **Web application**
3. Enable required APIs:
   - Gmail API
   - Google+ API (for profile information)
4. Configure OAuth consent screen with required scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `email`
   - `profile`
5. Add **Authorized redirect URIs**:
   - Local development: `http://localhost:3000/auth/google/callback`
   - Production: `https://email-g03-backend.vercel.app/auth/google/callback`
6. Copy **Client ID** and **Client Secret** to backend `.env` file

### Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add to backend `.env` as `GG_API_KEY`

### Backend Environment Variables

Create `.env` file in `backend/` directory:

```env
# JWT Secret
JWT_SECRET="your-jwt-secret-key"

# Google Gemini AI API Key
GG_API_KEY="your-gemini-api-key"

# MongoDB Connection String
MONGO_URI="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# Frontend URL
FRONTEND_URL="http://localhost:5173"

# Environment
ENVIRONMENT="development"
```

For detailed setup instructions, see [Backend README](backend/README.md#google-oauth-setup).

## Token Storage & Security

### Token Types & Storage

The application uses **three types of tokens**:

1. **Access Token (JWT)**
   - Purpose: Authenticates API requests
   - Storage: **HttpOnly cookie** (client-side)
   - Expiry: 15 minutes
   - Contains: `{ id: userId }`

2. **Refresh Token**
   - Purpose: Generates new access tokens without re-authentication
   - Storage: **HttpOnly cookie** (client) + **MongoDB** (server)
   - Expiry: 7 days
   - Used to refresh expired access tokens

3. **Google OAuth Tokens**
   - Purpose: Access Gmail API
   - Storage: **MongoDB** (encrypted at rest)
   - Automatically managed by backend

### Why HttpOnly Cookies?

We chose **HttpOnly cookies** over localStorage for token storage because:

✅ **Much safer than localStorage**
- Cookies cannot be accessed via JavaScript → **protected from XSS attacks**
- Browsers automatically send cookies with requests
- Backend has full control over token lifecycle

✅ **Security Best Practices**
- `HttpOnly` flag prevents JavaScript access
- `Secure` flag ensures HTTPS-only transmission (production)
- `SameSite` policy prevents CSRF attacks:
  - Development: `lax` - allows same-site navigation
  - Production: `none` + `Secure` - allows cross-origin

❌ **Why NOT localStorage?**
- Vulnerable to XSS attacks (malicious scripts can steal tokens)
- No built-in expiry mechanism
- Requires manual management in every request

### Security Considerations

1. **Authentication & Authorization**
   - JWT tokens required for all protected endpoints
   - Short access token lifetime (15 min) reduces risk window
   - Refresh token rotation on logout

2. **Password Security**
   - Passwords hashed with bcrypt (10 salt rounds)
   - Never stored or transmitted in plain text

3. **Data Privacy**
   - User data isolation (all queries filtered by userId)
   - Email content only accessible to authenticated owner
   - Google tokens and passwords never exposed in API responses

4. **Production Security**
   - Always use HTTPS in production
   - CORS configured for specific origins only
   - Input validation on all endpoints
   - Rate limiting recommended for APIs

For detailed security information, see [Backend README - Security](backend/README.md#security-considerations).

## Token Expiry Simulation

### How Token Refresh Works

The application implements automatic token refresh:

```
1. Access token expires (15 min)
   ↓
2. Frontend detects 401 Unauthorized
   ↓
3. Frontend calls GET /token/refresh
   ↓
4. Backend validates refresh token (from cookie)
   ↓
5. Backend generates new access token
   ↓
6. New access token set as HttpOnly cookie
   ↓
7. Frontend retries original request
   ↓
8. Request succeeds with new token
```

### Demo Token Refresh

To test token refresh manually:

#### Method 1: Chrome DevTools

1. Open **Chrome DevTools** → **Application** → **Cookies**
2. Find domain `localhost:3000` (or your backend domain)
3. Locate cookie named `accessToken`
4. **Delete** the `accessToken` cookie
5. Perform any action that requires authentication (e.g., view emails)
6. Check Network tab - you'll see:
   - Initial request fails with 401
   - Automatic call to `/token/refresh`
   - New access token cookie set
   - Original request retried and succeeds

#### Method 2: Browser Console

```javascript
// Delete access token cookie
document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

// Try to fetch emails (will auto-refresh token)
// The app will automatically handle the refresh
```

### What Happens

- The **access token cookie** is deleted/expired
- Frontend detects missing authentication
- Automatically triggers **refresh token** request to backend: `GET /token/refresh`
- Backend validates **refresh token** (still in HttpOnly cookie)
- Backend issues **new access token**
- Frontend continues operation seamlessly

This demonstrates the **automatic token refresh flow** without requiring user to log in again.

## Third-party Services

The application integrates with the following third-party services:

1. **Google OAuth** - User authentication
2. **Gmail API** - Email operations (read, send, modify)
3. **Google Gemini AI** - Email summarization and semantic search
4. **MongoDB Atlas** - Cloud database (optional, can use local MongoDB)
5. **Vercel** - Frontend and backend deployment
6. **Google Cloud Platform** - OAuth credentials and API management

## Project Structure

```
email_g03/
├── backend/                    # NestJS Backend API
│   ├── src/
│   │   ├── ai/                # AI features
│   │   ├── auth/              # Authentication
│   │   ├── emails/            # Email management
│   │   ├── kanban/            # Kanban board
│   │   ├── mailboxes/         # Mailbox operations
│   │   ├── token/             # Token management
│   │   ├── user/              # User management
│   │   └── main.ts            # Entry point
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── README.md              # Backend docs
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── api/               # API client
│   │   ├── components/        # React components
│   │   │   ├── Email/
│   │   │   ├── Kanban/
│   │   │   ├── Layout/
│   │   │   └── UI/
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   ├── store/             # State management
│   │   └── main.tsx           # Entry point
│   ├── package.json
│   └── vite.config.ts
│
└── README.md                   # This file
```

## API Documentation

### Base URL
- Development: `http://localhost:3000`
- Production: `https://email-g03-backend.vercel.app`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | OAuth callback |
| POST | `/auth/login` | Email/password login |
| GET | `/auth/logout` | Logout user |
| GET | `/token/refresh` | Refresh access token |
| GET | `/mailboxes` | Get all mailboxes |
| GET | `/mailboxes/:id/emails` | Get emails in mailbox |
| GET | `/emails/:id` | Get email details |
| POST | `/emails/send` | Send new email |
| POST | `/emails/:id/reply` | Reply to email |
| POST | `/ai/search` | Semantic search |
| POST | `/ai/emails/:id/summarize` | AI summarize email |
| GET | `/kanban/columns` | Get Kanban columns |
| POST | `/kanban/columns` | Create Kanban column |

For complete API documentation, see [Backend README - API Documentation](backend/README.md#api-documentation).

## Development

### Backend Development

```bash
cd backend

# Development with hot reload
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test

# Lint & format
npm run lint
npm run format
```

### Frontend Development

```bash
cd frontend

# Development with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Deployment

### Backend Deployment (Vercel)

1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Frontend Deployment (Vercel)

1. Push code to GitHub
2. Import project to Vercel
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_API_URL`
6. Deploy automatically

### Important: Update OAuth Redirect URIs

After deployment, add production URLs to Google Cloud Console:
```
https://email-g03-backend.vercel.app/auth/google/callback
```

## Troubleshooting

### Common Issues

**Issue**: "Cannot connect to MongoDB"
- Check `MONGO_URI` in `.env`
- Verify MongoDB is running
- Check IP whitelist in MongoDB Atlas

**Issue**: "Invalid OAuth credentials"
- Verify Google OAuth credentials in `.env`
- Ensure redirect URI matches Google Cloud Console
- Check that Gmail API is enabled

**Issue**: "JWT token expired"
- The app should automatically refresh tokens
- If not working, check `/token/refresh` endpoint
- Clear all cookies and log in again

**Issue**: "Gmail API quota exceeded"
- Gmail API has daily quotas
- Wait 24 hours or request quota increase

For more troubleshooting, see [Backend README - Troubleshooting](backend/README.md#troubleshooting).

## License

This project is licensed under the UNLICENSED license - proprietary software for academic purposes.

## Team

- **Group**: g03
- **Project**: Email Management System
- **Academic Year**: 2025-2026, HK1
- **Course**: Advanced Web Development

---

**Built with ❤️ by Team g03**