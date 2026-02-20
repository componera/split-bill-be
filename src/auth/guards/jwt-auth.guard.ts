import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(
		private jwtService: JwtService,
		private usersService: UsersService,
	) { }

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest();

		console.log('[JwtAuthGuard] req.cookies:', req.cookies);

		const token = req.cookies?.access_token;

		if (!token) {
			throw new UnauthorizedException("Missing token");
		}

		try {
			const payload: any = this.jwtService.verify(token);
			const user = await this.usersService.findById(payload.sub);
			req.user = user;
			return true;
		} catch {
			throw new UnauthorizedException("Invalid token");
		}
	}
}
