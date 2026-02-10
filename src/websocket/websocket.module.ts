import { Module } from '@nestjs/common';
import { SocketGateway } from './websocket.gateway';

@Module({
	providers: [SocketGateway],
	exports: [SocketGateway],
})
export class WebsocketModule {}
