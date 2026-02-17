import { Controller, Get, Query, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { LightspeedOAuthService } from './lightspeed.oauth.service';

@Controller('lightspeed')
export class LightspeedController {
	constructor(private oauth: LightspeedOAuthService) {}

	@Get('connect')
	connect(@Query('restaurantId') restaurantId: string) {
		return {
			url: this.oauth.getAuthUrl(restaurantId),
		};
	}

	@Get('callback')
	async callback(@Query('code') code: string, @Query('state') restaurantId: string, @Res() res: FastifyReply) {
		await this.oauth.exchangeCode(code, restaurantId);

		return res.redirect(`${process.env.FRONTEND_URL}/admin/integrations`);
	}
}
