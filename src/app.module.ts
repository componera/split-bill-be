import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WebsocketModule } from './websocket/websocket.module';
import { LightspeedModule } from './modules/lightspeed/lightspeed.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { BillsModule } from './modules/bills/bills.module';
import { BillSplitsModule } from './modules/bill-splits/bill.splits.module';
import { QrModule } from './modules/qr/qr.module';
import { YocoModule } from './modules/yoco/yoco.module';

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
export class AppModule { }
