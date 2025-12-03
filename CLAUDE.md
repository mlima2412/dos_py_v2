# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DOSPY v2 is a business management platform split into two independent projects:

- **admin/** - React + TypeScript + Vite frontend
- **api/** - NestJS + Prisma backend

The projects communicate via REST API with automatic TypeScript client generation using Kubb from OpenAPI specs.

## Development Workflow

### Initial Setup

**API (Backend):**

```bash
cd api
npm install
npx prisma generate
npx prisma db push
npm run dev  # Runs on http://localhost:3000
```

**Admin (Frontend):**

```bash
cd admin
npm install
npm run dev:with-api  # Generates API client AND starts dev server on http://localhost:5173
# OR
npm run generate:api  # Just regenerate API client
npm run dev          # Just start dev server
```

### Common Commands

**API:**

- `npm run dev` - Development with watch mode
- `npm run build` - Compile TypeScript (includes i18n copy)
- `npm run start:prod` - Run compiled version
- `npm run test` - Run tests
- `npm run seed` - Seed database
- `npm run lint` - Run ESLint

**Admin:**

- `npm run dev` - Development server
- `npm run dev:with-api` - Regenerate API client and start dev
- `npm run generate:api` - Generate API client from OpenAPI spec
- `npm run build` - Production build
- `npm run lint` - Run ESLint

### Working with Database

1. Update `api/prisma/schema.prisma`
2. Run `npx prisma db push` to update database
3. Run `npx prisma generate` to update Prisma client
4. Restart the API dev server

## MCP Servers

In this project there are MCP for database connectivity available for use:
-v1db-mcp-server is used for connectivity with the old version of the system and should not be used unless migration comparisons are relevant
-v2db-mcp-server is used for application data pool. Before using keep in mind the @schema.prisma file to understand the structure of this database and avoid unnecessary select type trial and error

### Updating API Client

When backend API changes:

```bash
cd admin
npm run generate:api  # Reads openapi.json and regenerates src/api-client/
```

The API client is automatically generated using Kubb and includes:

- TypeScript types (`src/api-client/types/`)
- Zod schemas (`src/api-client/schemas/`)
- React Query hooks (`src/api-client/hooks/`)

## Architecture

### Backend (NestJS)

**Module-based architecture:** Each domain has its own module with controller, service, and DTOs following NestJS conventions.

**Key patterns:**

- **Authentication:** JWT-based with refresh tokens. Global `JwtAuthGuard` protects all routes by default (use `@Public()` decorator to skip).
- **Multi-tenancy:** Partner system with `x-parceiro-id` header for data isolation. Users belong to partners via `UsuarioParceiro` junction table.
- **Database:** PostgreSQL via Prisma ORM with comprehensive relations.
- **Validation:** Global `ValidationPipe` with DTOs using `class-validator`.
- **i18n:** Server-side internationalization with `i18next` using `Accept-Language` header.
- **Swagger:** Auto-generated docs at `/docs`, OpenAPI JSON at `/api-json`.
- **Redis:** Used for caching (despesas modules).

**Core domains:**

- **Auth & Users:** Authentication, user management, password reset, profiles (`perfis`)
- **Partners:** Multi-tenant system (`parceiros`, `UsuarioParceiro`)
- **Clients:** Customer management (`clientes`, `CanalOrigem`)
- **Products:** Product catalog with SKU/variant system (`produto`, `produto_sku`, `categoria_produto`)
- **Inventory:** Multi-location stock management (`local_estoque`, `estoque_sku`, `movimento_estoque`, `transferencia_estoque`, `conferencia_estoque`)
- **Expenses:** Expense tracking with recurring support (`despesas`, `despesas_recorrentes`, `contas_pagar`)
- **Purchases:** Purchase orders (`pedido_compra`)
- **Sales:** Sales/orders system (`venda`, `venda_item`) with payment plans (`pagamento`, `parcelamento`, `parcelas`)
- **Payments:** Payment methods (`forma_pagamento`)
- **Suppliers:** Supplier management (`fornecedor`)
- **Currency:** Multi-currency support with exchange rates

**Important details:**

- `publicId` (UUID) is used for external references instead of auto-increment `id`
- Most entities cascade delete related records
- Stock movements create audit trail in `movimento_estoque`
- Prisma schema maps to snake_case database tables while TypeScript uses camelCase
- System initialization runs on startup (`ensureSystemInitialized`)

### Frontend (React)

**Component structure:**

- `pages/` - Route components organized by domain
- `components/` - Reusable UI components (many use Radix UI primitives)
- `contexts/` - React Context providers (`AuthContext`, `PartnerContext`)
- `api-client/` - Auto-generated API client (DO NOT manually edit)
- `lib/` - Utilities including `fetch-client.ts` for API requests
- `i18n/` - Frontend internationalization

**Key patterns:**

- **API Communication:** Uses custom `fetch-client.ts` that auto-injects auth token, language header, and partner header
- **State Management:** React Query for server state, Context API for auth/partner selection
- **Routing:** React Router v6 with `ProtectedRoute` wrapper
- **Forms:** React Hook Form with Zod validation
- **UI Library:** TailwindCSS + Radix UI + shadcn/ui patterns
- **Theming:** Dark/light mode via `next-themes`

**Important conventions:**

- All API calls go through Vite proxy (`/api` → `http://localhost:3000`)
- Partner selection stored in `localStorage` as `selectedPartnerId`
- Auth token in `localStorage` as `accessToken`
- Routes use `publicId` not database `id` for security

### Data Flow

1. Frontend makes request via React Query hook (e.g., `useUsuariosControllerFindAll()`)
2. Request goes through `fetch-client.ts` which adds headers (auth, language, partner)
3. Vite proxy forwards `/api/*` to backend at `localhost:3000`
4. NestJS validates JWT, checks partner context, validates DTOs
5. Service layer interacts with Prisma
6. Response flows back with i18n messages

### Multi-tenancy System

**Partner isolation:** Almost all data is scoped to a partner (`parceiroId` foreign key). The backend uses `x-parceiro-id` header to filter data automatically in most services.

**User-Partner relationship:** Users can belong to multiple partners with different profiles/roles via `UsuarioParceiro`. The frontend allows switching between partners.

**Profile system:** `Perfil` table defines user roles/permissions within a partner (though full RBAC is not yet implemented).

## Testing

**Backend:** Jest for unit and e2e tests

```bash
cd api
npm run test          # Unit tests
npm run test:watch    # Watch mode
npm run test:e2e      # End-to-end tests
```

**Frontend:** No test configuration currently present

## Important Notes

- API must be running before starting frontend development
- After changing Prisma schema, always run `prisma generate` and restart API
- After changing backend routes/DTOs, regenerate frontend API client with `npm run generate:api`
- The `openapi.json` in project root is used by frontend; `admin/openapi.json` is generated copy
- Both projects use Prettier for formatting (`npm run format`)
- Database seed script available at `api/prisma/seed.ts`
- i18n files must be in `api/src/i18n/{pt,es}/translation.json` (copied to dist on build)

## Environment Variables

**API (.env):**

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH=...
APP_PORT=3000
NODE_ENV=development
```

**Admin (.env):**

```
VITE_API_URL=/api  # Uses proxy in development
```
