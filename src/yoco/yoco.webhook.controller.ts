/* eslint-disable prettier/prettier */
import { Controller, Post, Body } from '@nestjs/common';

import { YocoService } from './yoco.service';

@Controller('yoco/webhook')
export class YocoWebhookController {
	constructor(private yocoService: YocoService) {}

	@Post()
	async webhook(@Body() body: any) {
		if (body.type === 'payment.succeeded') {
			await this.yocoService.handlePaymentSuccess(body.metadata.paymentId);
		}

		return { received: true };
	}
}
