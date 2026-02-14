import { Module } from '@nestjs/common';
import { SocketGateway } from '../websocket/websocket.gateway';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../modules/users/users.module';

@Module({
	imports: [
		AuthModule, // ✅ provides JwtService
		UsersModule, // ✅ provides UsersService
	],
	providers: [SocketGateway, WsJwtGuard],
	exports: [SocketGateway],
})
export class WebSocketModule {}
