import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { Bill } from '../bills/entities/bill.entity';
import { Payment } from '../payments/entities/payment.entity';

describe('AdminService', () => {
	let service: AdminService;
	let billRepo: any;
	let paymentRepo: any;

	const mockQueryBuilder = {
		select: mock(function (this: any) { return this; }),
		where: mock(function (this: any) { return this; }),
		getRawOne: mock(() => Promise.resolve({ sum: '1500.00' })),
	};

	beforeEach(async () => {
		billRepo = {
			count: mock(() => Promise.resolve(3)),
			find: mock(() => Promise.resolve([])),
		};
		paymentRepo = {
			count: mock(() => Promise.resolve(12)),
			find: mock(() => Promise.resolve([])),
			createQueryBuilder: mock(() => mockQueryBuilder),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AdminService,
				{ provide: getRepositoryToken(Bill), useValue: billRepo },
				{ provide: getRepositoryToken(Payment), useValue: paymentRepo },
			],
		}).compile();

		service = module.get<AdminService>(AdminService);
	});

	describe('getStats', () => {
		it('should return active bills, payment count, and revenue', async () => {
			const result = await service.getStats('rest-1');

			expect(billRepo.count).toHaveBeenCalled();
			expect(paymentRepo.count).toHaveBeenCalled();
			expect(paymentRepo.createQueryBuilder).toHaveBeenCalledWith('p');
			expect(result).toEqual({
				activeBills: 3,
				paymentsToday: 12,
				revenue: 1500,
			});
		});

		it('should return 0 revenue when no payments', async () => {
			mockQueryBuilder.getRawOne.mockResolvedValue({ sum: null });

			const result = await service.getStats('rest-1');

			expect(result.revenue).toBe(0);
		});
	});

	describe('getBills', () => {
		it('should return bills ordered by creation date', async () => {
			const bills = [{ id: 'bill-1' }, { id: 'bill-2' }];
			billRepo.find.mockResolvedValue(bills);

			const result = await service.getBills('rest-1');

			expect(billRepo.find).toHaveBeenCalledWith({
				where: { restaurantId: 'rest-1' },
				relations: ['items'],
				order: { createdAt: 'DESC' },
			});
			expect(result).toHaveLength(2);
		});
	});

	describe('getPayments', () => {
		it('should return payments ordered by creation date', async () => {
			const payments = [{ id: 'pay-1' }];
			paymentRepo.find.mockResolvedValue(payments);

			const result = await service.getPayments('rest-1');

			expect(paymentRepo.find).toHaveBeenCalledWith({
				where: { restaurant: { id: 'rest-1' } },
				order: { createdAt: 'DESC' },
			});
			expect(result).toHaveLength(1);
		});
	});
});
