import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";

@Injectable()
export class RolesGuard implements CanActivate {
    canActivate(context: ExecutionContext) {
        const roles = this.reflector.get<string[]>(
            'roles',
            context.getHandler(),
        );

        if (!roles) return true;

        const req = context.switchToHttp().getRequest();

        return roles.includes(req.user.role);
    }
}
