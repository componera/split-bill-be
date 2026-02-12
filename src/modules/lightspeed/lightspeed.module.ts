import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { Bill } from '../bills/entities/bill.entity';
import { BillItem } from '../bills/bill-item.entity';

import { LightspeedService } from './lightspeed.service';
import { LightspeedOAuthService } from './lightspeed.oauth.service';
import { LightspeedSyncService } from './lightspeed.sync.service';
import { LightspeedController } from './lightspeed.controller';

@Module({
	imports: [TypeOrmModule.forFeature([Restaurant, Bill, BillItem])],
	providers: [LightspeedService, LightspeedOAuthService, LightspeedSyncService],
	controllers: [LightspeedController],
	exports: [LightspeedService],
})
export class LightspeedModule { }
