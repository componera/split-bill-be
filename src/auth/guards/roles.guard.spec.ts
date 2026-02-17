import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
	let guard: RolesGuard;
	let reflector: any;

	const createMockContext = (userRole: string): ExecutionContext => {
		const request = { user: { role: userRole } };
		return {
			switchToHttp: () => ({
				getRequest: () => request,
			}),
			getHandler: () => ({}),
			getClass: () => ({}),
		} as any;
	};

	beforeEach(() => {
		reflector = { get: mock(() => null) };
		guard = new RolesGuard(reflector);
	});

	it('should allow access when no roles are defined', () => {
		reflector.get.mockReturnValue(null);
		const context = createMockContext('staff');

		expect(guard.canActivate(context)).toBe(true);
	});

	it('should allow access when user role matches required roles', () => {
		reflector.get.mockReturnValue(['admin', 'owner']);
		const context = createMockContext('admin');

		expect(guard.canActivate(context)).toBe(true);
	});

	it('should deny access when user role does not match', () => {
		reflector.get.mockReturnValue(['admin', 'owner']);
		const context = createMockContext('staff');

		expect(guard.canActivate(context)).toBe(false);
	});

	it('should allow access with exact role match', () => {
		reflector.get.mockReturnValue(['owner']);
		const context = createMockContext('owner');

		expect(guard.canActivate(context)).toBe(true);
	});
});
