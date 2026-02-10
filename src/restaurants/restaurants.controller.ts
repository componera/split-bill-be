import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { ConnectLightspeedDto } from './dto/connect-lightspeed.dto';
import { ConnectYocoDto } from './dto/connect-yoco.dto';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill } from '../bills/bills.entity';

@Controller('restaurants')
export class RestaurantsController {
	constructor(
		private restaurantsService: RestaurantsService,

		@InjectRepository(Bill)
		private billRepo: Repository<Bill>,
	) {}

	@Post()
	create(@Body() dto: CreateRestaurantDto) {
		return this.restaurantsService.create(dto);
	}

	@Post(':id/connect-lightspeed')
	connectLightspeed(@Param('id') id: string, @Body() dto: ConnectLightspeedDto) {
		return this.restaurantsService.connectLightspeed(id, dto);
	}

	@Post(':id/connect-yoco')
	connectYoco(@Param('id') id: string, @Body() dto: ConnectYocoDto) {
		return this.restaurantsService.connectYoco(id, dto);
	}

	// FIXED ROUTE
	@Get(':restaurantId/bills/:billId')
	async getBill(@Param('restaurantId') restaurantId: string, @Param('billId') billId: string) {
		return this.billRepo.findOne({
			where: {
				id: billId,
				restaurantId,
			},
			relations: ['items'],
		});
	}
}
