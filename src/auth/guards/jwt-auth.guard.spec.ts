import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from 'src/modules/users/users.service';

describe('JwtAuthGuard', () => {
	let guard: JwtAuthGuard;
	let jwtService: any;
	let usersService: any;

	const mockUser = { id: 'user-1', email: 'test@test.com', restaurantId: 'rest-1', role: 'admin' };

	const createMockContext = (authHeader?: string): ExecutionContext => {
		const request = { headers: { authorization: authHeader }, user: null };
		return {
			switchToHttp: () => ({
				getRequest: () => request,
				getResponse: () => ({}),
				getNext: () => ({}),
			}),
			getHandler: () => ({}),
			getClass: () => ({}),
			getArgs: () => [],
			getArgByIndex: () => ({}),
			switchToRpc: () => ({} as any),
			switchToWs: () => ({} as any),
			getType: () => 'http' as any,
		} as ExecutionContext;
	};

	beforeEach(async () => {
		jwtService = {
			verify: mock(() => ({ sub: 'user-1' })),
		};
		usersService = {
			findById: mock(() => Promise.resolve(mockUser)),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				JwtAuthGuard,
				{ provide: JwtService, useValue: jwtService },
				{ provide: UsersService, useValue: usersService },
			],
		}).compile();

		guard = module.get<JwtAuthGuard>(JwtAuthGuard);
	});

	it('should allow access with a valid Bearer token', async () => {
		const context = createMockContext('Bearer valid-token');

		const result = await guard.canActivate(context);

		expect(result).toBe(true);
		expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
		expect(usersService.findById).toHaveBeenCalledWith('user-1');
	});

	it('should attach user to request', async () => {
		const context = createMockContext('Bearer valid-token');

		await guard.canActivate(context);

		const req = context.switchToHttp().getRequest();
		expect(req.user).toEqual(mockUser);
	});

	it('should throw UnauthorizedException when no auth header', async () => {
		const context = createMockContext(undefined);

		expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
	});

	it('should throw UnauthorizedException when header is not Bearer', async () => {
		const context = createMockContext('Basic some-token');

		expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
	});

	it('should throw UnauthorizedException when token is invalid', async () => {
		jwtService.verify.mockImplementation(() => {
			throw new Error('invalid token');
		});
		const context = createMockContext('Bearer invalid-token');

		expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
	});
});
