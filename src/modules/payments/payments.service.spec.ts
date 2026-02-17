import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { PaymentStatus } from './enums/payment-status.enum';
import { SocketGateway } from 'src/websocket/websocket.gateway';

describe('PaymentsService', () => {
	let service: PaymentsService;
	let paymentRepo: any;
	let socketGateway: any;

	const mockPayment = {
		id: 'pay-1',
		amount: 150,
		status: PaymentStatus.PENDING,
		restaurant: { id: 'rest-1' },
		bill: { id: 'bill-1' },
		createdAt: new Date(),
	};

	beforeEach(async () => {
		paymentRepo = {
			findOne: mock(() => Promise.resolve(null)),
			find: mock(() => Promise.resolve([])),
			create: mock((entity: any) => entity),
			save: mock((entity: any) => Promise.resolve({ id: 'pay-1', ...entity })),
			update: mock(() => Promise.resolve({ affected: 1 })),
		};
		socketGateway = {
			emitPaymentCompleted: mock(() => { }),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PaymentsService,
				{ provide: getRepositoryToken(Payment), useValue: paymentRepo },
				{ provide: SocketGateway, useValue: socketGateway },
			],
		}).compile();

		service = module.get<PaymentsService>(PaymentsService);
	});

	describe('create', () => {
		it('should create a payment with PENDING status', async () => {
			const data = { amount: 200, bill: { id: 'bill-1' }, restaurant: { id: 'rest-1' } };

			const result = await service.create(data as any);

			expect(paymentRepo.create).toHaveBeenCalledWith(
				expect.objectContaining({ status: PaymentStatus.PENDING }),
			);
			expect(paymentRepo.save).toHaveBeenCalled();
		});
	});

	describe('markSuccess', () => {
		it('should update payment status and emit socket event', async () => {
			paymentRepo.findOne.mockResolvedValue({ ...mockPayment });

			const result = await service.markSuccess('pay-1');

			expect(paymentRepo.findOne).toHaveBeenCalledWith({
				where: { id: 'pay-1' },
				relations: ['restaurant', 'bill'],
			});
			expect(paymentRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({ status: PaymentStatus.SUCCESS }),
			);
			expect(socketGateway.emitPaymentCompleted).toHaveBeenCalledWith('rest-1', 'bill-1', expect.anything());
		});

		it('should return early if payment not found', async () => {
			paymentRepo.findOne.mockResolvedValue(null);

			const result = await service.markSuccess('unknown');

			expect(result).toBeUndefined();
			expect(paymentRepo.save).not.toHaveBeenCalled();
		});
	});

	describe('markFailed', () => {
		it('should update payment status to FAILED', async () => {
			await service.markFailed('pay-1');

			expect(paymentRepo.update).toHaveBeenCalledWith(
				{ id: 'pay-1' },
				{ status: PaymentStatus.FAILED },
			);
		});
	});

	describe('findById', () => {
		it('should return a payment by id', async () => {
			paymentRepo.findOne.mockResolvedValue(mockPayment);

			const result = await service.findById('pay-1');

			expect(result).toEqual(mockPayment);
		});
	});

	describe('findByBill', () => {
		it('should return payments for a bill, ordered by date', async () => {
			paymentRepo.find.mockResolvedValue([mockPayment]);

			const result = await service.findByBill('bill-1');

			expect(paymentRepo.find).toHaveBeenCalledWith({
				where: { bill: { id: 'bill-1' } },
				order: { createdAt: 'DESC' },
			});
			expect(result).toHaveLength(1);
		});
	});

	describe('findByRestaurant', () => {
		it('should return payments for a restaurant, ordered by date', async () => {
			paymentRepo.find.mockResolvedValue([mockPayment]);

			const result = await service.findByRestaurant('rest-1');

			expect(paymentRepo.find).toHaveBeenCalledWith({
				where: { restaurant: { id: 'rest-1' } },
				order: { createdAt: 'DESC' },
			});
			expect(result).toHaveLength(1);
		});
	});
});
