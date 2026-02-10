import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Restaurant } from '../restaurants/restaurants.entity';
import { Bill } from '../bills/bills.entity';
import { BillItem } from '../bills/bill-item.entity';

import { LightspeedService } from './lightspeed.service';
import { LightspeedClient } from './lightspeed.client';
import { LightspeedOAuthService } from './lightspeed.oauth.service';
import { LightspeedSyncService } from './lightspeed.sync.service';
import { LightspeedController } from './lightspeed.controller';

@Module({
	imports: [TypeOrmModule.forFeature([Restaurant, Bill, BillItem])],
	providers: [LightspeedService, LightspeedClient, LightspeedOAuthService, LightspeedSyncService],
	controllers: [LightspeedController],
	exports: [LightspeedService],
})
export class LightspeedModule {}
