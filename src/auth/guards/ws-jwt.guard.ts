// src/auth/guards/ws-jwt.guard.ts
import { CanActivate, Injectable, UnauthorizedException } from '@nestjs/common';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		private usersService: UsersService,
	) {}

	async canActivate(context: any): Promise<boolean> {
		const client = context.switchToWs().getClient() as Socket; // type: Socket
		const token = client.handshake.auth.token;

		if (!token) throw new UnauthorizedException('Missing WS token');

		try {
			const payload: any = this.jwtService.verify(token);
			const user = await this.usersService.findById(payload.sub);
			client.data.user = user; // attach user to client
			return true;
		} catch {
			throw new UnauthorizedException('Invalid WS token');
		}
	}
}
