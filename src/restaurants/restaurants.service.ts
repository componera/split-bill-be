import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';

import { Restaurant } from './restaurants.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { ConnectLightspeedDto } from './dto/connect-lightspeed.dto';
import { ConnectYocoDto } from './dto/connect-yoco.dto';

import { LightspeedOAuthService } from '../lightspeed/lightspeed.oauth.service';

@Injectable()
export class RestaurantsService {
	constructor(
		@InjectRepository(Restaurant)
		private restaurantRepo: Repository<Restaurant>,

		private lightspeedOAuth: LightspeedOAuthService,
	) {}

	/**
	 * Create a restaurant
	 */
	async create(dto: CreateRestaurantDto) {
		const restaurant = this.restaurantRepo.create({
			name: dto.name,
			email: dto.email,
		});

		return this.restaurantRepo.save(restaurant);
	}

	/**
	 * Find a restaurant by id
	 */
	async findById(id: string) {
		const restaurant = await this.restaurantRepo.findOne({
			where: { id },
		});
		if (!restaurant) throw new NotFoundException('Restaurant not found');
		return restaurant;
	}

	/**
	 * Connect Lightspeed
	 * Only saves accountId here, tokens are stored in LightspeedToken table
	 */
	async connectLightspeed(restaurantId: string, dto: ConnectLightspeedDto) {
		const restaurant = await this.findById(restaurantId);

		restaurant.lightspeedAccountId = dto.accountId;
		return this.restaurantRepo.save(restaurant);
	}

	/**
	 * Connect Yoco
	 */
	async connectYoco(restaurantId: string, dto: ConnectYocoDto) {
		const restaurant = await this.findById(restaurantId);

		restaurant.yocoSecretKey = dto.secretKey;
		return this.restaurantRepo.save(restaurant);
	}

	/**
	 * Get all restaurants that have Lightspeed connected
	 */
	async findAllConnectedLightspeed() {
		return this.restaurantRepo.createQueryBuilder('restaurant').innerJoin('restaurant.lightspeedTokens', 'token').getMany();
	}
}
