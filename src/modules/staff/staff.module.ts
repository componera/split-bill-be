import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { User } from '../users/entities/user.entity';
import { InviteToken } from '../../auth/entities/invite-token.entity';
import { EmailModule } from '../email/email.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from '../users/users.service';
import { WebSocketModule } from '../../websocket/websocket.module';

@Module({
	imports: [AuthModule, TypeOrmModule.forFeature([User, InviteToken]), EmailModule, WebSocketModule],
	providers: [StaffService, UsersService],
	controllers: [StaffController],
	exports: [StaffService, UsersService],
})
export class StaffModule { }
