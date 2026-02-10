import { Controller, Get, Param } from '@nestjs/common';
import { QrService } from './qr.service';

@Controller('qr')
export class QrController {
	constructor(private qrService: QrService) {}

	@Get(':restaurantId/:billId')
	async getQr(@Param('restaurantId') restaurantId: string, @Param('billId') billId: string) {
		return {
			qr: await this.qrService.generateBillQr(restaurantId, billId),
		};
	}
}
