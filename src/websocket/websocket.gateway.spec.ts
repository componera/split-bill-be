import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { SocketGateway } from './websocket.gateway';
import { BunWebSocketRoomManager } from './bun-ws.room-manager';

describe('SocketGateway', () => {
	let gateway: SocketGateway;
	let roomManager: any;
	let emitMock: ReturnType<typeof mock>;

	beforeEach(async () => {
		emitMock = mock(() => { });
		roomManager = {
			to: mock((room: string) => ({ emit: emitMock })),
			broadcast: mock(() => { }),
		};

		const module = await Test.createTestingModule({
			providers: [
				SocketGateway,
				{ provide: BunWebSocketRoomManager, useValue: roomManager },
			],
		}).compile();

		gateway = module.get<SocketGateway>(SocketGateway);
	});

	describe('emitBillCreated', () => {
		it('should emit bill.created to restaurant room', () => {
			const bill = { id: 'bill-1', restaurantId: 'rest-1' };
			gateway.emitBillCreated('rest-1', bill);

			expect(roomManager.to).toHaveBeenCalledWith('restaurant:rest-1');
			expect(emitMock).toHaveBeenCalledWith('bill.created', bill);
		});
	});

	describe('emitBillUpdated', () => {
		it('should emit bill.updated to restaurant and bill rooms', () => {
			const bill = { id: 'bill-1', status: 'OPEN' };
			gateway.emitBillUpdated('rest-1', 'bill-1', bill);

			expect(roomManager.to).toHaveBeenCalledWith('restaurant:rest-1');
			expect(roomManager.to).toHaveBeenCalledWith('bill:bill-1');
			expect(emitMock).toHaveBeenNthCalledWith(1, 'bill.updated', bill);
			expect(emitMock).toHaveBeenNthCalledWith(2, 'bill.updated', bill);
		});
	});

	describe('emitBillClosed', () => {
		it('should emit bill.closed to restaurant and bill rooms', () => {
			const bill = { id: 'bill-1', status: 'CLOSED' };
			gateway.emitBillClosed('rest-1', 'bill-1', bill);

			expect(roomManager.to).toHaveBeenCalledWith('restaurant:rest-1');
			expect(roomManager.to).toHaveBeenCalledWith('bill:bill-1');
			expect(emitMock).toHaveBeenNthCalledWith(1, 'bill.closed', bill);
			expect(emitMock).toHaveBeenNthCalledWith(2, 'bill.closed', bill);
		});
	});

	describe('emitStaffUpdated', () => {
		it('should broadcast staffUpdated', () => {
			gateway.emitStaffUpdated();

			expect(roomManager.broadcast).toHaveBeenCalledWith('staffUpdated');
		});
	});

	describe('emitPaymentCompleted', () => {
		it('should emit payment.completed to restaurant and bill rooms', () => {
			const payment = { id: 'pay-1', status: 'SUCCESS' };
			gateway.emitPaymentCompleted('rest-1', 'bill-1', payment);

			expect(roomManager.to).toHaveBeenCalledWith('restaurant:rest-1');
			expect(roomManager.to).toHaveBeenCalledWith('bill:bill-1');
			expect(emitMock).toHaveBeenNthCalledWith(1, 'payment.completed', payment);
			expect(emitMock).toHaveBeenNthCalledWith(2, 'payment.completed', payment);
		});
	});
});
