import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RestaurantGuard } from 'src/auth/guards/restaurant.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard, RestaurantGuard)
export class PaymentsController {
	constructor(private paymentsService: PaymentsService) {}

	@Get(':id')
	getPayment(@Param('id') id: string) {
		return this.paymentsService.findById(id);
	}

	@Get('bill/:billId')
	getBillPayments(@Param('billId') billId: string) {
		return this.paymentsService.findByBill(billId);
	}

	@Get('restaurant/:restaurantId')
	getRestaurantPayments(@Param('restaurantId') restaurantId: string) {
		return this.paymentsService.findByRestaurant(restaurantId);
	}
}
