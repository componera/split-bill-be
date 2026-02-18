import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private userRepo: Repository<User>,
	) {}

	async findByEmail(email: string): Promise<User | null> {
		return this.userRepo.findOne({ where: { email } });
	}

	async findById(id: string): Promise<User> {
		const user = await this.userRepo.findOne({ where: { id } });
		if (!user) throw new NotFoundException('User not found');
		return user;
	}

	async create(
		firstName: string,
		lastName: string,
		email: string,
		password: string,
		restaurantId: string,
		role: UserRole = UserRole.STAFF,
	): Promise<User> {
		const passwordHash = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 });
		const user = this.userRepo.create({ firstName, lastName, email, password: passwordHash, restaurantId, role });
		return this.userRepo.save(user);
	}

	async validatePassword(user: User, password: string): Promise<boolean> {
		return Bun.password.verify(password, user.password);
	}

	async updateRefreshToken(userId: string, hash: string): Promise<void> {
		await this.userRepo.update(userId, { refreshToken: hash });
	}
}
