# Local Development Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v8.15.5) - install with `npm install -g pnpm@8.15.5`
- Neon Postgres database account (or any PostgreSQL database)
- Clerk account for authentication

## Environment Variables

You'll need to create environment variable files for different parts of the application:

### 1. Database Environment Variables

Create `.env` files in the following locations with `DATABASE_URL`:

**For database package (`packages/db/.env`):**
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

**For backend services (if needed, `packages/be-serverless/.env`):**
```env
DATABASE_URL=postgresql://user:password@host:port/database
CLERK_API_KEY=your_clerk_api_key
```

### 2. Frontend Environment Variables

Create `packages/fe/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8787/api
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

**For Clerk authentication** (backend also needs):
```env
CLERK_SECRET_KEY=your_clerk_secret_key
```

## Setup Steps

### 1. Install Dependencies

```bash
# From the root of the monorepo
pnpm install
```

### 2. Setup Database

#### Run Database Migrations

From the `packages/db` directory:

```bash
cd packages/db

# Generate migration files (if schema changes)
npx drizzle-kit generate

# Push schema to database (for development)
npx drizzle-kit push --config=src/drizzle/config/drizzle.config.ts

# Or run migrations (alternative)
npx drizzle-kit migrate --config=src/drizzle/config/drizzle.config.ts
```

#### (Optional) Open Drizzle Studio

```bash
cd packages/db
pnpm run dk-studio
```

This will open a visual database editor at `http://localhost:4983`

### 3. Run the Backend Server

The backend is a Hono server designed for Cloudflare Workers. You have two options:

#### Option A: Using Wrangler (Recommended for Cloudflare Workers)

1. Install Wrangler globally:
```bash
npm install -g wrangler
```

2. Create a `wrangler.toml` file in `packages/be-serverless/`:
```toml
name = "self-flow-api"
main = "index.ts"
compatibility_date = "2024-01-01"

[env.development]
vars = { DATABASE_URL = "your-database-url", CLERK_API_KEY = "your-clerk-key" }
```

3. Run the backend:
```bash
cd packages/be-serverless
wrangler dev
```

#### Option B: Using Hono's Built-in Dev Server (Alternative)

You may need to add a dev script. Add to `packages/be-serverless/package.json`:
```json
"scripts": {
  "dev": "tsx watch index.ts"
}
```

And install `tsx`:
```bash
cd packages/be-serverless
pnpm add -D tsx @hono/node-server
```

### 4. Run the Frontend

From the root directory:
```bash
pnpm dev
```

Or specifically for the frontend:
```bash
cd packages/fe
pnpm dev
```

The frontend will start on `http://localhost:3000` and expect the backend API at `http://localhost:8787/api`.

## Quick Start (TL;DR)

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment variables
# Create .env files as described above

# 3. Setup database
cd packages/db
npx drizzle-kit push --config=src/drizzle/config/drizzle.config.ts

# 4. Start backend (in one terminal)
cd packages/be-serverless
wrangler dev  # or use alternative method

# 5. Start frontend (in another terminal, from root)
pnpm dev
```

## Troubleshooting

### Database Connection Issues
- Ensure your `DATABASE_URL` is correct and accessible
- Check that your database is running and accepts connections
- Verify network/firewall settings if using a remote database

### Backend Not Starting
- Ensure port 8787 is available (or change `NEXT_PUBLIC_API_URL` in frontend)
- Check that all environment variables are set
- Verify Hono/Wrangler dependencies are installed

### Frontend Can't Connect to Backend
- Verify backend is running on `http://localhost:8787`
- Check `NEXT_PUBLIC_API_URL` environment variable
- Ensure CORS is properly configured if needed

## Development Workflow

- **Database changes**: Update schema in `packages/db/src/drizzle/schema.ts`, then run `drizzle-kit push`
- **Backend changes**: Edit files in `packages/be-serverless/src/` - server should auto-reload
- **Frontend changes**: Edit files in `packages/fe/src/` - Next.js will hot-reload
- **Type changes**: Edit types in `packages/common/types/` - they're shared across packages



