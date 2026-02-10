import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';

import axios from 'axios';

import { PaymentsService } from '../payments/payments.service';
import { BillSplitsService } from '../bill-splits/bill-splits.service';
import { SocketGateway } from '../websocket/websocket.gateway';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { YocoToken } from './yoco-token.entity';

@Injectable()
export class YocoService {
	private readonly logger = new Logger(YocoService.name);

	constructor(
		private paymentsService: PaymentsService,
		private billSplitsService: BillSplitsService,
		private socketGateway: SocketGateway,

		@InjectRepository(YocoToken)
		private yocoTokenRepo: Repository<YocoToken>,
	) {}

	/*
	============================================
	CREATE PAYMENT
	============================================
	*/

	async createPayment(params: { restaurantId: string; billId: string; splitId?: string; amount: number; currency?: string }) {
		const token = await this.getRestaurantToken(params.restaurantId);

		const response = await axios.post(
			'https://payments.yoco.com/api/checkouts',
			{
				amount: Math.round(params.amount * 100),
				currency: params.currency || 'ZAR',

				metadata: {
					restaurantId: params.restaurantId,
					billId: params.billId,
					splitId: params.splitId || null,
				},
			},
			{
				headers: {
					Authorization: `Bearer ${token.secretKey}`,
				},
			},
		);

		return {
			checkoutId: response.data.id,
			redirectUrl: response.data.redirectUrl,
		};
	}

	/*
	============================================
	HANDLE WEBHOOK
	============================================
	*/

	async handleWebhook(event: any) {
		try {
			this.logger.log(`Yoco webhook received: ${event.type}`);

			if (event.type !== 'payment.succeeded') {
				return;
			}

			const paymentData = event.payload;

			const metadata = paymentData.metadata;

			if (!metadata?.restaurantId || !metadata?.billId) {
				throw new BadRequestException('Missing metadata');
			}

			// prevent duplicate payment
			const existing = await this.paymentsService.findByExternalId(paymentData.id);

			if (existing) {
				this.logger.warn(`Duplicate payment ignored: ${paymentData.id}`);
				return existing;
			}

			/*
			============================================
			CREATE PAYMENT RECORD
			============================================
			*/

			const payment = await this.paymentsService.create({
				restaurantId: metadata.restaurantId,
				billId: metadata.billId,
				amount: paymentData.amount / 100,
				provider: 'YOCO',
				status: 'SUCCESS',
				externalId: paymentData.id,
			});

			/*
			============================================
			UPDATE SPLIT IF EXISTS
			============================================
			*/

			if (metadata.splitId) {
				await this.billSplitsService.markPaid(metadata.splitId, payment.id);
			}

			/*
			============================================
			EMIT REALTIME EVENT
			============================================
			*/

			this.socketGateway.emitPaymentUpdate(metadata.restaurantId, payment);

			this.logger.log(`Payment processed: ${payment.id}`);

			return payment;
		} catch (error) {
			this.logger.error('Yoco webhook error', error.stack);

			throw error;
		}
	}

	/*
	============================================
	GET RESTAURANT YOCO TOKEN
	============================================
	*/

	private async getRestaurantToken(restaurantId: string): Promise<YocoToken> {
		const token = await this.yocoTokenRepo.findOne({
			where: { restaurantId },
		});

		if (!token) {
			throw new NotFoundException(`Yoco token not found for restaurant ${restaurantId}`);
		}

		return token;
	}
}
