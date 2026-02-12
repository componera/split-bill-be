import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';

import { BillsService } from './bills.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RestaurantGuard } from 'src/auth/guards/restaurant.guard';

@Controller('bills')
@UseGuards(JwtAuthGuard, RestaurantGuard)
export class BillsController {
	constructor(private billsService: BillsService) { }

	@Post()
	create(@Body() dto: any) {
		return this.billsService.create(dto);
	}

	@Get(':id')
	getBill(@Param('id') id: string) {
		return this.billsService.findById(id);
	}

	@Get('restaurant/:restaurantId')
	getRestaurantBills(@Param('restaurantId') restaurantId: string) {
		return this.billsService.findRestaurantBills(restaurantId);
	}
}
