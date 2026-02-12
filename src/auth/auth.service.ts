import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
	constructor(
		private jwtService: JwtService,
		@InjectRepository(User)
		private users: Repository<User>,
	) { }

	async login(email: string, password: string) {
		const user = await this.users.findOne({ where: { email } });

		if (!user) throw new UnauthorizedException();

		const valid = await bcrypt.compare(password, user.password);

		if (!valid) throw new UnauthorizedException();

		const tokens = await this.generateTokens(user);

		await this.saveRefreshToken(user.id, tokens.refreshToken);

		return tokens;
	}

	async generateTokens(user: User) {
		const payload = {
			sub: user.id,
			restaurantId: user.restaurantId,
			role: user.role,
			email: user.email,
		};

		const accessToken = await this.jwtService.signAsync(payload, {
			secret: process.env.JWT_SECRET,
			expiresIn: '15m',
		});

		const refreshToken = await this.jwtService.signAsync(payload, {
			secret: process.env.JWT_REFRESH_SECRET,
			expiresIn: '30d',
		});

		return {
			accessToken,
			refreshToken,
		};
	}

	async refresh(userId: string) {
		const user = await this.users.findOne({
			where: { id: userId },
		});

		return this.generateTokens(user);
	}

	async saveRefreshToken(userId: string, token: string) {
		const hash = await bcrypt.hash(token, 10);

		await this.users.update(userId, {
			refreshToken: hash,
		});
	}
}
