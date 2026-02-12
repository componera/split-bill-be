import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { LightspeedOAuthService } from './lightspeed.oauth.service';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LightspeedToken } from './entities/lightspeed-token.entity';
import { BillItem } from '../bills/entities/bill-item.entity';
import { PaymentStatus } from '../payments/enums/payment-status.enum';
import { Payment } from '../payments/entities/payment.entity';
import { SocketGateway } from 'src/websocket/websocket.gateway';

@Injectable()
export class LightspeedService {
	private readonly logger = new Logger(LightspeedService.name);

	constructor(
		private oauth: LightspeedOAuthService,

		private socketGateway: SocketGateway,

		@InjectRepository(LightspeedToken)
		private tokenRepo: Repository<LightspeedToken>,

		@InjectRepository(BillItem)
		private billItemRepo: Repository<BillItem>,

		@InjectRepository(Payment)
		private paymentRepo: Repository<Payment>,
	) { }

	async getAccessToken(restaurantId: string) {
		const token = await this.tokenRepo.findOne({
			where: { restaurantId },
		});

		if (!token) throw new Error('Lightspeed not connected');

		if (new Date() >= token.expiresAt) {
			return this.oauth.refreshToken(restaurantId);
		}

		return token.accessToken;
	}

	async request(restaurantId: string, method: string, url: string, data?: any) {
		const token = await this.getAccessToken(restaurantId);

		try {
			return await axios({
				method,
				url: `https://api.lightspeedapp.com/API/V3/Account/${url}`,
				headers: {
					Authorization: `Bearer ${token}`,
				},
				data,
			});
		} catch (err) {
			if (err.response?.status === 401) {
				const newToken = await this.oauth.refreshToken(restaurantId);

				return axios({
					method,
					url,
					headers: {
						Authorization: `Bearer ${newToken}`,
					},
					data,
				});
			}

			throw err;
		}
	}

	async markItemsPaid(
		restaurantId: string,
		lightspeedSaleId: string,
		paidItemIds: string[],
	) {
		// STEP 0: Get Lightspeed access token
		const tokenEntity = await this.getAccessToken(restaurantId);
		const accessToken = tokenEntity; // assume token entity has accessToken field

		// STEP 1: Load items safely, only from this restaurant and not already paid
		const items = await this.billItemRepo.find({
			where: {
				lightspeedItemId: In(paidItemIds),
				isPaid: false,
				bill: { restaurantId }, // ensure multi-tenant safety
			},
			relations: ['bill'],
		});

		if (items.length !== paidItemIds.length) {
			throw new BadRequestException('Some items are invalid, already paid, or do not belong to this restaurant.');
		}

		// STEP 2: Mark items as paid
		for (const item of items) {
			item.isPaid = true;
		}
		await this.billItemRepo.save(items);

		// STEP 3: Calculate total
		const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

		// STEP 4: Register payment with Lightspeed
		await axios.post(
			`${process.env.LIGHTSPEED_API_URL}/sales/${lightspeedSaleId}/payments`,
			{
				amount: totalAmount,
				currency: 'ZAR',
				method: 'external',
			},
			{
				headers: { Authorization: `Bearer ${accessToken}` },
			},
		);

		// STEP 5: Optionally create local Payment entity for auditing
		const payment = this.paymentRepo.create({
			bill: { id: items[0].bill.id },
			restaurant: { id: restaurantId },
			amount: totalAmount,
			status: PaymentStatus.SUCCESS,
			metadata: { itemIds: paidItemIds },
		});
		await this.paymentRepo.save(payment);

		// STEP 6: Emit WS updates
		this.socketGateway.emitPaymentCompleted(restaurantId, items[0].bill.id, payment);

		this.logger.log(`Marked items paid for sale ${lightspeedSaleId}: R${totalAmount}`);

		return { success: true, amount: totalAmount };
	}

}
