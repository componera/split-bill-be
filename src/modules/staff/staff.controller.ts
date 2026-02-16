import { Controller, Post, Body, UseGuards, Req, Get, Delete, Param } from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
// import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard) // Apply guards at controller level
// @Roles('admin') // Apply role at controller level
export class StaffController {
	constructor(private staffService: StaffService) { }

	// -----------------------------
	// GET all staff + pending invites
	// -----------------------------
	@Get()
	getStaff(@Req() req) {
		return this.staffService.getStaff(req.user.restaurantId);
	}

	// -----------------------------
	// Invite a new staff member
	// -----------------------------
	@Post('invite')
	async invite(@Req() req, @Body() body: { email: string }) {
		return this.staffService.invite(body.email, req.user.restaurantId, UserRole.STAFF);
	}

	// -----------------------------
	// Resend an invite
	// -----------------------------
	@Post('resend')
	async resendInvite(@Body() body: { inviteId: string }) {
		return this.staffService.resendInvite(body.inviteId);
	}

	// -----------------------------
	// Revoke an invite
	// -----------------------------
	@Delete('invite/:id')
	async revokeInvite(@Param('id') id: string) {
		return this.staffService.revokeInvite(id);
	}
}
