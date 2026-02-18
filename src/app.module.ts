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
	controllers: [AppController, AuthController, YocoController],
})
export class AppModule {}
