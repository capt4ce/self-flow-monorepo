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
3. setup basic db schema, test, and extend to create DTO
4. setup basic api in FE (using react query & openapi fetch)
5. design db schema (need confirmation about MVP scope)
6. setup db schema
7. Initialize auth (clerk)
8. Create basic functionalities for validations (homepage, login & register)
9. setup deployment pipeline
