import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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

	async request(restaurantId: string, method: string, url: string, data?: any): Promise<{ data: any }> {
		const token = await this.getAccessToken(restaurantId);
		const fullUrl = `https://api.lightspeedapp.com/API/V3/Account/${url}`;

		let res = await fetch(fullUrl, {
			method,
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: data ? JSON.stringify(data) : undefined,
		});

		if (res.status === 401) {
			const newToken = await this.oauth.refreshToken(restaurantId);

			res = await fetch(fullUrl, {
				method,
				headers: {
					Authorization: `Bearer ${newToken}`,
					'Content-Type': 'application/json',
				},
				body: data ? JSON.stringify(data) : undefined,
			});
		}

		if (!res.ok) throw new Error(`Lightspeed API error: ${res.status}`);

		return { data: await res.json() };
	}

	async markItemsPaid(restaurantId: string, lightspeedSaleId: string, paidItemIds: string[]) {
		const accessToken = await this.getAccessToken(restaurantId);

		// Load items safely, only from this restaurant and not already paid
		const items = await this.billItemRepo.find({
			where: {
				lightspeedItemId: In(paidItemIds),
				isPaid: false,
				bill: { restaurantId },
			},
			relations: ['bill'],
		});

		if (items.length !== paidItemIds.length) {
			throw new BadRequestException('Some items are invalid, already paid, or do not belong to this restaurant.');
		}

		// Mark items as paid in bulk
		for (const item of items) {
			item.isPaid = true;
		}
		await this.billItemRepo.save(items);

		const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

		// Register payment with Lightspeed
		const res = await fetch(`${process.env.LIGHTSPEED_API_URL}/sales/${lightspeedSaleId}/payments`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				amount: totalAmount,
				currency: 'ZAR',
				method: 'external',
			}),
		});

		if (!res.ok) throw new Error(`Lightspeed payment registration failed: ${res.status}`);

		// Create local Payment entity for auditing
		const payment = this.paymentRepo.create({
			bill: { id: items[0].bill.id },
			restaurant: { id: restaurantId },
			amount: totalAmount,
			status: PaymentStatus.SUCCESS,
			metadata: { itemIds: paidItemIds },
		});
		await this.paymentRepo.save(payment);

		this.socketGateway.emitPaymentCompleted(restaurantId, items[0].bill.id, payment);

		this.logger.log(`Marked items paid for sale ${lightspeedSaleId}: R${totalAmount}`);

		return { success: true, amount: totalAmount };
	}
}
