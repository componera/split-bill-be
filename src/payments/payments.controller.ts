import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
	constructor(private payments: PaymentsService) {}

	@Post('create')
	async createPayment(@Body() body: { restaurantId: string; billId: string; itemIds: string[] }) {
		return this.payments.createYocoPayment(body.restaurantId, body.billId, body.itemIds);
	}

	@Post('webhook')
	async webhook(@Body() body: any) {
		return this.payments.handleYocoWebhook(body);
	}
}
