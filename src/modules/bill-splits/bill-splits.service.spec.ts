import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BillSplitsService } from './bill-splits.service';
import { BillSplit } from './entities/bill-split.entity';

describe('BillSplitsService', () => {
	let service: BillSplitsService;
	let splitRepo: any;

	beforeEach(async () => {
		splitRepo = {
			save: mock((entity: any) => Promise.resolve({ id: 'split-1', ...entity })),
			update: mock(() => Promise.resolve({ affected: 1 })),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [BillSplitsService, { provide: getRepositoryToken(BillSplit), useValue: splitRepo }],
		}).compile();

		service = module.get<BillSplitsService>(BillSplitsService);
	});

	describe('createSplit', () => {
		it('should create and save a bill split', async () => {
			const data = { billId: 'bill-1', restaurantId: 'rest-1', amount: 75, status: 'PENDING' };

			const result = await service.createSplit(data);

			expect(splitRepo.save).toHaveBeenCalledWith(data);
			expect(result).toHaveProperty('id');
		});
	});

	describe('markPaid', () => {
		it('should update split status to PAID with payment id', async () => {
			await service.markPaid('split-1', 'pay-1');

			expect(splitRepo.update).toHaveBeenCalledWith('split-1', {
				status: 'PAID',
				paymentId: 'pay-1',
			});
		});
	});
});
