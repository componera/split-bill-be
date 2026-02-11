import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WebsocketModule } from './websocket/websocket.module';
import { LightspeedModule } from './lightspeed/lightspeed.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { BillsModule } from './bills/bills.module';
import { BillSplitsModule } from './bill-splits/bill.splits.module';
import { QrModule } from './qr/qr.module';
import { YocoModule } from './yoco/yoco.module';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'postgres',
			url: process.env.DATABASE_URL,
			autoLoadEntities: true,
			synchronize: true,
		}),
		ScheduleModule.forRoot(),

		RestaurantsModule,
		BillsModule,
		BillSplitsModule,
		LightspeedModule,
		YocoModule,
		QrModule,
		WebsocketModule,
	],
})
export class AppModule {}
