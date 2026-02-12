import { Controller, Post, Headers, Body, HttpCode } from '@nestjs/common';

import { LightspeedSyncService } from './lightspeed.sync.service';

@Controller('integrations/lightspeed/webhook')
export class LightspeedWebhookController {
	constructor(private syncService: LightspeedSyncService) {}

	@Post()
	@HttpCode(200)
	async handleWebhook(@Headers('x-lightspeed-signature') signature: string, @Body() payload: any) {
		// Validate webhook signature (recommended)
		// optional but production recommended

		const restaurantId = payload.accountID;

		await this.syncService.syncOrder(restaurantId, payload.saleID);

		return { received: true };
	}
}
