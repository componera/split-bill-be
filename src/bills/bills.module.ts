import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Bill } from './entities/bill.entity';
import { BillItem } from './entities/bill-item.entity';

import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
	imports: [TypeOrmModule.forFeature([Bill, BillItem]), WebsocketModule],
	providers: [BillsService],
	controllers: [BillsController],
	exports: [BillsService],
})
export class BillsModule {}
