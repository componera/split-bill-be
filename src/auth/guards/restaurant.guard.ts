import {
	CanActivate,
	ExecutionContext,
	Injectable,
	ForbiddenException,
	UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class RestaurantGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<any>();

		if (!request.user) {
			throw new UnauthorizedException('User not authenticated');
		}

		const userRestaurantId = request.user.restaurantId;

		if (!userRestaurantId) {
			throw new ForbiddenException('User has no restaurant assigned');
		}

		// Safely read params/body (they may be undefined)
		const paramRestaurantId =
			request?.params?.restaurantId ??
			request?.body?.restaurantId ??
			request?.query?.restaurantId;

		// If route explicitly includes a restaurantId, validate it
		if (paramRestaurantId && paramRestaurantId !== userRestaurantId) {
			throw new ForbiddenException('Access denied to another restaurant');
		}

		return true;
	}
}