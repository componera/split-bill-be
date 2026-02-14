import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';
import { Bill } from './entities/bill.entity';
import { BillItem } from './entities/bill-item.entity';
import { WebSocketModule } from '../../websocket/websocket.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Bill, BillItem]),
		WebSocketModule, // ✅ This makes SocketGateway injectable
		AuthModule, // ✅ This makes AuthService injectable
		UsersModule, // ✅ now UsersService is available
	],
	controllers: [BillsController],
	providers: [BillsService],
	exports: [BillsService],
})
export class BillsModule {}
