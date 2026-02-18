import { describe, it, expect, beforeEach, mock, spyOn, afterEach } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { YocoService } from './yoco.service';
import { Payment } from '../payments/entities/payment.entity';
import { Bill } from '../bills/entities/bill.entity';
import { BillItem } from '../bills/entities/bill-item.entity';
import { SocketGateway } from 'src/websocket/websocket.gateway';
import { LightspeedService } from '../lightspeed/lightspeed.service';
import { PaymentStatus } from '../payments/enums/payment-status.enum';

describe('YocoService', () => {
	let service: YocoService;
	let paymentRepo: any;
	let billRepo: any;
	let itemRepo: any;
	let socketGateway: any;
	let lightspeedService: any;
	const originalFetch = globalThis.fetch;

	beforeEach(async () => {
		paymentRepo = {
			findOne: mock(() => Promise.resolve(null)),
			create: mock((entity: any) => entity),
			save: mock((entity: any) => Promise.resolve({ id: 'pay-1', ...entity })),
		};
		billRepo = {
			findOne: mock(() => Promise.resolve(null)),
		};
		itemRepo = {
			find: mock(() => Promise.resolve([])),
			update: mock(() => Promise.resolve({ affected: 1 })),
		};
		socketGateway = {
			emitPaymentCompleted: mock(() => { }),
			emitBillUpdated: mock(() => { }),
		};
		lightspeedService = {
			markItemsPaid: mock(() => Promise.resolve()),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				YocoService,
				{ provide: getRepositoryToken(Payment), useValue: paymentRepo },
				{ provide: getRepositoryToken(Bill), useValue: billRepo },
				{ provide: getRepositoryToken(BillItem), useValue: itemRepo },
				{ provide: SocketGateway, useValue: socketGateway },
				{ provide: LightspeedService, useValue: lightspeedService },
			],
		}).compile();

		service = module.get<YocoService>(YocoService);
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	describe('createCheckout', () => {
		it('should create a payment and call Yoco checkout API', async () => {
			const items = [
				{ id: 'item-1', price: 100, isPaid: false, bill: { restaurantId: 'rest-1' } },
				{ id: 'item-2', price: 50, isPaid: false, bill: { restaurantId: 'rest-1' } },
			];
			itemRepo.find.mockResolvedValue(items);

			globalThis.fetch = mock(() =>
				Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ id: 'checkout-1', redirectUrl: 'https://pay.yoco.com/checkout-1' }),
				}),
			) as any;

			const result = await service.createCheckout({
				restaurantId: 'rest-1',
				billId: 'bill-1',
				itemIds: ['item-1', 'item-2'],
			});

			expect(paymentRepo.create).toHaveBeenCalledWith(
				expect.objectContaining({
					amount: 150,
					status: PaymentStatus.PENDING,
				}),
			);
			expect(globalThis.fetch).toHaveBeenCalledWith(
				'https://payments.yoco.com/api/checkouts',
				expect.objectContaining({ method: 'POST' }),
			);
			expect(result).toEqual({
				checkoutId: 'checkout-1',
				redirectUrl: 'https://pay.yoco.com/checkout-1',
			});
		});

		it('should throw if no unpaid items found', async () => {
			itemRepo.find.mockResolvedValue([]);

			expect(service.createCheckout({ restaurantId: 'rest-1', billId: 'bill-1', itemIds: ['item-1'] })).rejects.toThrow(
				BadRequestException,
			);
		});

		it('should throw if Yoco API fails', async () => {
			itemRepo.find.mockResolvedValue([{ id: 'item-1', price: 100, isPaid: false, bill: { restaurantId: 'rest-1' } }]);

			globalThis.fetch = mock(() => Promise.resolve({ ok: false, status: 500 })) as any;

			expect(service.createCheckout({ restaurantId: 'rest-1', billId: 'bill-1', itemIds: ['item-1'] })).rejects.toThrow(
				BadRequestException,
			);
		});
	});

	describe('handlePaymentSuccess', () => {
		it('should mark payment success, update items, and emit events', async () => {
			const payment = {
				id: 'pay-1',
				status: PaymentStatus.PENDING,
				metadata: { itemIds: ['item-1'] },
				bill: { id: 'bill-1' },
			};
			const bill = {
				id: 'bill-1',
				restaurantId: 'rest-1',
				lightspeedSaleId: 'ls-1',
				items: [{ id: 'item-1' }],
			};

			paymentRepo.findOne.mockResolvedValue(payment);
			billRepo.findOne.mockResolvedValue(bill);

			await service.handlePaymentSuccess('pay-1');

			expect(paymentRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: PaymentStatus.SUCCESS }));
			expect(itemRepo.update).toHaveBeenCalledWith({ id: expect.anything() }, expect.objectContaining({ isPaid: true }));
			expect(lightspeedService.markItemsPaid).toHaveBeenCalledWith('rest-1', 'ls-1', ['item-1']);
			expect(socketGateway.emitPaymentCompleted).toHaveBeenCalled();
			expect(socketGateway.emitBillUpdated).toHaveBeenCalled();
		});

		it('should return early if payment not found', async () => {
			paymentRepo.findOne.mockResolvedValue(null);

			await service.handlePaymentSuccess('unknown');

			expect(paymentRepo.save).not.toHaveBeenCalled();
		});
	});
});
