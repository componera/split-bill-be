import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';

import { AdminService } from './admin.service';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RestaurantGuard } from '../../auth/guards/restaurant.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RestaurantGuard)
export class AdminController {
	constructor(private adminService: AdminService) {}

	@Get('stats')
	@Roles('OWNER', 'MANAGER')
	getStats(@Req() req) {
		return this.adminService.getStats(req.user.restaurantId);
	}

	@Get('chart-stats')
	@Roles('OWNER', 'MANAGER')
	getChartStats(@Req() req, @Query('days') days?: string) {
		const d = days ? parseInt(days, 10) : 7;
		return this.adminService.getChartStats(req.user.restaurantId, isNaN(d) ? 7 : d);
	}

	@Get('bills')
	@Roles('OWNER', 'MANAGER')
	getBills(@Req() req) {
		return this.adminService.getBills(req.user.restaurantId);
	}

	@Get(':restaurantId/payments')
	@Roles('OWNER', 'MANAGER')
	getPayments(@Req() req) {
		return this.adminService.getPayments(req.user.restaurantId);
	}
}
