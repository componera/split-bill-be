import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Bill } from '../bills/entities/bill.entity';
import { BillItem } from '../bills/entities/bill-item.entity';

import { LightspeedService } from './lightspeed.service';
import { LightspeedOAuthService } from './lightspeed.oauth.service';
import { LightspeedSyncService } from './lightspeed.sync.service';
import { LightspeedController } from './lightspeed.controller';

import { WebSocketModule } from '../../websocket/websocket.module';
import { LightspeedToken } from './entities/lightspeed-token.entity';
import { Payment } from '../payments/entities/payment.entity';

@Module({
	imports: [TypeOrmModule.forFeature([LightspeedToken, Payment, Restaurant, Bill, BillItem]), WebSocketModule],
	providers: [LightspeedService, LightspeedOAuthService, LightspeedSyncService],
	controllers: [LightspeedController],
	exports: [LightspeedService, LightspeedOAuthService, LightspeedSyncService],
})
export class LightspeedModule { }
