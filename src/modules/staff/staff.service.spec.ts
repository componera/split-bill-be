import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { StaffService } from './staff.service';
import { InviteToken } from 'src/auth/entities/invite-token.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';
import { SocketGateway } from 'src/websocket/websocket.gateway';

describe('StaffService', () => {
	let service: StaffService;
	let inviteRepo: any;
	let userRepo: any;
	let emailService: any;
	let socketGateway: any;

	const mockUser = {
		id: 'user-1',
		email: 'staff@test.com',
		role: UserRole.STAFF,
		restaurantId: 'rest-1',
	};

	beforeEach(async () => {
		inviteRepo = {
			findOne: mock(() => Promise.resolve(null)),
			find: mock(() => Promise.resolve([])),
			create: mock((entity: any) => entity),
			save: mock((entity: any) => Promise.resolve({ id: 'invite-1', ...entity })),
			delete: mock(() => Promise.resolve({ affected: 1 })),
		};
		userRepo = {
			findOne: mock(() => Promise.resolve(null)),
			find: mock(() => Promise.resolve([])),
			save: mock((entity: any) => Promise.resolve(entity)),
			delete: mock(() => Promise.resolve({ affected: 1 })),
		};
		emailService = {
			sendInvite: mock(() => Promise.resolve()),
		};
		socketGateway = {
			emitStaffUpdated: mock(() => { }),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				StaffService,
				{ provide: getRepositoryToken(InviteToken), useValue: inviteRepo },
				{ provide: getRepositoryToken(User), useValue: userRepo },
				{ provide: EmailService, useValue: emailService },
				{ provide: SocketGateway, useValue: socketGateway },
			],
		}).compile();

		service = module.get<StaffService>(StaffService);
	});

	describe('getAll', () => {
		it('should return users and invites for a restaurant in parallel', async () => {
			const mockUsers = [{ id: 'u-1', email: 'user@test.com' }];
			const mockInvites = [{ id: 'i-1', email: 'pending@test.com' }];
			userRepo.find.mockResolvedValue(mockUsers);
			inviteRepo.find.mockResolvedValue(mockInvites);

			const result = await service.getAll('rest-1');

			expect(userRepo.find).toHaveBeenCalledWith({ where: { restaurantId: 'rest-1' } });
			expect(inviteRepo.find).toHaveBeenCalledWith({ where: { restaurantId: 'rest-1' } });
			expect(result).toEqual({ users: mockUsers, invites: mockInvites });
		});
	});

	describe('invite', () => {
		it('should create an invite, send email, and emit socket event', async () => {
			const result = await service.invite('new@test.com', 'rest-1', UserRole.STAFF);

			expect(inviteRepo.create).toHaveBeenCalledWith(
				expect.objectContaining({
					email: 'new@test.com',
					restaurantId: 'rest-1',
					role: UserRole.STAFF,
				}),
			);
			expect(inviteRepo.save).toHaveBeenCalled();
			expect(emailService.sendInvite).toHaveBeenCalledWith('new@test.com', expect.any(String));
			expect(socketGateway.emitStaffUpdated).toHaveBeenCalled();
		});
	});

	describe('revokeInvite', () => {
		it('should delete the invite and emit socket event', async () => {
			inviteRepo.findOne.mockResolvedValue({ id: 'invite-1' });

			const result = await service.revokeInvite('invite-1');

			expect(inviteRepo.delete).toHaveBeenCalledWith('invite-1');
			expect(socketGateway.emitStaffUpdated).toHaveBeenCalled();
			expect(result).toEqual({ success: true });
		});

		it('should throw NotFoundException for unknown invite', async () => {
			inviteRepo.findOne.mockResolvedValue(null);

			expect(service.revokeInvite('unknown')).rejects.toThrow(NotFoundException);
		});
	});

	describe('resendInvite', () => {
		it('should resend the invite email', async () => {
			inviteRepo.findOne.mockResolvedValue({ id: 'invite-1', email: 'staff@test.com', token: 'tok-123' });

			const result = await service.resendInvite('invite-1');

			expect(emailService.sendInvite).toHaveBeenCalledWith('staff@test.com', 'tok-123');
			expect(result).toEqual({ success: true });
		});

		it('should throw NotFoundException for unknown invite', async () => {
			inviteRepo.findOne.mockResolvedValue(null);

			expect(service.resendInvite('unknown')).rejects.toThrow(NotFoundException);
		});
	});

	describe('promote', () => {
		it('should set user role to ADMIN and emit socket event', async () => {
			userRepo.findOne.mockResolvedValue({ ...mockUser });

			const result = await service.promote('user-1');

			expect(userRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({ role: UserRole.ADMIN }),
			);
			expect(socketGateway.emitStaffUpdated).toHaveBeenCalled();
		});

		it('should throw NotFoundException for unknown user', async () => {
			userRepo.findOne.mockResolvedValue(null);

			expect(service.promote('unknown')).rejects.toThrow(NotFoundException);
		});
	});

	describe('demote', () => {
		it('should set user role to STAFF and emit socket event', async () => {
			userRepo.findOne.mockResolvedValue({ ...mockUser, role: UserRole.ADMIN });

			const result = await service.demote('user-1');

			expect(userRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({ role: UserRole.STAFF }),
			);
			expect(socketGateway.emitStaffUpdated).toHaveBeenCalled();
		});

		it('should throw NotFoundException for unknown user', async () => {
			userRepo.findOne.mockResolvedValue(null);

			expect(service.demote('unknown')).rejects.toThrow(NotFoundException);
		});
	});

	describe('remove', () => {
		it('should delete the user and emit socket event', async () => {
			userRepo.findOne.mockResolvedValue({ ...mockUser });

			const result = await service.remove('user-1');

			expect(userRepo.delete).toHaveBeenCalledWith('user-1');
			expect(socketGateway.emitStaffUpdated).toHaveBeenCalled();
			expect(result).toEqual({ success: true });
		});

		it('should throw NotFoundException for unknown user', async () => {
			userRepo.findOne.mockResolvedValue(null);

			expect(service.remove('unknown')).rejects.toThrow(NotFoundException);
		});
	});
});
