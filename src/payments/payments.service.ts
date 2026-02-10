import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import axios from 'axios';

import { Payment } from './payment.entity';
import { Bill } from '../bills/bills.entity';
import { BillItem } from '../bills/bill-item.entity';
import { LightspeedService } from '../lightspeed/lightspeed.service';
import { SocketGateway } from 'src/websocket/websocket.gateway';

@Injectable()
export class PaymentsService {
	private readonly logger = new Logger(PaymentsService.name);

	constructor(
		@InjectRepository(Payment)
		private paymentsRepo: Repository<Payment>,

		@InjectRepository(Bill)
		private billsRepo: Repository<Bill>,

		@InjectRepository(BillItem)
		private itemsRepo: Repository<BillItem>,

		private lightspeedService: LightspeedService,

		private socketGateway: SocketGateway,
	) {}

	/**
	 * Create Yoco payment checkout
	 */
	async createYocoPayment(restaurantId: string, billId: string, itemIds: string[]) {
		const bill = await this.billsRepo.findOne({
			where: { id: billId },
			relations: ['items'],
		});

		if (!bill) throw new Error('Bill not found');

		const items = await this.itemsRepo.find({
			where: { id: In(itemIds), billId },
		});

		const amount = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

		// Create Yoco checkout
		const response = await axios.post(
			'https://online.yoco.com/v1/checkout', // production
			{
				amountInCents: amount * 100,
				currency: 'ZAR',
				name: `Bill ${billId}`,
				reference: billId,
				// optional: customer info
			},
			{
				headers: {
					Authorization: `Bearer ${process.env.YOCO_API_KEY}`,
					'Content-Type': 'application/json',
				},
			},
		);

		const data = response.data;

		// Create pending payment record
		const payment = await this.paymentsRepo.save({
			restaurantId,
			billId,
			yocoCheckoutId: data.id,
			amount,
			status: 'PENDING',
			billItemIds: itemIds,
		});

		this.socketGateway.emitPaymentUpdate(payment.restaurantId, payment);

		return {
			paymentId: payment.id,
			checkoutUrl: data.checkoutUrl,
		};
	}

	/**
	 * Handle Yoco webhook / payment completion
	 */
	async handleYocoWebhook(payload: any) {
		const checkoutId = payload.id;
		const status = payload.status;

		const payment = await this.paymentsRepo.findOne({
			where: { yocoCheckoutId: checkoutId },
		});

		if (!payment) {
			this.logger.warn(`Payment not found for checkout ${checkoutId}`);
			return;
		}

		if (status === 'SUCCESS') {
			payment.status = 'SUCCESS';
			await this.paymentsRepo.save(payment);

			// Mark bill items paid
			await this.itemsRepo.update({ id: In(payment.billItemIds) }, { paid: true, paidByPaymentId: payment.id });

			// Update bill totals
			const bill = await this.billsRepo.findOne({
				where: { id: payment.billId },
				relations: ['items'],
			});

			if (!bill) return;

			const paidAmount = bill.items.filter(i => i.paid).reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

			const totalAmount = bill.items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

			bill.paidAmount = paidAmount;
			bill.remainingAmount = totalAmount - paidAmount;

			bill.status = bill.remainingAmount === 0 ? 'PAID' : paidAmount > 0 ? 'PARTIALLY_PAID' : 'OPEN';

			await this.billsRepo.save(bill);

			// Update Lightspeed order
			if (bill.lightspeedSaleId) {
				const paidItemIds = bill.items
					.filter(i => i.paid)
					.map(i => i.lightspeedItemId)
					.filter(Boolean);

				if (paidItemIds.length) {
					await this.lightspeedService.markItemsPaid(bill.restaurantId, bill.lightspeedSaleId, paidItemIds);
				}
			}
		} else if (status === 'FAILED') {
			payment.status = 'FAILED';
			await this.paymentsRepo.save(payment);
		}
	}

	async findByExternalId(externalId: string) {
		return this.paymentsRepo.findOne({
			where: { externalId },
		});
	}
}
