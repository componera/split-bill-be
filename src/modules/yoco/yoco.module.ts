import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { YocoService } from './yoco.service';

import { Payment } from '../payments/entities/payment.entity';
import { Bill } from '../bills/entities/bill.entity';
import { BillItem } from '../bills/entities/bill-item.entity';

import { WebSocketModule } from '../../websocket/websocket.module';
import { LightspeedModule } from '../lightspeed/lightspeed.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Payment,   // ✅ REQUIRED
			Bill,
			BillItem,
		]),
		WebSocketModule,  // for SocketGateway
		LightspeedModule, // for LightspeedService
	],
	providers: [YocoService],
	exports: [YocoService],
})
export class YocoModule { }
