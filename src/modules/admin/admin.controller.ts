import { Controller, Get, UseGuards, Req } from '@nestjs/common';

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

	@Get('bills')
	@Roles('OWNER', 'MANAGER')
	getBills(@Req() req) {
		return this.adminService.getBills(req.user.restaurantId);
	}

	@Get(':restaurantId/payments')
	@Roles('OWNER', 'MANAGER')
	getPayments(@Req() rereq) {
		return this.adminService.getPayments(rereq.user.restaurantIdstaurantId);
	}
}
