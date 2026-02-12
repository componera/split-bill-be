// src/modules/bills/bills.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Bill } from './entities/bill.entity';
import { BillItem } from './entities/bill-item.entity';
import { SocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class BillsService {
	constructor(
		@InjectRepository(Bill)
		private billRepo: Repository<Bill>,

		@InjectRepository(BillItem)
		private itemRepo: Repository<BillItem>,

		private socketGateway: SocketGateway,
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

		// Validate items not already paid or selected
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

		// Reload bill
		const updatedBill = await this.billRepo.findOne({
			where: { id: billId },
			relations: ['items'],
		});

		// Emit realtime update
		this.socketGateway.emitBillUpdate(bill.restaurantId, updatedBill);

		return updatedBill;
	}

	/*
	Release selected items (optional timeout or cancel)
	*/
	async releaseSelectedItems(billId: string, customerId: string) {
		await this.itemRepo.update(
			{
				billId,
				selectedBy: customerId,
			},
			{
				selectedBy: null,
				selectedAt: null,
			},
		);

		const bill = await this.billRepo.findOne({
			where: { id: billId },
			relations: ['items'],
		});

		this.socketGateway.emitBillUpdate(bill.restaurantId, bill);

		return bill;
	}
}
