import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository, In } from 'typeorm';
import axios from 'axios';

import { Payment } from '../payments/entities/payment.entity';
import { Bill } from '../bills/entities/bill.entity';
import { BillItem } from '../bills/entities/bill-item.entity';

import { SocketGateway } from '../../websocket/websocket.gateway';
import { LightspeedService } from '../lightspeed/lightspeed.service';
import { PaymentStatus } from '../payments/enums/payment-status.enum';

@Injectable()
export class YocoService {
	constructor(
		@InjectRepository(Payment)
		private paymentRepo: Repository<Payment>,

		@InjectRepository(Bill)
		private billRepo: Repository<Bill>,

		@InjectRepository(BillItem)
		private itemRepo: Repository<BillItem>,

		private socketGateway: SocketGateway,

		private lightspeedService: LightspeedService,
	) { }

	/*
	==========================================
	CREATE YOCO CHECKOUT SESSION
	==========================================
	*/
	async createCheckout(dto: { restaurantId: string; billId: string; itemIds: string[] }) {
		const items = await this.itemRepo.find({
			where: {
				id: In(dto.itemIds),
				isPaid: false,
				bill: { restaurantId: dto.restaurantId }, // <- via relation
			},
			relations: ['bill'],
		});


		if (!items.length) throw new BadRequestException('Items already paid');

		const amount = items.reduce((sum, item) => sum + Number(item.price), 0);

		const payment = this.paymentRepo.create({
			restaurantId: dto.restaurantId,
			billId: dto.billId,
			amount,
			status: PaymentStatus.PENDING,

			metadata: {
				itemIds: dto.itemIds,
			},
		});

		await this.paymentRepo.save(payment);

		const response = await axios.post(
			'https://payments.yoco.com/api/checkouts',
			{
				amount: Math.round(amount * 100),
				currency: 'ZAR',

				successUrl: `${process.env.FRONTEND_URL}/success`,
				cancelUrl: `${process.env.FRONTEND_URL}/cancel`,

				metadata: {
					paymentId: payment.id,
				},
			},
			{
				headers: {
					Authorization: `Bearer ${process.env.YOCO_SECRET_KEY}`,
				},
			},
		);

		return {
			checkoutId: response.data.id,
			redirectUrl: response.data.redirectUrl,
		};
	}

	/*
	==========================================
	HANDLE SUCCESSFUL PAYMENT
	==========================================
	*/
	async handlePaymentSuccess(paymentId: string) {
		const payment = await this.paymentRepo.findOne({
			where: { id: paymentId },
		});

		if (!payment) return;

		payment.status = 'SUCCESS';
		await this.paymentRepo.save(payment);

		const itemIds = payment.billItemIds;

		await this.itemRepo.update(
			{ id: In(itemIds) },
			{
				paid: true,
				paidAt: new Date(),
				paymentId: payment.id,
			},
		);

		const bill = await this.billRepo.findOne({
			where: {
				id: payment.billId,
			},
			relations: ['items'],
		});

		/*
		==========================================
		MARK ITEMS PAID IN LIGHTSPEED
		==========================================
		*/

		await this.lightspeedService.markItemsPaid(bill.restaurantId, bill.lightspeedSaleId, itemIds);

		/*
		==========================================
		SOCKET EVENTS
		==========================================
		*/

		this.socketGateway.emitPaymentCompleted(bill.restaurantId, bill.id, payment);

		this.socketGateway.emitBillUpdated(bill.restaurantId, bill.id, bill);
	}
}
