import { Controller, UseGuards, Post, Body, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RestaurantGuard } from 'src/auth/guards/restaurant.guard';
import { BillsService } from './bills.service';

@Controller('bills')
@UseGuards(JwtAuthGuard, RestaurantGuard)
export class BillsController {
	constructor(private billsService: BillsService) {}

	@Post()
	create(@Body() dto: any) {
		return this.billsService.create(dto);
	}

	// MUST come before :id
	@Get('restaurant/:restaurantId')
	getRestaurantBills(@Param('restaurantId') restaurantId: string) {
		return this.billsService.findRestaurantBills(restaurantId);
	}

	@Get(':id')
	getBill(@Param('id') id: string) {
		return this.billsService.findById(id);
	}
}
