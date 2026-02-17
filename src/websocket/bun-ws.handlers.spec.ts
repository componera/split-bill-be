import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { createBunWsHandlers } from './bun-ws.handlers';
import { BunWebSocketRoomManager } from './bun-ws.room-manager';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/modules/users/users.service';

function createMockWs(overrides: Partial<{ readyState: number; data: any; close: ReturnType<typeof mock> }> = {}): any {
	return {
		readyState: 1,
		send: mock(() => { }),
		close: mock(() => { }),
		data: {},
		...overrides,
	};
}

describe('createBunWsHandlers', () => {
	let roomManager: any;
	let jwtService: any;
	let usersService: any;
	let app: any;
	let handlers: ReturnType<typeof createBunWsHandlers>;

	beforeEach(() => {
		roomManager = {
			addSocket: mock(() => { }),
			removeSocket: mock(() => { }),
			addToRoom: mock(() => { }),
			removeFromRoom: mock(() => { }),
		};
		jwtService = {
			verify: mock(() => ({ sub: 'user-1' })),
		};
		usersService = {
			findById: mock(() => Promise.resolve({ id: 'user-1', restaurantId: 'rest-1' })),
		};
		app = {
			get: (cls: any) => {
				if (cls === BunWebSocketRoomManager) return roomManager;
				if (cls === JwtService) return jwtService;
				if (cls === UsersService) return usersService;
				throw new Error(`Unknown: ${cls?.name}`);
			},
		};
		handlers = createBunWsHandlers(app as any);
	});

	describe('open', () => {
		it('should close with 4401 when token is missing', async () => {
			const ws = createMockWs({ data: {} });
			await handlers.open(ws);

			expect(ws.close).toHaveBeenCalledWith(4401, 'Missing token');
			expect(roomManager.addSocket).not.toHaveBeenCalled();
		});

		it('should close with 4401 when token is invalid', async () => {
			const ws = createMockWs({ data: { token: 'bad' } });
			jwtService.verify.mockImplementation(() => {
				throw new Error('invalid');
			});

			await handlers.open(ws);

			expect(ws.close).toHaveBeenCalledWith(4401, 'Invalid token');
			expect(roomManager.addSocket).not.toHaveBeenCalled();
		});

		it('should set user on ws.data and add socket when token is valid', async () => {
			const user = { id: 'user-1', restaurantId: 'rest-1', email: 'u@t.com' };
			usersService.findById.mockResolvedValue(user);
			const ws = createMockWs({ data: { token: 'valid-jwt' } });

			await handlers.open(ws);

			expect(jwtService.verify).toHaveBeenCalledWith('valid-jwt');
			expect(usersService.findById).toHaveBeenCalledWith('user-1');
			expect(ws.data.user).toEqual(user);
			expect(roomManager.addSocket).toHaveBeenCalledWith(ws);
			expect(ws.close).not.toHaveBeenCalled();
		});
	});

	describe('message', () => {
		it('should ignore invalid JSON', () => {
			const ws = createMockWs({ data: { user: { restaurantId: 'rest-1' } } });
			roomManager.addSocket(ws);

			handlers.message(ws, 'not json');

			expect(roomManager.addToRoom).not.toHaveBeenCalled();
			expect(roomManager.removeFromRoom).not.toHaveBeenCalled();
		});

		it('should add socket to restaurant room on joinRestaurant when user has restaurantId', () => {
			const ws = createMockWs({ data: { user: { restaurantId: 'rest-1' } } });
			roomManager.addSocket(ws);

			handlers.message(ws, JSON.stringify({ type: 'joinRestaurant' }));

			expect(roomManager.addToRoom).toHaveBeenCalledWith(ws, 'restaurant:rest-1');
		});

		it('should not add to room on joinRestaurant when user has no restaurantId', () => {
			const ws = createMockWs({ data: { user: {} } });
			roomManager.addSocket(ws);

			handlers.message(ws, JSON.stringify({ type: 'joinRestaurant' }));

			expect(roomManager.addToRoom).not.toHaveBeenCalled();
		});

		it('should add socket to bill and restaurant rooms on joinBill', () => {
			const ws = createMockWs({ data: { user: { restaurantId: 'rest-1' } } });
			roomManager.addSocket(ws);

			handlers.message(ws, JSON.stringify({ type: 'joinBill', billId: 'bill-1' }));

			expect(roomManager.addToRoom).toHaveBeenCalledWith(ws, 'bill:bill-1');
			expect(roomManager.addToRoom).toHaveBeenCalledWith(ws, 'restaurant:rest-1');
		});

		it('should not add to room on joinBill when billId is missing', () => {
			const ws = createMockWs({ data: { user: { restaurantId: 'rest-1' } } });
			roomManager.addSocket(ws);

			handlers.message(ws, JSON.stringify({ type: 'joinBill' }));

			expect(roomManager.addToRoom).not.toHaveBeenCalled();
		});

		it('should remove socket from bill room on leaveBill', () => {
			const ws = createMockWs();
			roomManager.addSocket(ws);

			handlers.message(ws, JSON.stringify({ type: 'leaveBill', billId: 'bill-1' }));

			expect(roomManager.removeFromRoom).toHaveBeenCalledWith(ws, 'bill:bill-1');
		});

		it('should not remove on leaveBill when billId is missing', () => {
			const ws = createMockWs();
			roomManager.addSocket(ws);

			handlers.message(ws, JSON.stringify({ type: 'leaveBill' }));

			expect(roomManager.removeFromRoom).not.toHaveBeenCalled();
		});

		it('should ignore unknown message type', () => {
			const ws = createMockWs();
			roomManager.addSocket(ws);

			handlers.message(ws, JSON.stringify({ type: 'unknown' }));

			expect(roomManager.addToRoom).not.toHaveBeenCalled();
			expect(roomManager.removeFromRoom).not.toHaveBeenCalled();
		});
	});

	describe('close', () => {
		it('should remove socket from room manager', () => {
			const ws = createMockWs();
			handlers.close(ws, 1000, 'normal');

			expect(roomManager.removeSocket).toHaveBeenCalledWith(ws);
		});
	});
});
