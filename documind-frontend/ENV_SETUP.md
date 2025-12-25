# Environment Variables Setup

This document describes how to configure environment variables for the DocuMind frontend application.

## Environment Files

The application supports multiple environment files:

- `.env.example` - Template file with all available variables (committed to git)
- `.env.development` - Development environment variables (not committed)
- `.env.production` - Production environment variables (not committed)
- `.env.local` - Local overrides (highest priority, not committed)

## Required Variables

### API Configuration

```env
# Backend API base URL
VITE_API_BASE_URL=http://localhost:8000

# Default collection name for document storage
VITE_DEFAULT_COLLECTION_NAME=documind_documents
```

### Environment

```env
# Current environment (development, production, etc.)
VITE_ENV=development
```

## Optional Variables

### Feature Flags

```env
# Enable analytics tracking
VITE_ENABLE_ANALYTICS=false

# Enable error tracking (e.g., Sentry)
VITE_ENABLE_ERROR_TRACKING=false
```

### OAuth Redirect URIs

```env
# Google OAuth redirect URI
VITE_GOOGLE_OAUTH_REDIRECT_URI=http://localhost:5173/auth/google/callback

# Microsoft OAuth redirect URI
VITE_MICROSOFT_OAUTH_REDIRECT_URI=http://localhost:5173/auth/microsoft/callback
```

### Public API Keys

```env
# Public API keys (never commit sensitive keys)
VITE_PUBLIC_API_KEY=your_public_key_here
```

## Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env.development
   ```

2. **Fill in the values:**
   - Update `VITE_API_BASE_URL` to match your backend URL
   - Adjust other variables as needed

3. **For production:**
   ```bash
   cp .env.example .env.production
   ```
   - Update all values for production environment
   - Ensure `VITE_API_BASE_URL` points to production API

## Usage in Code

Environment variables are accessed via `import.meta.env`:

```typescript
import { API_BASE_URL, ENV, ENABLE_ANALYTICS } from '@/config/api';

// Or directly:
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

## Important Notes

- All environment variables must be prefixed with `VITE_` to be exposed to the client
- Never commit `.env.development`, `.env.production`, or `.env.local` files
- Sensitive keys should never be in environment variables (use backend API keys instead)
- Environment variables are embedded at build time, not runtime

## Validation

The application validates required environment variables in production mode and will show warnings in the console if critical variables are missing.

