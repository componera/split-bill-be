import { describe, it, expect } from 'bun:test';
import { ForbiddenException } from '@nestjs/common';
import { RestaurantGuard } from './restaurant.guard';

describe('RestaurantGuard', () => {
	const guard = new RestaurantGuard();

	const createMockContext = (userRestaurantId: string, paramRestaurantId?: string, bodyRestaurantId?: string) => {
		const request = {
			user: { restaurantId: userRestaurantId },
			params: { restaurantId: paramRestaurantId },
			body: { restaurantId: bodyRestaurantId },
		};
		return {
			switchToHttp: () => ({
				getRequest: () => request,
			}),
		} as any;
	};

	it('should allow when no restaurantId in params or body', () => {
		const context = createMockContext('rest-1', undefined, undefined);

		expect(guard.canActivate(context)).toBe(true);
	});

	it('should allow when param restaurantId matches user', () => {
		const context = createMockContext('rest-1', 'rest-1');

		expect(guard.canActivate(context)).toBe(true);
	});

	it('should allow when body restaurantId matches user', () => {
		const context = createMockContext('rest-1', undefined, 'rest-1');

		expect(guard.canActivate(context)).toBe(true);
	});

	it('should throw ForbiddenException when param restaurantId does not match', () => {
		const context = createMockContext('rest-1', 'rest-2');

		expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
	});

	it('should throw ForbiddenException when body restaurantId does not match', () => {
		const context = createMockContext('rest-1', undefined, 'rest-2');

		expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
	});
});
