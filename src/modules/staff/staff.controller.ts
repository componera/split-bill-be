import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { StaffService } from './staff.service';

@Controller('staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
	constructor(private readonly staffService: StaffService) { }

	@Get()
	getAll() {
		return this.staffService.getAll();
	}

	@Post('invite')
	invite(@Body() dto: { email: string }) {
		return this.staffService.invite(dto.email);
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
