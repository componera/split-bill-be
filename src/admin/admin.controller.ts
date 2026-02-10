import { Controller, Get, Req } from '@nestjs/common';

@Controller('admin')
export class AdminController {
	constructor(private service: AdminService) {}

	@Get('stats')
	stats(@Req() req) {
		return this.service.stats(req.user.restaurantId);
	}

	@Get('bills')
	bills(@Req() req) {
		return this.service.bills(req.user.restaurantId);
	}

	@Get('payments')
	payments(@Req() req) {
		return this.service.payments(req.user.restaurantId);
	}
}
