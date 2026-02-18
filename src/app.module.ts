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
import { YocoController } from './modules/yoco/yoco.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { StaffModule } from './modules/staff/staff.module';
import { AuthController } from './auth/auth.controller';
import { SquareController } from './modules/square/square.controller';
import { StaffController } from './modules/staff/staff.controller';
import { RestaurantsController } from './modules/restaurants/restaurants.controller';
import { QrController } from './modules/qr/qr.controller';
import { PaymentsController } from './modules/payments/payments.controller';
import { LightspeedController } from './modules/lightspeed/lightspeed.controller';
import { LightspeedWebhookController } from './modules/lightspeed/lightspeed.webhook.controller';
import { BillsController } from './modules/bills/bills.controller';
import { BillSplitsController } from './modules/bill-splits/bill-splits.controller';
import { AdminController } from './modules/admin/admin.controller';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		TypeOrmModule.forRootAsync({
			useFactory: () => ({
				type: 'postgres',
				url: process.env.DATABASE_URL,
				ssl: { rejectUnauthorized: false },
				synchronize: process.env.NODE_ENV !== 'production',
				logging: process.env.NODE_ENV !== 'production',
				autoLoadEntities: true,
				extra: {
					max: 25,
					idleTimeoutMillis: 30_000,
					connectionTimeoutMillis: 5_000,
				},
			}),
		}),
		AdminModule,
		AuthModule,
		RestaurantsModule,
		BillsModule,
		BillSplitsModule,
		LightspeedModule,
		QrModule,
		PaymentsModule,
		ScheduleModule.forRoot(),
		StaffModule,
		UsersModule,
		WebSocketModule,
		YocoModule,
	],
	controllers: [AdminController, AppController, AuthController, BillsController, BillSplitsController, QrController, LightspeedController, LightspeedWebhookController, PaymentsController, RestaurantsController, SquareController, StaffController, YocoController],
})
export class AppModule { }
