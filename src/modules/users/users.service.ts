import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    // Find user by email
    async findByEmail(email: string): Promise<User | null> {
        return this.userRepo.findOne({ where: { email } });
    }

    // Find user by id
    async findById(id: string): Promise<User> {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    // Create a new user with password hash
    async create(name: string, email: string, password: string, restaurantId: string, role: UserRole = UserRole.STAFF): Promise<User> {
        const passwordHash = await bcrypt.hash(password, 10);
        const user = this.userRepo.create({ name, email, password: passwordHash, restaurantId, role });
        return this.userRepo.save(user);
    }

    // Validate password
    async validatePassword(user: User, password: string): Promise<boolean> {
        return bcrypt.compare(password, user.password);
    }

    // Update refresh token for JWT refresh flow
    async updateRefreshToken(userId: string, hash: string): Promise<void> {
        await this.userRepo.update(userId, { refreshToken: hash });
    }
}
