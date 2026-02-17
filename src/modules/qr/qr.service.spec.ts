import { describe, it, expect, beforeEach } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { QrService } from './qr.service';

describe('QrService', () => {
	let service: QrService;

	beforeEach(async () => {
		process.env.FRONTEND_URL = 'https://app.example.com';

		const module: TestingModule = await Test.createTestingModule({
			providers: [QrService],
		}).compile();

		service = module.get<QrService>(QrService);
	});

	describe('generateBillQr', () => {
		it('should return a url and base64 QR code data URI', async () => {
			const result = await service.generateBillQr('rest-1', 'bill-1');

			expect(result).toHaveProperty('url');
			expect(result).toHaveProperty('qr');
			expect(result.url).toBe('https://app.example.com/restaurant/rest-1/bill/bill-1');
			expect(result.qr).toContain('data:image/png;base64,');
		});
	});
});
