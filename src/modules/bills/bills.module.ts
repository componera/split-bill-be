import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';

import { Bill } from './entities/bill.entity';
import { BillItem } from './entities/bill-item.entity';

import { SocketGateway } from '../../websocket/websocket.gateway';

@Module({
	imports: [TypeOrmModule.forFeature([Bill, BillItem])],
	providers: [BillsService, SocketGateway],
	controllers: [BillsController],
	exports: [BillsService],
})
export class BillsModule {}
