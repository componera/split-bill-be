import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BillsService } from './bills.service';
import { Bill } from './entities/bill.entity';
import { BillItem } from './entities/bill-item.entity';
import { SocketGateway } from 'src/websocket/websocket.gateway';

describe('BillsService', () => {
	let service: BillsService;
	let billRepo: any;
	let itemRepo: any;
	let socketGateway: any;

	const mockBill = {
		id: 'bill-1',
		restaurantId: 'rest-1',
		status: 'OPEN',
		items: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockItems = [
		{ id: 'item-1', name: 'Burger', price: 100, isPaid: false, billId: 'bill-1', selectedBy: null },
		{ id: 'item-2', name: 'Fries', price: 50, isPaid: false, billId: 'bill-1', selectedBy: null },
	];

	beforeEach(async () => {
		billRepo = {
			findOne: mock(() => Promise.resolve(null)),
			find: mock(() => Promise.resolve([])),
			create: mock((entity: any) => entity),
			save: mock((entity: any) => Promise.resolve({ id: 'bill-1', ...entity })),
		};
		itemRepo = {
			find: mock(() => Promise.resolve([])),
			save: mock((entities: any) => Promise.resolve(entities)),
			update: mock(() => Promise.resolve({ affected: 1 })),
		};
		socketGateway = {
			emitBillUpdated: mock(() => { }),
			emitBillCreated: mock(() => { }),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				BillsService,
				{ provide: getRepositoryToken(Bill), useValue: billRepo },
				{ provide: getRepositoryToken(BillItem), useValue: itemRepo },
				{ provide: SocketGateway, useValue: socketGateway },
			],
		}).compile();

		service = module.get<BillsService>(BillsService);
	});

	describe('findById', () => {
		it('should return a bill with items', async () => {
			billRepo.findOne.mockResolvedValue({ ...mockBill, items: mockItems });

			const result = await service.findById('bill-1');

			expect(billRepo.findOne).toHaveBeenCalledWith({
				where: { id: 'bill-1' },
				relations: ['items'],
			});
			expect(result.id).toBe('bill-1');
			expect(result.items).toHaveLength(2);
		});

		it('should throw NotFoundException if bill not found', async () => {
			billRepo.findOne.mockResolvedValue(null);

			expect(service.findById('unknown')).rejects.toThrow(NotFoundException);
		});
	});

	describe('findRestaurantBills', () => {
		it('should return all bills for a restaurant', async () => {
			billRepo.find.mockResolvedValue([mockBill]);

			const result = await service.findRestaurantBills('rest-1');

			expect(billRepo.find).toHaveBeenCalledWith({
				where: { restaurantId: 'rest-1' },
				relations: ['items'],
				order: { createdAt: 'DESC' },
			});
			expect(result).toHaveLength(1);
		});
	});

	describe('create', () => {
		it('should create and save a new bill', async () => {
			const dto = { restaurantId: 'rest-1', tableNumber: '5' };

			const result = await service.create(dto);

			expect(billRepo.create).toHaveBeenCalledWith(dto);
			expect(billRepo.save).toHaveBeenCalled();
			expect(result).toHaveProperty('id');
		});
	});

	describe('markItemsSelected', () => {
		it('should mark items as selected by a customer', async () => {
			billRepo.findOne
				.mockResolvedValueOnce({ ...mockBill, items: mockItems })
				.mockResolvedValueOnce({ ...mockBill, items: mockItems.map(i => ({ ...i, selectedBy: 'cust-1' })) });
			itemRepo.find.mockResolvedValue([...mockItems]);

			const result = await service.markItemsSelected('bill-1', ['item-1', 'item-2'], 'cust-1');

			expect(itemRepo.save).toHaveBeenCalled();
			expect(socketGateway.emitBillUpdated).toHaveBeenCalledWith('rest-1', 'bill-1', expect.anything());
		});

		it('should throw if bill not found', async () => {
			billRepo.findOne.mockResolvedValue(null);

			expect(service.markItemsSelected('unknown', ['item-1'], 'cust-1')).rejects.toThrow(NotFoundException);
		});

		it('should throw if item is already paid', async () => {
			billRepo.findOne.mockResolvedValue(mockBill);
			itemRepo.find.mockResolvedValue([{ ...mockItems[0], isPaid: true }]);

			expect(service.markItemsSelected('bill-1', ['item-1'], 'cust-1')).rejects.toThrow(BadRequestException);
		});

		it('should throw if item is selected by someone else', async () => {
			billRepo.findOne.mockResolvedValue(mockBill);
			itemRepo.find.mockResolvedValue([{ ...mockItems[0], selectedBy: 'other-customer' }]);

			expect(service.markItemsSelected('bill-1', ['item-1'], 'cust-1')).rejects.toThrow(BadRequestException);
		});

		it('should throw if item count does not match', async () => {
			billRepo.findOne.mockResolvedValue(mockBill);
			itemRepo.find.mockResolvedValue([mockItems[0]]);

			expect(service.markItemsSelected('bill-1', ['item-1', 'item-2'], 'cust-1')).rejects.toThrow(BadRequestException);
		});
	});

	describe('releaseSelectedItems', () => {
		it('should release selected items and emit update', async () => {
			billRepo.findOne.mockResolvedValue({ ...mockBill, items: mockItems });

			const result = await service.releaseSelectedItems('bill-1', 'cust-1');

			expect(itemRepo.update).toHaveBeenCalledWith(
				{ billId: 'bill-1', selectedBy: 'cust-1' },
				{ selectedBy: null, selectedAt: null },
			);
			expect(socketGateway.emitBillUpdated).toHaveBeenCalled();
		});
	});
});
