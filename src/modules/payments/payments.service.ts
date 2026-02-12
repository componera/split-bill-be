import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Payment } from './payment.entity';
import { PaymentStatus } from './enums/payment-status.enum';

import { SocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class PaymentsService {
	constructor(
		@InjectRepository(Payment)
		private paymentRepo: Repository<Payment>,

		private socketGateway: SocketGateway,
	) {}

	/*
	==========================================
	CREATE PAYMENT RECORD
	==========================================
	*/
	async create(data: Partial<Payment>) {
		const payment = this.paymentRepo.create({
			...data,
			status: PaymentStatus.PENDING,
		});

		return this.paymentRepo.save(payment);
	}

	/*
	==========================================
	MARK SUCCESS
	==========================================
	*/
	async markSuccess(paymentId: string) {
		const payment = await this.paymentRepo.findOne({
			where: { id: paymentId },
		});

		if (!payment) return;

		payment.status = PaymentStatus.SUCCESS;

		await this.paymentRepo.save(payment);

		this.socketGateway.emitPaymentCompleted(payment.restaurantId, payment.billId, payment);

		return payment;
	}

	/*
	==========================================
	MARK FAILED
	==========================================
	*/
	async markFailed(paymentId: string) {
		await this.paymentRepo.update(
			{ id: paymentId },
			{
				status: PaymentStatus.FAILED,
			},
		);
	}

	/*
	==========================================
	FIND PAYMENT
	==========================================
	*/
	async findById(id: string) {
		return this.paymentRepo.findOne({
			where: { id },
		});
	}

	/*
	==========================================
	FIND BILL PAYMENTS
	==========================================
	*/
	async findByBill(billId: string) {
		return this.paymentRepo.find({
			where: { billId },
			order: { createdAt: 'DESC' },
		});
	}

	/*
	==========================================
	RESTAURANT PAYMENTS
	==========================================
	*/
	async findByRestaurant(restaurantId: string) {
		return this.paymentRepo.find({
			where: { restaurantId },
			order: { createdAt: 'DESC' },
		});
	}
}
