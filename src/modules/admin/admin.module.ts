import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

import { Bill } from '../bills/entities/bill.entity';
import { Payment } from '../payments/entities/payment.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Module({
	imports: [AuthModule, TypeOrmModule.forFeature([Bill, Payment, User])],
	controllers: [AdminController],
	providers: [AdminService, UsersService],
	exports: [AdminService, UsersService],
})
export class AdminModule {}
