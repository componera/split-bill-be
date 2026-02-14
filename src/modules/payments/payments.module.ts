import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Bill } from '../bills/entities/bill.entity';
import { BillItem } from '../bills/entities/bill-item.entity';
import { UsersModule } from '../users/users.module'; // UsersService
import { JwtModule } from '@nestjs/jwt'; // JwtService
import { WebSocketModule } from '../../websocket/websocket.module'; // SocketGateway

@Module({
	imports: [
		TypeOrmModule.forFeature([Payment, Bill, BillItem]),
		UsersModule, // ✅ UsersService available
		JwtModule.register({
			secret: process.env.JWT_SECRET, // must match your AuthModule
			signOptions: { expiresIn: '1h' },
		}), // ✅ JwtService available
		WebSocketModule, // ✅ SocketGateway available
	],
	controllers: [PaymentsController],
	providers: [PaymentsService],
	exports: [PaymentsService],
})
export class PaymentsModule {}
