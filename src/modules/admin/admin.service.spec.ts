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
		select: mock(function (this: any) {
			return this;
		}),
		addSelect: mock(function (this: any) {
			return this;
		}),
		where: mock(function (this: any) {
			return this;
		}),
		andWhere: mock(function (this: any) {
			return this;
		}),
		groupBy: mock(function (this: any) {
			return this;
		}),
		orderBy: mock(function (this: any) {
			return this;
		}),
		getRawOne: mock(() => Promise.resolve({ sum: '1500.00' })),
		getRawMany: mock(() => Promise.resolve([])),
	};

	beforeEach(async () => {
		mockQueryBuilder.getRawMany.mockResolvedValue([]);
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

	describe('getChartStats', () => {
		it('should return chart data grouped by date', async () => {
			const rawRows = [
				{ date: '2025-02-15', revenue: '500.00', payments: '3' },
				{ date: '2025-02-16', revenue: '750.50', payments: '5' },
			];
			mockQueryBuilder.getRawMany.mockResolvedValue(rawRows);

			const result = await service.getChartStats('rest-1', 7);

			expect(paymentRepo.createQueryBuilder).toHaveBeenCalledWith('p');
			expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('p."createdAt" >= :startDate', expect.any(Object));
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ date: '2025-02-15', revenue: 500, payments: 3 });
			expect(result[1]).toEqual({ date: '2025-02-16', revenue: 750.5, payments: 5 });
		});

		it('should clamp days between 1 and 30', async () => {
			await service.getChartStats('rest-1', 0);
			await service.getChartStats('rest-1', 100);

			expect(paymentRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
		});

		it('should return empty array when no payments', async () => {
			mockQueryBuilder.getRawMany.mockResolvedValue([]);

			const result = await service.getChartStats('rest-1');

			expect(result).toEqual([]);
		});
	});
});
