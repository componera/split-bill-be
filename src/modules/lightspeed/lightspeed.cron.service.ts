import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Restaurant } from '../../restaurants/restaurants.entity';
import { LightspeedSyncService } from './lightspeed.sync.service';

@Injectable()
export class LightspeedCronService {
	constructor(
		@InjectRepository(Restaurant)
		private restaurants: Repository<Restaurant>,

		private syncService: LightspeedSyncService,
	) {}

	// Runs every 30 seconds
	@Cron(CronExpression.EVERY_30_SECONDS)
	async syncAllRestaurants() {
		const restaurants = await this.restaurants.find({
			where: {
				lightspeedAccessToken: true,
			},
		});

		for (const restaurant of restaurants) {
			try {
				await this.syncService.syncSales(restaurant.id);
			} catch (e) {
				console.error(`Lightspeed sync failed: ${restaurant.id}`, e.message);
			}
		}
	}
}
