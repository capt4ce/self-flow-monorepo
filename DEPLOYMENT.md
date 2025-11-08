# Deployment Guide

This guide covers deploying the self-flow monorepo to production. The application consists of:

- **Backend**: Cloudflare Workers (Hono API)
- **Frontend**: Next.js static site on Cloudflare Pages
- **Database**: Neon Postgres (already hosted)
- **Auth**: Stack Auth

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally with `npm install -g wrangler`
3. **Cloudflare API Token**: Generate one at [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
4. **Neon Database**: Already set up with connection string
5. **Stack Auth**: Project ID and secret

## Step 1: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate with your Cloudflare account.

## Step 2: Deploy Backend (Cloudflare Workers)

### 2.1 Set Production Secrets

The backend requires the following secrets in Cloudflare Workers:

```bash
cd packages/be-serverless

# Set Stack Auth credentials
wrangler secret put STACK_PROJECT_ID
# Enter your Stack project ID when prompted

wrangler secret put STACK_PROJECT_SECRET
# Enter your Stack project secret when prompted

# Set Stack JWKS URL (optional, can be computed from project ID)
wrangler secret put STACK_JWKS_URL
# Enter: https://api.stack-auth.com/api/v1/projects/{YOUR_PROJECT_ID}/.well-known/jwks.json

# Set database connection string
wrangler secret put DATABASE_URL
# Enter your Neon database connection string when prompted

# Set frontend URL for CORS
wrangler secret put FRONTEND_URL
# Enter your production frontend URL (e.g., https://your-app.pages.dev)
```

### 2.2 Update wrangler.toml (Optional)

You can add production-specific configuration to `wrangler.toml`:

```toml
name = "be-serverless"
main = "index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# Production environment
[env.production]
# Secrets are set via wrangler secret put, not in this file

# Routes (optional - if you want a custom domain)
# routes = [
#   { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
# ]
```

### 2.3 Build and Deploy

```bash
# From the root directory
pnpm install

# Build all packages (if needed)
pnpm build

# Deploy backend
cd packages/be-serverless
pnpm deploy
# Or use: wrangler deploy
```

After deployment, you'll get a URL like: `https://be-serverless.{your-subdomain}.workers.dev`

**Note the backend URL** - you'll need it for the frontend deployment.

## Step 3: Deploy Frontend (Cloudflare Pages)

### 3.1 Build Configuration

The frontend uses Next.js with static export. Update `packages/fe/next.config.ts` if needed:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Enable static export
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
```

### 3.2 Set Environment Variables

You'll need to set these in Cloudflare Pages dashboard or via Wrangler:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. Create a new project or select your existing project
3. Go to Settings → Environment variables
4. Add the following variables:

   - `NEXT_PUBLIC_API_URL`: Your backend URL (e.g., `https://be-serverless.{your-subdomain}.workers.dev/api`)
   - `NEXT_PUBLIC_STACK_PROJECT_ID`: Your Stack Auth project ID
   - Any other `NEXT_PUBLIC_*` variables your app needs

### 3.3 Deploy via Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. Click "Create a project"
3. Connect your Git repository (GitHub, GitLab, or Bitbucket)
4. Configure build settings:
   - **Framework preset**: Next.js (Static HTML Export)
   - **Build command**: `cd packages/fe && pnpm install && pnpm build`
   - **Build output directory**: `packages/fe/out` (or `.next` if not using static export)
   - **Root directory**: `/` (monorepo root)
   - **Node version**: `18` or higher
5. Add environment variables (see Step 3.2)
6. Click "Save and Deploy"

### 3.4 Deploy via Wrangler (Alternative)

```bash
# Build the frontend first
cd packages/fe
pnpm install
pnpm build

# Deploy to Cloudflare Pages
wrangler pages deploy out --project-name=your-project-name
```

### 3.5 Update Backend CORS

After deploying the frontend, update the backend's CORS configuration to allow your production frontend URL:

```bash
cd packages/be-serverless
wrangler secret put FRONTEND_URL
# Enter your Cloudflare Pages URL (e.g., https://your-app.pages.dev)
```

Then redeploy the backend:

```bash
wrangler deploy
```

## Step 4: Update Frontend API URL

If your backend URL changed after deployment, update the frontend environment variable:

1. Go to Cloudflare Dashboard → Pages → Your Project → Settings → Environment variables
2. Update `NEXT_PUBLIC_API_URL` to point to your backend Workers URL
3. Trigger a new deployment

## Step 5: Custom Domain (Optional)

### Backend Custom Domain

1. Go to Cloudflare Dashboard → Workers & Pages → Your Worker
2. Go to Settings → Triggers
3. Add a custom domain (requires your domain to be on Cloudflare)

### Frontend Custom Domain

1. Go to Cloudflare Dashboard → Pages → Your Project
2. Go to Custom domains
3. Add your custom domain
4. Update DNS records as instructed

## Automated Deployment with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8.15.5
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          workingDirectory: packages/be-serverless
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8.15.5
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: cd packages/fe && pnpm build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: your-project-name
          directory: packages/fe/out
```

Add these secrets to your GitHub repository:
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID (found in dashboard)

## Environment Variables Summary

### Backend (Cloudflare Workers Secrets)
- `STACK_PROJECT_ID`
- `STACK_PROJECT_SECRET`
- `STACK_JWKS_URL` (optional)
- `DATABASE_URL`
- `FRONTEND_URL`

### Frontend (Cloudflare Pages Environment Variables)
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_STACK_PROJECT_ID`: Stack Auth project ID
- Any other `NEXT_PUBLIC_*` variables

## Troubleshooting

### Backend Deployment Issues

- **Build errors**: Ensure all dependencies are installed with `pnpm install`
- **Secret errors**: Verify all secrets are set with `wrangler secret list`
- **Database connection**: Test your `DATABASE_URL` format (should start with `postgresql://`)

### Frontend Deployment Issues

- **Build fails**: Check that `next.config.ts` has `output: 'export'` for static export
- **API calls fail**: Verify `NEXT_PUBLIC_API_URL` is set correctly
- **CORS errors**: Ensure backend's `FRONTEND_URL` secret includes your frontend URL

### Database Migration

Before deploying, ensure your database schema is up to date:

```bash
cd packages/db
npx drizzle-kit push --config=src/drizzle/config/drizzle.config.ts
```

Or run migrations:

```bash
cd packages/db
npx drizzle-kit migrate --config=src/drizzle/config/drizzle.config.ts
```

## Quick Deploy Checklist

- [ ] Authenticated with Cloudflare (`wrangler login`)
- [ ] Set all backend secrets (`wrangler secret put`)
- [ ] Deployed backend (`wrangler deploy`)
- [ ] Set frontend environment variables in Cloudflare Pages
- [ ] Built frontend (`pnpm build` in packages/fe)
- [ ] Deployed frontend (via dashboard or wrangler)
- [ ] Updated backend CORS with frontend URL
- [ ] Tested API connection from frontend
- [ ] Database migrations applied

## Post-Deployment

1. Test all API endpoints
2. Verify authentication flow
3. Check CORS configuration
4. Monitor Cloudflare Workers analytics
5. Set up error tracking (optional)


