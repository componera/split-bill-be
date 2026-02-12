import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class RestaurantGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();

		const userRestaurantId = request.user.restaurantId;

		const paramRestaurantId = request.params.restaurantId || request.body.restaurantId;

		if (paramRestaurantId && paramRestaurantId !== userRestaurantId) {
			throw new ForbiddenException('Access denied to another restaurant');
		}

		return true;
	}
}
