import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const roles = this.reflector.get<string[]>('roles', context.getHandler()); // now works

		if (!roles) {
			return true; // no roles defined, allow access
		}

		const request = context.switchToHttp().getRequest();
		const user = request.user;

		return roles.includes(user.role);
	}
}
