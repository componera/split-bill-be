import { describe, it, expect, beforeEach, spyOn, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';

describe('UsersService', () => {
	let service: UsersService;
	let userRepo: any;

	const mockUser: Partial<User> = {
		id: 'user-1',
		firstName: 'John',
		lastName: 'Doe',
		email: 'john@test.com',
		password: '$2b$10$hashedpassword',
		role: UserRole.STAFF,
		restaurantId: 'rest-1',
	};

	beforeEach(async () => {
		userRepo = {
			findOne: mock(() => Promise.resolve(null)),
			create: mock((entity: any) => entity),
			save: mock((entity: any) => Promise.resolve({ id: 'user-1', ...entity })),
			update: mock(() => Promise.resolve({ affected: 1 })),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{ provide: getRepositoryToken(User), useValue: userRepo },
			],
		}).compile();

		service = module.get<UsersService>(UsersService);

		spyOn(Bun.password, 'hash').mockResolvedValue('$2b$10$hashedpassword');
		spyOn(Bun.password, 'verify').mockResolvedValue(true);
	});

	describe('findByEmail', () => {
		it('should return a user by email', async () => {
			userRepo.findOne.mockResolvedValue(mockUser);

			const result = await service.findByEmail('john@test.com');

			expect(userRepo.findOne).toHaveBeenCalledWith({ where: { email: 'john@test.com' } });
			expect(result).toEqual(mockUser);
		});

		it('should return null if user not found', async () => {
			userRepo.findOne.mockResolvedValue(null);

			const result = await service.findByEmail('unknown@test.com');
			expect(result).toBeNull();
		});
	});

	describe('findById', () => {
		it('should return a user by id', async () => {
			userRepo.findOne.mockResolvedValue(mockUser);

			const result = await service.findById('user-1');

			expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 'user-1' } });
			expect(result).toEqual(mockUser);
		});

		it('should throw NotFoundException if user not found', async () => {
			userRepo.findOne.mockResolvedValue(null);

			expect(service.findById('unknown')).rejects.toThrow(NotFoundException);
		});
	});

	describe('create', () => {
		it('should hash the password and create a user', async () => {
			const result = await service.create('John', 'Doe', 'john@test.com', 'plaintext', 'rest-1', UserRole.STAFF);

			expect(Bun.password.hash).toHaveBeenCalledWith('plaintext', { algorithm: 'bcrypt', cost: 10 });
			expect(userRepo.create).toHaveBeenCalledWith(
				expect.objectContaining({
					firstName: 'John',
					lastName: 'Doe',
					email: 'john@test.com',
					password: '$2b$10$hashedpassword',
					restaurantId: 'rest-1',
					role: UserRole.STAFF,
				}),
			);
			expect(userRepo.save).toHaveBeenCalled();
		});

		it('should default role to STAFF', async () => {
			await service.create('Jane', 'Doe', 'jane@test.com', 'pass', 'rest-1');

			expect(userRepo.create).toHaveBeenCalledWith(
				expect.objectContaining({ role: UserRole.STAFF }),
			);
		});
	});

	describe('validatePassword', () => {
		it('should return true for matching password', async () => {
			const result = await service.validatePassword(mockUser as User, 'plaintext');

			expect(Bun.password.verify).toHaveBeenCalledWith('plaintext', '$2b$10$hashedpassword');
			expect(result).toBe(true);
		});

		it('should return false for wrong password', async () => {
			spyOn(Bun.password, 'verify').mockResolvedValue(false);

			const result = await service.validatePassword(mockUser as User, 'wrong');
			expect(result).toBe(false);
		});
	});

	describe('updateRefreshToken', () => {
		it('should update the refresh token hash', async () => {
			await service.updateRefreshToken('user-1', 'hashed-token');

			expect(userRepo.update).toHaveBeenCalledWith('user-1', { refreshToken: 'hashed-token' });
		});
	});
});
