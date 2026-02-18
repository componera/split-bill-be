import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { InviteToken } from 'src/auth/entities/invite-token.entity';
import { EmailService } from '../email/email.service';
import { SocketGateway } from 'src/websocket/websocket.gateway';

@Injectable()
export class StaffService {
	constructor(
		@InjectRepository(User)
		private userRepo: Repository<User>,
		@InjectRepository(InviteToken)
		private inviteRepo: Repository<InviteToken>,
		private emailService: EmailService,
		private socketGateway: SocketGateway,
	) {}

	async getAll(restaurantId: string) {
		const [users, invites] = await Promise.all([
			this.userRepo.find({ where: { restaurantId } }),
			this.inviteRepo.find({ where: { restaurantId } }),
		]);
		return { users, invites };
	}

	async invite(email: string, restaurantId: string, role: UserRole = UserRole.STAFF) {
		const token = Bun.randomUUIDv7();

		const invite = this.inviteRepo.create({
			email,
			restaurantId,
			role,
			token,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		});

		await this.inviteRepo.save(invite);
		await this.emailService.sendInvite(email, token);
		this.socketGateway.emitStaffUpdated();

		return invite;
	}

	async revokeInvite(id: string) {
		const invite = await this.inviteRepo.findOne({ where: { id } });
		if (!invite) throw new NotFoundException();
		await this.inviteRepo.delete(id);
		this.socketGateway.emitStaffUpdated();
		return { success: true };
	}

	async resendInvite(inviteId: string) {
		const invite = await this.inviteRepo.findOne({ where: { id: inviteId } });
		if (!invite) throw new NotFoundException();
		await this.emailService.sendInvite(invite.email, invite.token);
		return { success: true };
	}

	async promote(userId: string) {
		const user = await this.userRepo.findOne({ where: { id: userId } });
		if (!user) throw new NotFoundException();
		user.role = UserRole.ADMIN;
		await this.userRepo.save(user);
		this.socketGateway.emitStaffUpdated();
		return user;
	}

	async demote(userId: string) {
		const user = await this.userRepo.findOne({ where: { id: userId } });
		if (!user) throw new NotFoundException();
		user.role = UserRole.STAFF;
		await this.userRepo.save(user);
		this.socketGateway.emitStaffUpdated();
		return user;
	}

	async remove(userId: string) {
		const user = await this.userRepo.findOne({ where: { id: userId } });
		if (!user) throw new NotFoundException();
		await this.userRepo.delete(userId);
		this.socketGateway.emitStaffUpdated();
		return { success: true };
	}
}
