import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { BunWebSocketRoomManager } from './bun-ws.room-manager';

function createMockWs(readyState = 1): any {
	return {
		readyState,
		send: mock(() => { }),
		close: mock(() => { }),
		data: {},
	};
}

describe('BunWebSocketRoomManager', () => {
	let roomManager: BunWebSocketRoomManager;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [BunWebSocketRoomManager],
		}).compile();

		roomManager = module.get<BunWebSocketRoomManager>(BunWebSocketRoomManager);
	});

	describe('addSocket', () => {
		it('should register a socket so it can be added to rooms', () => {
			const ws = createMockWs();

			roomManager.addSocket(ws);

			// Socket should receive broadcast (tracked in socketToRooms)
			roomManager.broadcast('test', {});
			expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ event: 'test', data: {} }));
		});
	});

	describe('removeSocket', () => {
		it('should remove socket from all rooms and stop receiving broadcast', () => {
			const ws = createMockWs();
			roomManager.addSocket(ws);
			roomManager.addToRoom(ws, 'room-a');
			roomManager.removeSocket(ws);

			roomManager.broadcast('after', {});
			expect(ws.send).not.toHaveBeenCalledWith(expect.stringContaining('after'));
		});

		it('should be no-op when socket was never added', () => {
			const ws = createMockWs();
			expect(() => roomManager.removeSocket(ws)).not.toThrow();
		});
	});

	describe('addToRoom', () => {
		it('should add socket to room and create room if needed', () => {
			const ws = createMockWs();
			roomManager.addSocket(ws);
			roomManager.addToRoom(ws, 'room-1');

			roomManager.to('room-1').emit('ev', { x: 1 });
			expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ event: 'ev', data: { x: 1 } }));
		});

		it('should allow same socket in multiple rooms', () => {
			const ws = createMockWs();
			roomManager.addSocket(ws);
			roomManager.addToRoom(ws, 'room-a');
			roomManager.addToRoom(ws, 'room-b');

			roomManager.to('room-a').emit('a', null);
			roomManager.to('room-b').emit('b', null);
			expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ event: 'a', data: null }));
			expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ event: 'b', data: null }));
		});
	});

	describe('removeFromRoom', () => {
		it('should stop socket receiving room emissions', () => {
			const ws = createMockWs();
			roomManager.addSocket(ws);
			roomManager.addToRoom(ws, 'room-1');
			roomManager.removeFromRoom(ws, 'room-1');

			roomManager.to('room-1').emit('ev', {});
			expect(ws.send).not.toHaveBeenCalled();
		});
	});

	describe('to(room).emit', () => {
		it('should send to all sockets in room with readyState 1', () => {
			const ws1 = createMockWs(1);
			const ws2 = createMockWs(1);
			roomManager.addSocket(ws1);
			roomManager.addSocket(ws2);
			roomManager.addToRoom(ws1, 'r');
			roomManager.addToRoom(ws2, 'r');

			roomManager.to('r').emit('e', { id: 1 });

			expect(ws1.send).toHaveBeenCalledWith(JSON.stringify({ event: 'e', data: { id: 1 } }));
			expect(ws2.send).toHaveBeenCalledWith(JSON.stringify({ event: 'e', data: { id: 1 } }));
		});

		it('should not send to sockets with readyState !== 1', () => {
			const ws = createMockWs(0);
			roomManager.addSocket(ws);
			roomManager.addToRoom(ws, 'r');

			roomManager.to('r').emit('e', {});

			expect(ws.send).not.toHaveBeenCalled();
		});

		it('should do nothing when room has no sockets', () => {
			roomManager.to('empty').emit('e', {});
			// No sockets to call; just ensure no throw
		});
	});

	describe('broadcast', () => {
		it('should send to all tracked sockets with readyState 1', () => {
			const ws1 = createMockWs(1);
			const ws2 = createMockWs(1);
			roomManager.addSocket(ws1);
			roomManager.addSocket(ws2);

			roomManager.broadcast('staffUpdated');

			const payload = JSON.stringify({ event: 'staffUpdated', data: null });
			expect(ws1.send).toHaveBeenCalledWith(payload);
			expect(ws2.send).toHaveBeenCalledWith(payload);
		});

		it('should use data when provided', () => {
			const ws = createMockWs(1);
			roomManager.addSocket(ws);

			roomManager.broadcast('custom', { foo: 'bar' });

			expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ event: 'custom', data: { foo: 'bar' } }));
		});
	});
});
