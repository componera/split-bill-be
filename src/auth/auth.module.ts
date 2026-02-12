import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { User } from 'src/modules/users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
	imports: [TypeOrmModule.forFeature([User]), JwtModule.register({}), PassportModule],
	providers: [AuthService, JwtStrategy, RolesGuard],
	controllers: [AuthController],
	exports: [AuthService],
})
export class AuthModule {}
