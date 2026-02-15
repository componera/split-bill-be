import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { UsersModule } from '../modules/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';
import { InviteToken } from './entities/invite-token.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
	imports: [
		TypeOrmModule.forFeature([User, Restaurant, InviteToken]),
		UsersModule,
		ConfigModule,

		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				secret: config.get<string>('JWT_SECRET'),
				signOptions: { expiresIn: '15m' },
			}),
		}),
	],

	providers: [AuthService],

	exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule { }
