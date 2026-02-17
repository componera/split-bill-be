import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Invite } from './entities/invite.entity';
import { SocketGateway } from 'src/websocket/websocket.gateway';

@Injectable()
export class StaffService {
	constructor(
		@InjectRepository(User)
		private userRepo: Repository<User>,
		@InjectRepository(Invite)
		private inviteRepo: Repository<Invite>,
		private socketGateway: SocketGateway,
	) { }

	async getAll() {
		const users = await this.userRepo.find();
		const invites = await this.inviteRepo.find();
		return { users, invites };
	}

	async invite(email: string) {
		const invite = this.inviteRepo.create({
			email,
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
		});

		await this.inviteRepo.save(invite);
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
		// TODO: send email here
		return { success: true };
	}

	async promote(userId: string) {
		const user = await this.userRepo.findOne({ where: { id: userId } });
		if (!user) throw new NotFoundException();
		user.role = 'admin';
		await this.userRepo.save(user);
		this.socketGateway.emitStaffUpdated();
		return user;
	}

	async demote(userId: string) {
		const user = await this.userRepo.findOne({ where: { id: userId } });
		if (!user) throw new NotFoundException();
		user.role = 'staff';
		await this.userRepo.save(user);
		this.socketGateway.emitStaffUpdated();
		return user;
	}

	async remove(userId: string) {
		await this.userRepo.delete(userId);
		this.socketGateway.emitStaffUpdated();
		return { success: true };
	}
}
