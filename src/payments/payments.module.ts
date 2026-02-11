import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

import { Payment } from './payment.entity';

import { SocketGateway } from '../websocket/websocket.gateway';

@Module({
	imports: [TypeOrmModule.forFeature([Payment])],
	providers: [PaymentsService, SocketGateway],
	controllers: [PaymentsController],
	exports: [PaymentsService],
})
export class PaymentsModule {}
