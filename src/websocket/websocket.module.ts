import { Module } from '@nestjs/common';
import { SocketGateway } from './websocket.gateway';
import { BunWebSocketRoomManager } from './bun-ws.room-manager';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../modules/users/users.module';

@Module({
	imports: [AuthModule, UsersModule],
	providers: [BunWebSocketRoomManager, SocketGateway],
	exports: [SocketGateway],
})
export class WebSocketModule { }
