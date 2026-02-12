import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

import { Bill } from '../bills/entities/bill.entity';
import { Payment } from '../payments/entities/payment.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Bill, Payment])],
	controllers: [AdminController],
	providers: [AdminService],
	exports: [AdminService],
})
export class AdminModule {}
