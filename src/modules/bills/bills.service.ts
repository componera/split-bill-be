import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Bill } from './entities/bill.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SocketGateway } from 'src/websocket/websocket.gateway';
import { Repository, In } from 'typeorm';
import { BillItem } from './entities/bill-item.entity';

@Injectable()
export class BillsService {
	constructor(
		@InjectRepository(Bill)
		private billRepo: Repository<Bill>,

		@InjectRepository(BillItem)
		private itemRepo: Repository<BillItem>,

		private socketGateway: SocketGateway, // ✅ Now available
	) {}

	/*
	Customer selects items to pay
	*/
	async markItemsSelected(billId: string, itemIds: string[], customerId: string) {
		const bill = await this.billRepo.findOne({
			where: { id: billId },
			relations: ['items'],
		});

		if (!bill) throw new NotFoundException('Bill not found');

		const items = await this.itemRepo.find({
			where: {
				id: In(itemIds),
				billId,
			},
		});

		if (items.length !== itemIds.length) throw new BadRequestException('Invalid items');

		for (const item of items) {
			if (item.isPaid) throw new BadRequestException(`Item already paid: ${item.name}`);

			if (item.selectedBy && item.selectedBy !== customerId) throw new BadRequestException(`Item already selected: ${item.name}`);
		}

		// Mark selected
		for (const item of items) {
			item.selectedBy = customerId;
			item.selectedAt = new Date();
		}

		await this.itemRepo.save(items);

		// Reload bill with updated items
		const updatedBill = await this.billRepo.findOne({
			where: { id: billId },
			relations: ['items'],
		});

		this.socketGateway.emitBillUpdated(bill.restaurantId, bill.id, updatedBill);

		return updatedBill;
	}

	/*
	Release selected items (optional timeout or cancel)
	*/
	async releaseSelectedItems(billId: string, customerId: string) {
		await this.itemRepo.update({ billId, selectedBy: customerId }, { selectedBy: null, selectedAt: null });

		const bill = await this.billRepo.findOne({
			where: { id: billId },
			relations: ['items'],
		});

		this.socketGateway.emitBillUpdated(bill.restaurantId, bill.id, bill);

		return bill;
	}

	/*
	Find a bill by ID
	*/
	async findById(billId: string): Promise<Bill> {
		const bill = await this.billRepo.findOne({
			where: { id: billId },
			relations: ['items'],
		});

		if (!bill) throw new NotFoundException('Bill not found');

		return bill;
	}

	/*
	Find all bills for a restaurant
	*/
	async findRestaurantBills(restaurantId: string): Promise<Bill[]> {
		return this.billRepo.find({
			where: { restaurantId },
			relations: ['items'],
			order: { createdAt: 'DESC' },
		});
	}

	/*
	Create a new bill
	*/
	async create(dto: Partial<Bill>): Promise<Bill> {
		const newBill = this.billRepo.create(dto); // type-safe creation
		return this.billRepo.save(newBill);
	}
}
