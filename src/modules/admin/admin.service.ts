import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Bill } from '../bills/entities/bill.entity';
import { Payment } from '../payments/entities/payment.entity';
import { BillStatus } from 'src/modules/bills/enums/bill-status.enum';
import { PaymentStatus } from 'src/modules/payments/enums/payment-status.enum';

@Injectable()
export class AdminService {
	constructor(
		@InjectRepository(Bill)
		private billRepo: Repository<Bill>,

		@InjectRepository(Payment)
		private paymentRepo: Repository<Payment>,
	) {}

	async getStats(restaurantId: string) {
		const activeBills = await this.billRepo.count({
			where: {
				restaurantId,
				status: BillStatus.OPEN,
			},
		});

		const paymentsToday = await this.paymentRepo.count({
			where: { restaurant: { id: restaurantId } }, // ✅ nested relation
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

	async getChartStats(restaurantId: string, days = 7) {
		const daysToQuery = Math.min(Math.max(days, 1), 30);
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - daysToQuery);
		startDate.setHours(0, 0, 0, 0);

		const rows = await this.paymentRepo
			.createQueryBuilder('p')
			.select(`DATE(p."createdAt")`, 'date')
			.addSelect('SUM(p.amount)', 'revenue')
			.addSelect('COUNT(*)', 'payments')
			.where('p.restaurantId = :restaurantId', { restaurantId })
			.andWhere('p.status = :status', { status: PaymentStatus.SUCCESS })
			.andWhere('p."createdAt" >= :startDate', { startDate })
			.groupBy(`DATE(p."createdAt")`)
			.orderBy('date', 'ASC')
			.getRawMany();

		return rows.map(r => ({
			date: r.date,
			revenue: Number(r.revenue || 0),
			payments: Number(r.payments || 0),
		}));
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
			where: { restaurant: { id: restaurantId } },
			order: { createdAt: 'DESC' },
		});
	}
}
