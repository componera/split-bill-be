import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Bill } from 'src/bills/bills.entity';
import { Payment } from 'src/payments/payments.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AdminService {
	constructor(
		@InjectRepository(Bill)
		private billRepository: Repository<Bill>,

		@InjectRepository(Payment)
		private paymentRepository: Repository<Payment>,
	) {}

	async stats(restaurantId: string) {
		const activeBills = await this.billRepository.count({
			where: { restaurantId, status: 'OPEN' },
		});

		const paymentsToday = await this.paymentRepository.count({
			where: { restaurantId },
		});

		const revenueToday = await this.paymentRepository
			.createQueryBuilder('p')
			.select('SUM(p.amount)', 'sum')
			.where('p.restaurantId = :restaurantId', { restaurantId })
			.getRawOne();

		return {
			activeBills,
			paymentsToday,
			revenueToday: Number(revenueToday.sum || 0),
		};
	}

	async getBills(restaurantId: string) {
		return this.billRepository.find({
			where: { restaurantId },
		});
	}

	async getPayments(restaurantId: string) {
		return this.paymentRepository.find({
			where: { restaurantId },
		});
	}
}
