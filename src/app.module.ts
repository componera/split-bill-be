import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WebSocketModule } from './websocket/websocket.module';
import { LightspeedModule } from './modules/lightspeed/lightspeed.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { BillsModule } from './modules/bills/bills.module';
import { BillSplitsModule } from './modules/bill-splits/bill.splits.module';
import { QrModule } from './modules/qr/qr.module';
import { YocoModule } from './modules/yoco/yoco.module';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		TypeOrmModule.forRootAsync({
			useFactory: () => {
				const isProduction = process.env.NODE_ENV === 'production';

				return {
					type: 'postgres',
					url: process.env.DATABASE_URL,
					ssl: isProduction ? { rejectUnauthorized: false } : false,
					synchronize: true,
					logging: true,
					autoLoadEntities: true,
				};
			},
		}),
		ScheduleModule.forRoot(),
		RestaurantsModule,
		BillsModule,
		BillSplitsModule,
		LightspeedModule,
		YocoModule,
		QrModule,
		WebSocketModule,
	],
	controllers: [AppController],
})
export class AppModule { }