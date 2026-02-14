import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InviteToken } from '../../auth/entities/invite-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { EmailService } from '../email/email.service';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class StaffService {
	constructor(
		@InjectRepository(InviteToken)
		private inviteRepo: Repository<InviteToken>,

		@InjectRepository(User)
		private userRepo: Repository<User>,

		private emailService: EmailService,
	) {}

	async invite(email: string, restaurantId: string, role: UserRole) {
		const token = randomUUID();

		const invite = this.inviteRepo.create({
			email,
			restaurantId,
			role,
			token,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		});

		await this.inviteRepo.save(invite);

		await this.emailService.sendInvite(email, token);

		return { success: true };
	}

	async getStaff(restaurantId: string) {
		const users = await this.userRepo.find({
			where: { restaurantId },
		});

		const invites = await this.inviteRepo.find({
			where: { restaurantId },
		});

		return {
			users,
			invites,
		};
	}

	// Resend invite
	async resendInvite(inviteId: string) {
		const invite = await this.inviteRepo.findOne({
			where: { id: inviteId },
		});

		if (!invite) throw new NotFoundException('Invite not found');

		await this.emailService.sendInvite(invite.email, invite.token);
		return { success: true };
	}

	// Revoke invite
	async revokeInvite(inviteId: string) {
		const invite = await this.inviteRepo.findOne({
			where: { id: inviteId },
		});

		if (!invite) throw new NotFoundException('Invite not found');

		await this.inviteRepo.delete(inviteId);
		return { success: true };
	}
}
