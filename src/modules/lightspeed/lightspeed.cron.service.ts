import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';

import { LightspeedToken } from './entities/lightspeed-token.entity';
import { LightspeedSyncService } from './lightspeed.sync.service';

@Injectable()
export class LightspeedCronService {
	constructor(
		@InjectRepository(LightspeedToken)
		private lightspeedTokenRepo: Repository<LightspeedToken>,

		private syncService: LightspeedSyncService,
	) {}

	@Cron(CronExpression.EVERY_30_SECONDS)
	async syncAllRestaurants() {
		// Only active, non-expired tokens
		const tokens = await this.lightspeedTokenRepo.find({
			where: {
				isActive: true,
				expiresAt: MoreThan(new Date()),
			},
			relations: ['restaurant'],
		});

		for (const token of tokens) {
			try {
				await this.syncService.syncSales(token.restaurantId);
			} catch (e) {
				console.error(`Lightspeed sync failed: ${token.restaurantId}`, e.message);
			}
		}
	}
}
