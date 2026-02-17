import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User, UserRole } from 'src/modules/users/entities/user.entity';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';
import { InviteToken } from './entities/invite-token.entity';

describe('AuthService', () => {
	let service: AuthService;
	let jwtService: JwtService;
	let userRepo: any;
	let restaurantRepo: any;
	let inviteRepo: any;

	const mockUser: Partial<User> = {
		id: 'user-1',
		email: 'test@example.com',
		password: '$2b$10$hashedpassword',
		firstName: 'John',
		lastName: 'Doe',
		role: UserRole.ADMIN,
		restaurantId: 'rest-1',
	};

	beforeEach(async () => {
		userRepo = {
			findOne: mock(() => Promise.resolve(null)),
			create: mock((entity: any) => entity),
			save: mock((entity: any) => Promise.resolve({ id: 'user-1', ...entity })),
			update: mock(() => Promise.resolve({ affected: 1 })),
		};
		restaurantRepo = {
			create: mock((entity: any) => entity),
			save: mock((entity: any) => Promise.resolve({ id: 'rest-1', ...entity })),
		};
		inviteRepo = {
			findOne: mock(() => Promise.resolve(null)),
			create: mock((entity: any) => entity),
			save: mock((entity: any) => Promise.resolve({ id: 'invite-1', ...entity })),
			delete: mock(() => Promise.resolve({ affected: 1 })),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: JwtService,
					useValue: {
						sign: mock(() => 'mock-token'),
						signAsync: mock(() => Promise.resolve('mock-token')),
						verify: mock(() => ({ sub: 'user-1' })),
					},
				},
				{ provide: getRepositoryToken(User), useValue: userRepo },
				{ provide: getRepositoryToken(Restaurant), useValue: restaurantRepo },
				{ provide: getRepositoryToken(InviteToken), useValue: inviteRepo },
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
		jwtService = module.get<JwtService>(JwtService);

		spyOn(Bun.password, 'hash').mockResolvedValue('$2b$10$hashedpassword');
		spyOn(Bun.password, 'verify').mockResolvedValue(true);
	});

	describe('register', () => {
		it('should create a restaurant and admin user, return tokens', async () => {
			const dto = {
				restaurantName: 'Test Restaurant',
				email: 'admin@test.com',
				password: 'password123',
				firstName: 'John',
				lastName: 'Doe',
			};

			const result = await service.register(dto);

			expect(restaurantRepo.create).toHaveBeenCalledWith({ name: 'Test Restaurant' });
			expect(restaurantRepo.save).toHaveBeenCalled();
			expect(Bun.password.hash).toHaveBeenCalledWith('password123', { algorithm: 'bcrypt', cost: 10 });
			expect(userRepo.create).toHaveBeenCalled();
			expect(userRepo.save).toHaveBeenCalled();
			expect(result).toHaveProperty('accessToken');
			expect(result).toHaveProperty('refreshToken');
		});
	});

	describe('login', () => {
		it('should return tokens for valid credentials', async () => {
			userRepo.findOne.mockResolvedValue(mockUser);

			const result = await service.login('test@example.com', 'password123');

			expect(userRepo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
			expect(Bun.password.verify).toHaveBeenCalledWith('password123', '$2b$10$hashedpassword');
			expect(result).toHaveProperty('accessToken');
			expect(result).toHaveProperty('refreshToken');
		});

		it('should throw UnauthorizedException for non-existent user', async () => {
			userRepo.findOne.mockResolvedValue(null);

			expect(service.login('nobody@test.com', 'pass')).rejects.toThrow(UnauthorizedException);
		});

		it('should throw UnauthorizedException for wrong password', async () => {
			userRepo.findOne.mockResolvedValue(mockUser);
			spyOn(Bun.password, 'verify').mockResolvedValue(false);

			expect(service.login('test@example.com', 'wrongpass')).rejects.toThrow(UnauthorizedException);
		});
	});

	describe('generateTokens', () => {
		it('should generate access and refresh tokens in parallel', async () => {
			const result = await service.generateTokens(mockUser as User);

			expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
			expect(result).toHaveProperty('accessToken', 'mock-token');
			expect(result).toHaveProperty('refreshToken', 'mock-token');
		});
	});

	describe('refresh', () => {
		it('should generate new tokens for a valid user', async () => {
			userRepo.findOne.mockResolvedValue(mockUser);

			const result = await service.refresh('user-1');

			expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 'user-1' } });
			expect(result).toHaveProperty('accessToken');
			expect(result).toHaveProperty('refreshToken');
		});
	});

	describe('saveRefreshToken', () => {
		it('should hash the refresh token and store it', async () => {
			await service.saveRefreshToken('user-1', 'some-refresh-token');

			expect(Bun.password.hash).toHaveBeenCalledWith('some-refresh-token', { algorithm: 'bcrypt', cost: 10 });
			expect(userRepo.update).toHaveBeenCalledWith('user-1', { refreshToken: '$2b$10$hashedpassword' });
		});
	});

	describe('acceptInvite', () => {
		it('should create a user from a valid invite and delete the invite', async () => {
			const invite = {
				id: 'invite-1',
				email: 'staff@test.com',
				restaurantId: 'rest-1',
				role: UserRole.STAFF,
				token: 'valid-token',
			};
			inviteRepo.findOne.mockResolvedValue(invite);

			const result = await service.acceptInvite('valid-token', 'password123');

			expect(inviteRepo.findOne).toHaveBeenCalledWith({ where: { token: 'valid-token' } });
			expect(Bun.password.hash).toHaveBeenCalled();
			expect(userRepo.create).toHaveBeenCalledWith(
				expect.objectContaining({
					email: 'staff@test.com',
					restaurantId: 'rest-1',
					role: UserRole.STAFF,
					emailVerified: true,
				}),
			);
			expect(inviteRepo.delete).toHaveBeenCalledWith('invite-1');
			expect(result).toEqual({ success: true });
		});

		it('should throw for an invalid invite token', async () => {
			inviteRepo.findOne.mockResolvedValue(null);

			expect(service.acceptInvite('bad-token', 'pass')).rejects.toThrow('Invalid invite');
		});
	});

	describe('verifyEmail', () => {
		it('should mark the user email as verified', async () => {
			inviteRepo.findOne.mockResolvedValue({ email: 'test@test.com', token: 'tok' });
			userRepo.findOne.mockResolvedValue({ email: 'test@test.com', emailVerified: false });
			userRepo.save.mockResolvedValue({ email: 'test@test.com', emailVerified: true });

			const result = await service.verifyEmail('tok');

			expect(result).toEqual({ success: true });
		});

		it('should throw for an invalid verification token', async () => {
			inviteRepo.findOne.mockResolvedValue(null);

			expect(service.verifyEmail('invalid')).rejects.toThrow('Invalid');
		});
	});
});
