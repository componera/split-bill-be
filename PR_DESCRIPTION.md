Resolves #1

- Migrates the entire backend from Node.js/Express to **Bun/Fastify** with **SWC** compilation, replacing heavy npm dependencies with Bun-native APIs and adding a full unit test suite
- Optimizes Railway deployment with **Railpack** (no Docker) and tunes TypeORM/Fastify for production throughput
- Adds **GitHub Actions CI** to run build and tests on every pull request

## Changes

### Runtime & Framework

- Replaced **Node.js** with **Bun** as the runtime across all scripts and Railway config
- Switched NestJS HTTP adapter from **Express** to **Fastify** with performance tuning (`trustProxy`, `caseSensitive`, `bodyLimit`, graceful shutdown)
- Replaced `cookie-parser` (Express middleware) with `@fastify/cookie` (Fastify plugin)
- Updated `auth.controller.ts` and `lightspeed.controller.ts` to use Fastify `FastifyRequest`/`FastifyReply` types

### Dependency Replacements

- **axios** → Bun native `fetch` in `yoco.service.ts`, `lightspeed.service.ts`, `lightspeed.oauth.service.ts`
- **bcrypt** → `Bun.password.hash()` / `Bun.password.verify()` in `auth.service.ts`, `users.service.ts` (backward-compatible with existing bcrypt hashes)
- Removed `axios`, `bcrypt`, `cookie-parser`, `crypto`, `jsonwebtoken`, `@types/express`, `@types/bcrypt` from dependencies; **Socket.IO** and `@nestjs/platform-socket.io` / `@nestjs/websockets` removed in favour of Bun’s native WebSocket (see WebSocket section)

### Build & Compilation

- Enabled **SWC** builder in `nest-cli.json` (~100ms builds vs ~10s with tsc)
- Added `Relation<>` type wrappers on all 6 TypeORM entities to fix SWC circular dependency resolution
- Used `import type { Relation }` syntax to fix Bun's ESM module resolution
- Bumped tsconfig target to `ES2022`, added `bun-types`

### Production Optimizations

- TypeORM: connection pool increased to 25, logging and synchronize disabled in production
- Fastify: production-only log levels (`error`, `warn`), buffered logs, `ignoreTrailingSlash`
- JWT token pairs now generated with `Promise.all()` (parallel signing)

### Deployment

- **Railway**: Switched to **Railpack** builder (removed Dockerfile / `.dockerignore`); `railway.json` uses `builder: "RAILPACK"` and `startCommand: "bun run dist/main.js"`
- Schema URL updated to `https://railway.com/railway.schema.json`

### Staff Module

- Staff API is **restaurant-scoped**: `getAll` and `invite` use `restaurantId` from JWT (`@Req() req`, `(req as any).user.restaurantId`)
- Replaced legacy invite entity with **InviteToken** (auth entity); invites include `restaurantId`, `role`, and `token`; **EmailService** sends invite emails
- **UserRole** enum used for invite role and for promote/demote (replacing string `'admin'`/`'staff'`)
- **SocketGateway** emits `emitStaffUpdated()` on invite, revoke, promote, demote, remove
- **remove(userId)** now validates user exists and throws `NotFoundException` before delete
- **staff.service.spec.ts** rewritten for new API: mocks for SocketGateway and EmailService, tests for getAll, invite, revokeInvite, promote, demote, remove

### WebSocket (Bun native)

- Replaced **Socket.IO** with **Bun’s native WebSocket server** for better performance; single `Bun.serve()` handles both HTTP (via Fastify inject) and WebSocket upgrades on `/ws`
- **BunWebSocketRoomManager** (`bun-ws.room-manager.ts`) manages rooms and emissions: `to(room).emit()`, `broadcast()`, with guard clauses and JSDoc
- **Bun WS handlers** (`bun-ws.handlers.ts`): JWT auth from `?token=...` on connect, JSON message types `joinRestaurant` / `joinBill` / `leaveBill`; handlers use Nest’s `JwtService` and `UsersService`
- **SocketGateway** now injects the room manager only (no Nest WebSocket decorators); same emit API for bills, staff, and payments so services are unchanged
- Removed `@nestjs/platform-socket.io`, `@nestjs/websockets`, and `socket.io` from dependencies
- **Client contract**: connect to `ws://host/ws?token=<JWT>`; send JSON `{ type, billId? }` for join/leave; receive JSON `{ event, data }` (e.g. `bill.created`, `staffUpdated`, `payment.completed`). Frontend must use native WebSocket (or a thin wrapper), not the Socket.IO client.

### CI

- **GitHub Actions** workflow (`.github/workflows/ci.yml`) runs on every PR to `main`/`master`
- Jobs: checkout → setup Bun → cache deps → `bun install --frozen-lockfile` → `bun run build` → `bun test src`
- Enables branch protection so PRs must pass CI before merge

### Test Suite

- **113 tests** across **18 test files** using Bun's native test runner (`bun test src`)
- Full coverage of all services: auth, users, bills, payments, yoco, restaurants, staff, admin, bill-splits, QR, email
- Guard tests: JWT auth, roles, restaurant tenant isolation
- **WebSocket tests added:** `bun-ws.room-manager.spec.ts` (room manager: addSocket, removeSocket, addToRoom, removeFromRoom, to().emit, broadcast), `websocket.gateway.spec.ts` (SocketGateway emit methods), `bun-ws.handlers.spec.ts` (createBunWsHandlers: open auth, message join/leave, close)
- Replaced Jest with Bun test runner (no transform step, native TypeScript)

### Documentation

- **README.md** rewritten: prerequisites (Bun, PostgreSQL), installation and running with Bun, “Using Bun (not npm)” table and rationale, **Railway** section (railway.json, Railpack, env vars, deploy flow), **WebSocket** section (architecture, client contract, file layout, how to add or change events/rooms), scripts table
- **CONTRIBUTING.md** added: use Bun everywhere (install, scripts, tests, CI), prefer Bun-native APIs with examples (UUID → `Bun.randomUUID`/`Bun.randomUUIDv7`, password → `Bun.password.hash`/`verify`, HTTP → `fetch`), testing guide (file naming, imports, structure, mocking repos and services, Nest TestingModule, assertions, adding/updating tests)

## Test plan

- [x] `bun run build` — SWC compiles in ~100ms
- [x] `bun test src` — 113 tests pass (includes WebSocket specs)
- [x] App bootstraps with `bun run dist/main.js` (NestJS + Fastify initializes all modules)
- [x] CI workflow runs on PR (build + tests)
- [ ] Deploy to Railway staging and verify health endpoint returns `OK`
- [ ] Verify existing user login works (bcrypt hash backward compatibility)
- [ ] Verify Yoco checkout and Lightspeed OAuth flows work with native fetch
- [ ] Verify WebSocket connections work with Bun native server: connect to `ws://host/ws?token=<JWT>`, send `joinRestaurant` / `joinBill` / `leaveBill` JSON, receive `{ event, data }` (frontend must use native WebSocket client)
