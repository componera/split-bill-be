import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    findByEmail(email: string) {
        return this.userRepo.findOne({
            where: { email },
        });
    }

    findById(id: string) {
        return this.userRepo.findOne({
            where: { id },
        });
    }

    async updateRefreshToken(userId: string, hash: string) {
        await this.userRepo.update(userId, {
            refreshToken: hash,
        });
    }
}
