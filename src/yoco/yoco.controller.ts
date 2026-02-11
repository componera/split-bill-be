import { Controller, Post, Body } from '@nestjs/common';

import { YocoService } from './yoco.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('yoco')
export class YocoController {
	constructor(private yocoService: YocoService) {}

	@Post('checkout')
	createCheckout(@Body() dto: CreatePaymentDto) {
		return this.yocoService.createCheckout(dto);
	}
}
