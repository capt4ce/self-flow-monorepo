# self-flow

## Architecture

- Cloudflare Workers
- Neon Postgres
- Upstash Redis

## Stack

- Typescript
- Monorepo FE n BE n types n helpers (PNPM Workspace + Turborepo)
- Rest API
- Github action

### BE

- Hono (optimized for serverless)
- Neon postgre
- Typeorm

### FE

- Cloudflare pages
- NextJs with static rendering (NO SSR)
- Use React Query with staleTime and ETag to cut API calls and r3act context as state management
- shacdn + tailwind

## Development

### Roadmap

1. Initialize codebase ✅
2. setup basic serverless api for BE ✅
3. setup drizzle ✅
4. backup supabase schema
5. backup data to neon DB
6. setup local env, test, and extend to create DTO
7. setup basic api in FE (using react query & openapi fetch)
8. design db schema (need confirmation about MVP scope)
9. setup db schema
10. Initialize auth (clerk)
11. Create basic functionalities for validations (homepage, login & register)
12. setup deployment pipeline
