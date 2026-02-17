import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { StaffService } from './staff.service';
import { InviteToken } from 'src/auth/entities/invite-token.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';

describe('StaffService', () => {
	let service: StaffService;
	let inviteRepo: any;
	let userRepo: any;
	let emailService: any;

	beforeEach(async () => {
		inviteRepo = {
			findOne: mock(() => Promise.resolve(null)),
			find: mock(() => Promise.resolve([])),
			create: mock((entity: any) => entity),
			save: mock((entity: any) => Promise.resolve({ id: 'invite-1', ...entity })),
			delete: mock(() => Promise.resolve({ affected: 1 })),
		};
		userRepo = {
			find: mock(() => Promise.resolve([])),
		};
		emailService = {
			sendInvite: mock(() => Promise.resolve()),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				StaffService,
				{ provide: getRepositoryToken(InviteToken), useValue: inviteRepo },
				{ provide: getRepositoryToken(User), useValue: userRepo },
				{ provide: EmailService, useValue: emailService },
			],
		}).compile();

		service = module.get<StaffService>(StaffService);
	});

	describe('invite', () => {
		it('should create an invite token and send email', async () => {
			const result = await service.invite('staff@test.com', 'rest-1', UserRole.STAFF);

			expect(inviteRepo.create).toHaveBeenCalledWith(
				expect.objectContaining({
					email: 'staff@test.com',
					restaurantId: 'rest-1',
					role: UserRole.STAFF,
				}),
			);
			expect(inviteRepo.save).toHaveBeenCalled();
			expect(emailService.sendInvite).toHaveBeenCalledWith('staff@test.com', expect.any(String));
			expect(result).toEqual({ success: true });
		});
	});

	describe('getStaff', () => {
		it('should return users and pending invites', async () => {
			const mockUsers = [{ id: 'u-1', email: 'user@test.com' }];
			const mockInvites = [{ id: 'i-1', email: 'pending@test.com' }];
			userRepo.find.mockResolvedValue(mockUsers);
			inviteRepo.find.mockResolvedValue(mockInvites);

			const result = await service.getStaff('rest-1');

			expect(userRepo.find).toHaveBeenCalledWith({ where: { restaurantId: 'rest-1' } });
			expect(inviteRepo.find).toHaveBeenCalledWith({ where: { restaurantId: 'rest-1' } });
			expect(result).toEqual({ users: mockUsers, invites: mockInvites });
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

	describe('revokeInvite', () => {
		it('should delete the invite', async () => {
			inviteRepo.findOne.mockResolvedValue({ id: 'invite-1' });

			const result = await service.revokeInvite('invite-1');

			expect(inviteRepo.delete).toHaveBeenCalledWith('invite-1');
			expect(result).toEqual({ success: true });
		});

		it('should throw NotFoundException for unknown invite', async () => {
			inviteRepo.findOne.mockResolvedValue(null);

			expect(service.revokeInvite('unknown')).rejects.toThrow(NotFoundException);
		});
	});
});
