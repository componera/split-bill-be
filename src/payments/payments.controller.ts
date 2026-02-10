import { Controller, Get, Param } from '@nestjs/common';

import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
	constructor(private paymentsService: PaymentsService) { }

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
