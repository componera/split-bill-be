import { Injectable } from '@nestjs/common';
import { LightspeedService } from './lightspeed.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill } from '../bills/bills.entity';
import { BillItem } from '../bills/bill-item.entity';
import * as QRCode from 'qrcode';
import { SocketGateway } from 'src/websocket/websocket.gateway';

@Injectable()
export class LightspeedSyncService {
	constructor(
		private lightspeed: LightspeedService,

		@InjectRepository(Bill)
		private bills: Repository<Bill>,

		@InjectRepository(BillItem)
		private items: Repository<BillItem>,

		private socketGateway: SocketGateway,
	) {}

	async syncOrder(restaurantId: string, saleId: string) {
		const response = await this.lightspeed.request(restaurantId, 'GET', `Sale/${saleId}`);

		const sale = response.data.Sale;

		let bill = await this.bills.findOne({
			where: {
				lightspeedSaleId: sale.saleID,
			},
		});

		if (!bill) {
			const qrCode = await QRCode.toDataURL(`${process.env.FRONTEND_URL}/bill/${sale.saleID}`);

			bill = await this.bills.save({
				restaurantId,
				lightspeedSaleId: sale.saleID,
				tableNumber: sale.tableName,
				status: 'OPEN',
				qrCode,
			});
		}

		this.socketGateway.emitBillCreated(bill.restaurantId, bill);

		for (const line of sale.SaleLines) {
			const exists = await this.items.findOne({
				where: {
					lightspeedItemId: line.saleLineID,
				},
			});

			if (!exists) {
				await this.items.save({
					billId: bill.id,
					name: line.itemName,
					price: line.price,
					quantity: line.quantity,
					lightspeedItemId: line.saleLineID,
				});
			}
		}

		return bill;
	}

	/**
	 * BULK SYNC
	 * Used by CRON
	 */
	async syncSales(restaurantId: string) {
		const response = await this.lightspeed.request(restaurantId, 'GET', 'Sale');

		const sales = response.data.Sale || [];

		for (const sale of sales) {
			await this.syncSaleById(restaurantId, sale.saleID);
		}

		return {
			synced: sales.length,
		};
	}

	/**
	 * SINGLE SALE SYNC
	 * Used by webhook
	 */
	async syncSaleById(restaurantId: string, saleId: string) {
		const response = await this.lightspeed.request(restaurantId, 'GET', `Sale/${saleId}`);

		const sale = response.data.Sale;

		if (!sale) return;

		let bill = await this.bills.findOne({
			where: {
				restaurantId,
				lightspeedSaleId: sale.saleID,
			},
		});

		if (!bill) {
			bill = await this.bills.save({
				restaurantId,
				lightspeedSaleId: sale.saleID,
				status: 'OPEN',
			});
		}

		const saleLines = sale.SaleLines || [];

		for (const line of saleLines) {
			const exists = await this.items.findOne({
				where: {
					lightspeedItemId: line.saleLineID,
				},
			});

			if (!exists) {
				await this.items.save({
					billId: bill.id,
					name: line.label,
					price: line.unitPrice,
					lightspeedItemId: line.saleLineID,
				});
			}
		}

		return bill;
	}
}
