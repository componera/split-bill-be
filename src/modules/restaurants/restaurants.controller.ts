import { Body, Controller, Param, Post } from '@nestjs/common';

import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { ConnectLightspeedDto } from './dto/connect-lightspeed.dto';
import { ConnectYocoDto } from './dto/connect-yoco.dto';

@Controller('restaurants')
export class RestaurantsController {
	constructor(
		private restaurantsService: RestaurantsService,

	) { }

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
}
