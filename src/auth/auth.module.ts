import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UsersModule } from 'src/modules/users/users.module';
import { AuthService } from './auth.service';
import { InviteToken } from './entities/invite-token.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthController } from './auth.controller';

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
	controllers: [AuthController],
	providers: [AuthService, JwtAuthGuard],
	exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule { }
