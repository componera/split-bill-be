import { describe, it, expect, beforeEach } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
	let controller: AppController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AppController],
		}).compile();

		controller = module.get<AppController>(AppController);
	});

	describe('root', () => {
		it('should return status ok with service info', () => {
			const result = controller.root();

			expect(result).toHaveProperty('status', 'ok');
			expect(result).toHaveProperty('service', 'Split Bill API');
			expect(result).toHaveProperty('uptime');
			expect(result).toHaveProperty('timestamp');
			expect(result.timestamp).toBeInstanceOf(Date);
		});
	});

	describe('health', () => {
		it('should return OK', () => {
			expect(controller.health()).toBe('OK');
		});
	});
});
