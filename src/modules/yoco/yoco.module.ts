import { Module } from '@nestjs/common';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { YocoService } from './yoco.service';
import { YocoController } from './yoco.controller';
import { PaymentsModule } from 'src/modules/payments/payments.module';

@Module({
	imports: [PaymentsModule, WebsocketModule],
	providers: [YocoService],
	controllers: [YocoController],
})
export class YocoModule { }
