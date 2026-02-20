import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';
import { InviteToken } from './entities/invite-token.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
	constructor(
		private jwtService: JwtService,

		@InjectRepository(User)
		private userRepo: Repository<User>,

		@InjectRepository(Restaurant)
		private restaurantRepo: Repository<Restaurant>,

		@InjectRepository(InviteToken)
		private inviteRepo: Repository<InviteToken>,
	) { }

	/** REGISTER NEW USER */
	async register(dto: RegisterDto) {
		const restaurant = this.restaurantRepo.create({
			name: dto.restaurantName,
		});
		await this.restaurantRepo.save(restaurant);

		const passwordHash = await Bun.password.hash(dto.password, { algorithm: 'bcrypt', cost: 10 });

		const user = this.userRepo.create({
			email: dto.email,
			password: passwordHash,
			firstName: dto.firstName,
			lastName: dto.lastName,
			role: UserRole.ADMIN,
			restaurantId: restaurant.id,
		});
		await this.userRepo.save(user);

		return this.generateTokens(user);
	}

	/** LOGIN EXISTING USER */
	async login(dto: LoginDto) {
		const user = await this.userRepo.findOne({ where: { email: dto.email } });
		if (!user) throw new UnauthorizedException();

		const valid = await Bun.password.verify(dto.password, user.password);
		if (!valid) throw new UnauthorizedException();

		return this.generateTokens(user);
	}

	async generateTokens(user: User) {
		const payload = {
			sub: user.id,
			restaurantId: user.restaurantId,
			role: user.role,
			email: user.email,
		};

		const [accessToken, refreshToken] = await Promise.all([
			this.jwtService.signAsync(payload, {
				secret: process.env.JWT_SECRET,
				expiresIn: '15m',
			}),
			this.jwtService.signAsync(payload, {
				secret: process.env.JWT_SECRET,
				expiresIn: '30d',
			}),
		]);

		return { accessToken, refreshToken };
	}

	async refresh(userId: string) {
		const user = await this.userRepo.findOne({
			where: { id: userId },
		});

		return this.generateTokens(user);
	}

	async saveRefreshToken(userId: string, token: string) {
		const hash = await Bun.password.hash(token, { algorithm: 'bcrypt', cost: 10 });

		await this.userRepo.update(userId, { refreshToken: hash });
	}

	async acceptInvite(token: string, password: string) {
		const invite = await this.inviteRepo.findOne({
			where: { token },
		});
		if (!invite) throw new Error('Invalid invite');

		const passwordHash = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 });

		const user = this.userRepo.create({
			email: invite.email,
			restaurantId: invite.restaurantId,
			role: invite.role,
			password: passwordHash,
			emailVerified: true,
		});
		await this.userRepo.save(user);
		await this.inviteRepo.delete(invite.id);

		return { success: true };
	}

	async verifyEmail(token: string) {
		const invite = await this.inviteRepo.findOne({
			where: { token },
		});
		if (!invite) throw new Error('Invalid');

		const user = await this.userRepo.findOne({
			where: { email: invite.email },
		});

		user.emailVerified = true;
		await this.userRepo.save(user);

		return { success: true };
	}
}
