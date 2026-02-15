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
import { AdminController } from './modules/admin/admin.controller';
import { QrController } from './modules/qr/qr.controller';
import { BillSplitsController } from './modules/bill-splits/bill-splits.controller';
import { BillsController } from './modules/bills/bills.controller';
import { LightspeedController } from './modules/lightspeed/lightspeed.controller';
import { PaymentsController } from './modules/payments/payments.controller';
import { RestaurantsController } from './modules/restaurants/restaurants.controller';
import { StaffController } from './modules/staff/staff.controller';
import { YocoController } from './modules/yoco/yoco.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';

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
		AuthModule,
		RestaurantsModule,
		BillsModule,
		BillSplitsModule,
		LightspeedModule,
		YocoModule,
		QrModule,
		UsersModule,
		WebSocketModule,
	],
	controllers: [
		AppController,
		AdminController,
		BillsController,
		BillSplitsController,
		LightspeedController,
		PaymentsController,
		QrController,
		RestaurantsController,
		StaffController,
		YocoController,
	],
})
export class AppModule { }
