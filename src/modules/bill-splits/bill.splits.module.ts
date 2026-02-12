import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { BillSplit } from './entities/bill-split.entity';
import { BillSplitsService } from './bill-splits.service';
import { PaymentsModule } from 'src/modules/payments/payments.module';
import { BillSplitsController } from './bill-splits.controller';
import { BillsModule } from '../bills/bills.module';

@Module({
	imports: [BillsModule, PaymentsModule, TypeOrmModule.forFeature([BillSplit])],
	providers: [BillSplitsService],
	controllers: [BillSplitsController],
})
export class BillSplitsModule { }
