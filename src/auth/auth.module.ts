import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { UsersModule } from '../modules/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/user.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([User]),
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

	exports: [
		JwtModule, // ✅ THIS IS REQUIRED
		AuthService,
	],
})
export class AuthModule { }
