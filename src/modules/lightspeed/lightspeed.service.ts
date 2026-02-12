import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { LightspeedOAuthService } from './lightspeed.oauth.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LightspeedToken } from './lightspeed-token.entity';
import { BillItem } from 'src/bills/bill-item.entity';

@Injectable()
export class LightspeedService {
	private readonly logger = new Logger(LightspeedService.name);

	constructor(
		private oauth: LightspeedOAuthService,

		@InjectRepository(LightspeedToken)
		private tokenRepo: Repository<LightspeedToken>,

		@InjectRepository(BillItem)
		private billItemRepo: Repository<BillItem>,
	) {}

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

	/*
 ========================================
 MARK ITEMS PAID
 ========================================
 */

	async markItemsPaid(restaurantId: string, lightspeedSaleId: string, paidItemIds: string[]) {
		const token = await this.getAccessToken(restaurantId);

		/*
		STEP 1: Mark items paid in your own database
		*/

		await this.billItemRepo.update(
			{
				restaurantId,
				lightspeedItemId: paidItemIds as any,
			},
			{
				paid: true,
			},
		);

		/*
		STEP 2: Calculate total amount of paid items
		*/

		const items = await this.billItemRepo.find({
			where: {
				restaurantId,
				lightspeedItemId: paidItemIds as any,
			},
		});

		const totalAmount = items.reduce((sum, item) => sum + Number(item.price), 0);

		/*
		STEP 3: Register payment with Lightspeed
		*/

		await axios.post(
			`${process.env.LIGHTSPEED_API_URL}/sales/${lightspeedSaleId}/payments`,
			{
				amount: totalAmount,
				currency: 'ZAR',
				method: 'external',
			},
			{
				headers: {
					Authorization: `Bearer ${token.accessToken}`,
				},
			},
		);

		this.logger.log(`Marked items paid for sale ${lightspeedSaleId}`);

		return {
			success: true,
			amount: totalAmount,
		};
	}
}
