<p align="center">
  <img src="assets/divvy-tab-logo.png" alt="DivvyTab logo" width="400" />
</p>

# Split Bill Backend

NestJS API backend for the **DivvyTab** split-bill app. Built with **Bun**, **Fastify**, and **Bun's native WebSocket server** for performance. Deploys on **Railway** using the Railpack builder.

---

## Table of contents

- [Prerequisites](#prerequisites)
- [Installation & running](#installation--running)
- [Using Bun (not npm)](#using-bun-not-npm)
- [Railway deployment](#railway-deployment)
- [WebSocket](#websocket)
- [Scripts](#scripts)
- [License](#license)

---

## Prerequisites

- **[Bun](https://bun.sh)** (v1.0+) — runtime, package manager, and test runner. Do **not** use Node.js or npm for this project.
- **PostgreSQL** — connection string via `DATABASE_URL`.
- Optional: `FRONTEND_URL` for CORS; `PORT` (default `3000`).

---

## Installation & running

```bash
# Install dependencies (use Bun, not npm)
bun install

# Development (watch mode)
bun run start:dev

# Build
bun run build

# Production run
bun run start:prod
```

Unit tests:

```bash
bun test src
```

See [Scripts](#scripts) for all commands.

---

## Using Bun (not npm)

This project is built for **Bun** as the runtime and package manager. Use Bun everywhere instead of Node/npm.

| Do this                | Don't do this            |
| ---------------------- | ------------------------ |
| `bun install`          | `npm install`            |
| `bun run build`        | `npm run build`          |
| `bun test src`         | `npm test` or `npx jest` |
| `bun run dist/main.js` | `node dist/main.js`      |

- **Why Bun:** Faster installs, native TypeScript, built-in test runner, and native APIs (password hashing, UUIDs, `fetch`) replace extra dependencies. The server uses `Bun.serve()` for HTTP + WebSocket on one port.
- **Lockfile:** Commit `bun.lock` and use `bun install --frozen-lockfile` in CI so builds are reproducible.
- **Scripts:** All `package.json` scripts assume the Bun runtime (e.g. `start` runs `bun run dist/main.js`). Use `bun run <script>` to execute them.

---

## Railway deployment

The app is configured to deploy on [Railway](https://railway.app) using **Railpack** (no Docker).

### Config

- **`railway.json`** (project root):
    - `build.builder`: `"RAILPACK"` — Railway builds with Bun/Railpack.
    - `deploy.startCommand`: `"bun run dist/main.js"` — runs the compiled app after build.

- **Build:** Railway runs `bun install` and your build command (e.g. `bun run build`). Ensure `nest build` (or equivalent) is in your build step so `dist/` exists.

### Environment

Set in the Railway dashboard (or via CLI):

- **`DATABASE_URL`** — PostgreSQL connection string (required).
- **`PORT`** — Optional; Railway often injects this.
- **`FRONTEND_URL`** — Allowed CORS origin (optional).
- **`NODE_ENV`** — Set to `production` in production.

### Flow

1. Push to the linked branch; Railway triggers a build.
2. Railpack installs deps with Bun and runs your build script.
3. On deploy, Railway runs `bun run dist/main.js`.
4. The app listens on `PORT` and serves HTTP + WebSocket on the same port (see [WebSocket](#websocket)).

No Dockerfile is used; everything is driven by `railway.json` and your `package.json` scripts.

---

## WebSocket

Real-time updates (bills, payments, staff) are served over **Bun's native WebSocket server** on the same port as HTTP. There is no Socket.IO; clients use the standard WebSocket API.

### Architecture

- **Single server:** `Bun.serve()` in `src/main.ts` handles both:
    - **HTTP** — All non-WebSocket requests are forwarded to the Nest/Fastify app via `fastify.inject()`.
    - **WebSocket** — Requests to `/ws` with `Upgrade: websocket` are upgraded by Bun; connection lifecycle is handled in `src/websocket/bun-ws.handlers.ts`.
- **Room manager:** `src/websocket/bun-ws.room-manager.ts` (`BunWebSocketRoomManager`) keeps track of which socket is in which room and provides `to(room).emit(event, data)` and `broadcast(event, data)`.
- **Gateway:** `src/websocket/websocket.gateway.ts` (`SocketGateway`) is a Nest service that injects the room manager. Other services (bills, payments, staff) inject `SocketGateway` and call methods like `emitBillCreated`, `emitStaffUpdated`, etc. The gateway translates these into room/broadcast emissions.

### Client contract

- **Connect:** `ws://<host>/ws?token=<JWT>`. The JWT is validated on connection; invalid or missing token results in a close with code `4401`.
- **Send (client → server):** JSON messages with a `type` field (and optional payload). Supported types:
    - `joinRestaurant` — Subscribe to restaurant-scoped events (uses `user.restaurantId` from JWT).
    - `joinBill` — Subscribe to a bill and its restaurant. Payload: `{ "billId": "<id>" }`.
    - `leaveBill` — Unsubscribe from a bill. Payload: `{ "billId": "<id>" }`.
- **Receive (server → client):** JSON messages: `{ "event": "<name>", "data": <payload> }`. Event names include:
    - `bill.created`, `bill.updated`, `bill.closed`
    - `payment.completed`
    - `staffUpdated`

Clients must use a **native WebSocket** (browser `WebSocket` or a thin wrapper), not the Socket.IO client.

### File layout

| File                                   | Role                                                                                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/main.ts`                          | `Bun.serve()`: routes HTTP to Fastify, upgrades `/ws` to WebSocket, wires WS handlers.                                                              |
| `src/websocket/bun-ws.room-manager.ts` | `BunWebSocketRoomManager`: rooms, `addSocket`/`removeSocket`, `addToRoom`/`removeFromRoom`, `to(room).emit()`, `broadcast()`.                       |
| `src/websocket/bun-ws.handlers.ts`     | `createBunWsHandlers(app)`: `open` (JWT auth, add socket), `message` (handle `joinRestaurant` / `joinBill` / `leaveBill`), `close` (remove socket). |
| `src/websocket/websocket.gateway.ts`   | `SocketGateway`: injects room manager; exposes `emitBillCreated`, `emitBillUpdated`, `emitBillClosed`, `emitStaffUpdated`, `emitPaymentCompleted`.  |
| `src/websocket/websocket.module.ts`    | Nest module: provides `BunWebSocketRoomManager` and `SocketGateway`, imports auth/user modules for JWT/user lookup.                                 |

### Adding or changing WebSocket behaviour

- **New event (same rooms):** Add a method on `SocketGateway` that calls `this.roomManager.to(...).emit(...)` or `this.roomManager.broadcast(...)`. Inject `SocketGateway` in the service that should trigger it and call the new method. No change to handlers or client message types.
- **New room or message type:** In `bun-ws.handlers.ts`, in the `message` handler, add a `case` for a new JSON `type` (e.g. `joinTable`) and call `roomManager.addToRoom(ws, 'table:<id>')` or `removeFromRoom` as needed. Document the new `type` and any payload in this README (Client contract).
- **New event name:** Use a consistent naming scheme (e.g. `resource.action`). Emit it from `SocketGateway` and document it under “Receive (server → client)”.
- **Auth or data on connect:** Token is read from `?token=...` and validated in `open()` via `JwtService` and `UsersService`. To attach more data to the socket, extend the `data` object passed in `server.upgrade(req, { data: { ... } })` in `main.ts` and the `BunWs`-like shape used in the handlers/room manager.

---

## Scripts

| Script           | Command                | Description                               |
| ---------------- | ---------------------- | ----------------------------------------- |
| **build**        | `bun run build`        | Compile with Nest/SWC into `dist/`.       |
| **start**        | `bun run start`        | Run compiled app: `bun run dist/main.js`. |
| **start:dev**    | `bun run start:dev`    | Nest in watch mode (rebuild on change).   |
| **start:prod**   | `bun run start:prod`   | Same as `start`; use after build.         |
| **test**         | `bun test src`         | Run unit tests (Bun test runner).         |
| **test:watch**   | `bun run test:watch`   | Run tests in watch mode.                  |
| **test:cov**     | `bun run test:cov`     | Run tests with coverage.                  |
| **test:e2e**     | `bun run test:e2e`     | Run e2e tests (e.g. `bun test test`).     |
| **lint**         | `bun run lint`         | ESLint with fix.                          |
| **format**       | `bun run format`       | Prettier write.                           |
| **format:check** | `bun run format:check` | Prettier check only.                      |

---

## License

UNLICENSED (see repository or `package.json`).
