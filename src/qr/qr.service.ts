import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {
	async generateBillQr(restaurantId: string, billId: string) {
		const url = `${process.env.FRONTEND_URL}/restaurant/${restaurantId}/bill/${billId}`;

		const qr = await QRCode.toDataURL(url);

		return {
			url,
			qr,
		};
	}
}
