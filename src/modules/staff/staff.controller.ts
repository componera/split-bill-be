import { Controller, Get, Post, Delete, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { StaffService } from './staff.service';
import { UserRole } from '../users/entities/user.entity';

@Controller('staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
	constructor(private readonly staffService: StaffService) {}

	@Get()
	getAll(@Req() req: FastifyRequest) {
		return this.staffService.getAll((req as any).user.restaurantId);
	}

	@Post('invite')
	invite(@Req() req: FastifyRequest, @Body() dto: { email: string }) {
		return this.staffService.invite(dto.email, (req as any).user.restaurantId, UserRole.STAFF);
	}

	@Delete('invite/:id')
	revoke(@Param('id') id: string) {
		return this.staffService.revokeInvite(id);
	}

	@Post('resend')
	resend(@Body() dto: { inviteId: string }) {
		return this.staffService.resendInvite(dto.inviteId);
	}

	@Patch('promote/:id')
	promote(@Param('id') id: string) {
		return this.staffService.promote(id);
	}

	@Patch('demote/:id')
	demote(@Param('id') id: string) {
		return this.staffService.demote(id);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.staffService.remove(id);
	}
}
