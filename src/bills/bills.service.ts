import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SocketGateway } from 'src/websocket/websocket.gateway';
import { Repository } from 'typeorm';
import { Bill } from './bills.entity';

@Injectable()
export class BillsService {
	constructor(
		@InjectRepository(Bill)
		private billRepo: Repository<Bill>,

		private socketGateway: SocketGateway,
	) {}

	async findOne(restaurantId: string, billId: string) {
		return this.billRepo.findOne({
			where: { id: billId, restaurantId },
			relations: ['items'],
		});
	}

	async createBill(billData) {
		const bill = await this.billRepo.save(billData);

		this.socketGateway.emitBillCreated(bill.restaurantId, bill);

		return bill;
	}

	async updateBill(billId: string, updateData) {
		await this.billRepo.update(billId, updateData);

		const bill = await this.billRepo.findOne({
			where: { id: billId },
		});

		this.socketGateway.emitBillUpdate(bill.restaurantId, bill);

		return bill;
	}
}
