import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { User } from '../users/entities/user.entity';
import { InviteToken } from '../../auth/entities/invite-token.entity';
import { EmailModule } from '../email/email.module';

@Module({
	imports: [TypeOrmModule.forFeature([User, InviteToken]), EmailModule],
	providers: [StaffService],
	controllers: [StaffController],
	exports: [StaffService],
})
export class StaffModule {}
