# Contributing to Split Bill Backend

Thanks for contributing. This project uses **Bun** as the runtime and tooling and follows a consistent testing style. Please read this guide before submitting changes.

---

## Table of contents

- [Use Bun everywhere](#use-bun-everywhere)
- [Prefer Bun-native APIs](#prefer-bun-native-apis)
- [Testing: overview](#testing-overview)
- [Testing: adding and updating tests](#testing-adding-and-updating-tests)
- [Code style](#code-style)

---

## Use Bun everywhere

- **Package manager:** Use `bun install` (and `bun add` / `bun remove`). Do not use `npm` or `yarn`.
- **Running scripts:** Use `bun run <script>` (e.g. `bun run build`, `bun test src`). Do not use `npm run` or `npx`.
- **Running the app:** Use `bun run dist/main.js` or `bun run start:dev`. Do not use `node`.
- **Tests:** Use the Bun test runner (`bun test src`). Do not use Jest or another Node-based runner for unit tests.
- **CI:** The GitHub Actions workflow uses Bun (see `.github/workflows/ci.yml`). Keep using `bun install --frozen-lockfile` and `bun test src` there.

If you add docs or scripts, reference Bun commands rather than npm/Node.

---

## Prefer Bun-native APIs

Where possible, use Bun’s built-in APIs instead of extra npm packages. This keeps the dependency set small and aligns with the rest of the codebase.

### UUIDs

Use `Bun.randomUUID()` or `Bun.randomUUIDv7()` instead of `crypto.randomUUID()` or the `uuid` package.

```ts
// Prefer
const id = Bun.randomUUID();
const idV7 = Bun.randomUUIDv7(); // time-ordered, good for DBs

// Avoid
import { randomUUID } from 'crypto';
const id = randomUUID();
// or: import { v4 as uuidv4 } from 'uuid';
```

### Password hashing

Use `Bun.password.hash()` and `Bun.password.verify()` with the `bcrypt` algorithm so hashes stay compatible with existing data.

```ts
// Prefer
const hash = await Bun.password.hash(plain, { algorithm: 'bcrypt', cost: 10 });
const ok = await Bun.password.verify(plain, hash);

// Avoid
import * as bcrypt from 'bcrypt';
const hash = await bcrypt.hash(plain, 10);
```

### HTTP requests

Use the global `fetch` (Bun’s implementation). No need for `axios` or `node-fetch`.

```ts
// Prefer
const res = await fetch(url, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
const json = await res.json();

// Avoid
import axios from 'axios';
const { data } = await axios.post(url, data);
```

### JSON

Use `Bun` / native APIs where they fit; the project already uses standard `JSON.parse` / `JSON.stringify`. For very large or streaming JSON, Bun has efficient helpers you can use if needed.

### Tests

Use `bun:test` for `describe`, `it`, `expect`, `beforeEach`, `mock`, `spyOn`, etc. Do not use Jest’s `jest.fn()` or Jest-specific matchers; use Bun’s `mock()` and the compatible expect API (see [Testing](#testing-adding-and-updating-tests)).

---

## Testing: overview

- **Runner:** Bun’s built-in test runner (`bun test`).
- **Location:** Unit tests live next to source files with the suffix `.spec.ts` (e.g. `staff.service.ts` → `staff.service.spec.ts`). E2E tests live under `test/` and are run with `bun run test:e2e` (e.g. `bun test test`).
- **Pattern:** Nest services and guards are tested by building a `TestingModule` with mocked dependencies (repositories, other services, SocketGateway). We use `mock()` from `bun:test` for those mocks and assert on calls and return values.

---

## Testing: adding and updating tests

### File and imports

- Create a test file named `*.spec.ts` next to the file under test (e.g. `user.service.spec.ts` next to `user.service.ts`).
- Import test helpers from `bun:test` and Nest/TypeORM testing utilities as in existing specs:

```ts
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
// Add: mock, spyOn, afterEach from 'bun:test' when needed
```

### Structure

- One top-level `describe('<ClassName>', () => { ... })`.
- Group tests by method or behaviour with nested `describe('<method>', () => { ... })`.
- Use `it('should ...', async () => { ... })` for each case; use `beforeEach` to build the testing module and get the service/guard so each test starts from a clean state.

Example skeleton:

```ts
describe('MyService', () => {
	let service: MyService;
	let repo: any;
	let otherService: any;

	beforeEach(async () => {
		repo = { findOne: mock(() => Promise.resolve(null)), save: mock((e: any) => Promise.resolve(e)) };
		otherService = { doSomething: mock(() => Promise.resolve()) };

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MyService,
				{ provide: getRepositoryToken(MyEntity), useValue: repo },
				{ provide: OtherService, useValue: otherService },
			],
		}).compile();

		service = module.get<MyService>(MyService);
	});

	describe('myMethod', () => {
		it('should return result when entity exists', async () => {
			repo.findOne.mockResolvedValue({ id: '1', name: 'Test' });

			const result = await service.myMethod('1');

			expect(repo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
			expect(result.name).toBe('Test');
		});

		it('should throw when entity not found', async () => {
			repo.findOne.mockResolvedValue(null);

			expect(service.myMethod('missing')).rejects.toThrow(NotFoundException);
		});
	});
});
```

### Mocking dependencies

- **Repositories:** Use a plain object with the same method names as the TypeORM repository (e.g. `findOne`, `find`, `create`, `save`, `delete`, `update`). Create mocks with `mock(() => Promise.resolve(...))` or `mock((arg) => Promise.resolve(arg))`, then override per test with `.mockResolvedValue(...)` or `.mockResolvedValueOnce(...)`.

```ts
userRepo = {
	findOne: mock(() => Promise.resolve(null)),
	find: mock(() => Promise.resolve([])),
	create: mock((entity: any) => entity),
	save: mock((entity: any) => Promise.resolve({ id: 'user-1', ...entity })),
	delete: mock(() => Promise.resolve({ affected: 1 })),
};
// In a test:
userRepo.findOne.mockResolvedValue(mockUser);
```

- **Other services (e.g. SocketGateway, EmailService):** Same idea: object with methods created with `mock(() => {})` or `mock(() => Promise.resolve())`, then `.mockResolvedValue` / `.toHaveBeenCalledWith` in the test.

```ts
socketGateway = {
	emitBillCreated: mock(() => {}),
	emitBillUpdated: mock(() => {}),
};
// Assert in test:
expect(socketGateway.emitBillCreated).toHaveBeenCalledWith('rest-1', expect.objectContaining({ id: 'bill-1' }));
```

- **Bun APIs (e.g. `Bun.password`):** Use `spyOn` from `bun:test` so you don’t actually hash or verify in tests. Restore in `afterEach` if you modify global state.

```ts
import { describe, it, expect, beforeEach, spyOn, afterEach } from 'bun:test';

beforeEach(() => {
	spyOn(Bun.password, 'hash').mockResolvedValue('$2b$10$fakehash');
	spyOn(Bun.password, 'verify').mockResolvedValue(true);
});
afterEach(() => {
	Bun.password.hash.mockRestore?.();
	Bun.password.verify.mockRestore?.();
});
// In test:
expect(Bun.password.hash).toHaveBeenCalledWith('plaintext', { algorithm: 'bcrypt', cost: 10 });
```

### Nest testing module

- Use `Test.createTestingModule({ providers: [...] }).compile()` and then `module.get<Service>(Service)`.
- For TypeORM repositories, use `getRepositoryToken(Entity)` from `@nestjs/typeorm`:

```ts
{ provide: getRepositoryToken(User), useValue: userRepo }
```

- Only provide the dependencies the class under test actually uses. Mock external modules (e.g. `SocketGateway`, `EmailService`) with `useValue` so tests stay fast and deterministic.

### Assertions

- **Calls:** `expect(mockFn).toHaveBeenCalled()`, `toHaveBeenCalledWith(...)`, `toHaveBeenCalledTimes(n)`.
- **Return value:** `expect(result).toEqual(...)`, `expect(result).toHaveProperty('id')`, etc.
- **Exceptions:** For async code that should throw, use `expect(service.method(...)).rejects.toThrow(NotFoundException)` (no `await` on the outer `expect`).

### Adding tests for new code

1. **New service method:** Add a nested `describe('<methodName>')` and one or more `it('should ...')` that:
    - Set up mocks (e.g. `repo.findOne.mockResolvedValue(...)`).
    - Call the method.
    - Assert repository/service calls and return value (or that the right exception is thrown).
2. **New dependency:** Add a mock for it in `beforeEach` and to the `providers` list (`{ provide: X, useValue: mockX }`). In tests that use the new dependency, assert it was called as expected.
3. **New guard or pipe:** Follow the pattern in `jwt-auth.guard.spec.ts`: build a minimal `ExecutionContext` (e.g. mock request with headers), get the guard from the testing module, call `canActivate(context)` or the pipe’s method, and assert on the result and on mocked services (e.g. `JwtService.verify`, `UsersService.findById`).

### Updating tests when behaviour changes

- **Signature or behaviour change:** Update the test to pass the new arguments and/or mock the new dependencies. Adjust `expect(...).toHaveBeenCalledWith(...)` and return value assertions to match the new API.
- **New dependency in constructor:** Add a mock in `beforeEach` and `providers`; existing tests may still pass if the new dependency isn’t used in the code path under test, but add or adjust tests where it is used.
- **Renamed or removed method:** Update or remove the corresponding `describe`/`it` blocks and fix any references in other tests (e.g. to a renamed method on a mock).
- **Bun API usage (e.g. new `Bun.password` call):** If the implementation now uses a Bun API that wasn’t used before, add a `spyOn` in the spec and assert it’s called as expected, so tests don’t depend on real hashing or external behaviour.

After changes, run:

```bash
bun test src
```

and fix any failing or new tests. CI runs the same command on every PR.

---

## Code style

- **Formatting:** Use Prettier (`bun run format`). CI can run `bun run format:check` to enforce it.
- **Linting:** Use ESLint (`bun run lint`). Fix reported issues before submitting.
- **WebSocket and services:** Prefer guard clauses and small, documented functions as in `src/websocket/bun-ws.room-manager.ts` and `bun-ws.handlers.ts`. When adding new WebSocket events or message types, update the README “WebSocket” section and any relevant comments.

If you have questions, open an issue or ask in the project’s usual channel.
