import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Bill } from '../bills/entities/bill.entity';
import { Payment } from '../payments/entities/payment.entity';
import { BillStatus } from 'src/modules/bills/enums/bill-status.enum';

@Injectable()
export class AdminService {
	constructor(
		@InjectRepository(Bill)
		private billRepo: Repository<Bill>,

		@InjectRepository(Payment)
		private paymentRepo: Repository<Payment>,
	) { }

	async getStats(restaurantId: string) {
		const activeBills = await this.billRepo.count({
			where: {
				restaurantId,
				status: BillStatus.OPEN,
			},
		});

		const paymentsToday = await this.paymentRepo.count({
			where: {
				restaurantId,
			},
		});

		const revenue = await this.paymentRepo
			.createQueryBuilder('p')
			.select('SUM(p.amount)', 'sum')
			.where('p.restaurantId = :restaurantId', {
				restaurantId,
			})
			.getRawOne();

		return {
			activeBills,
			paymentsToday,
			revenue: Number(revenue.sum || 0),
		};
	}

	async getBills(restaurantId: string) {
		return this.billRepo.find({
			where: { restaurantId },
			relations: ['items'],
			order: { createdAt: 'DESC' },
		});
	}

	async getPayments(restaurantId: string) {
		return this.paymentRepo.find({
			where: { restaurantId },
			order: { createdAt: 'DESC' },
		});
	}
}
