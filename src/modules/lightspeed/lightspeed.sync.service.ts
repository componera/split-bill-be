// src/modules/lightspeed/lightspeed.sync.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';

import { LightspeedService } from './lightspeed.service';
import { Bill } from '../bills/entities/bill.entity';
import { BillItem } from '../bills/entities/bill-item.entity';
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
	) { }

	/**
	 * Upsert a Bill and its items from Lightspeed Sale
	 */
	private async upsertBillFromSale(restaurantId: string, sale: any) {
		// Load existing bill with items
		let bill = await this.bills.findOne({
			where: { restaurantId, lightspeedSaleId: sale.saleID },
			relations: ['items'],
		});

		// If bill doesn't exist, create it
		if (!bill) {
			const qrCode = await QRCode.toDataURL(`${process.env.FRONTEND_URL}/bill/${sale.saleID}`);

			bill = await this.bills.save({
				restaurantId,
				lightspeedSaleId: sale.saleID,
				tableNumber: sale.tableName,
				status: 'OPEN',
				qrCode,
			});

			// Emit bill created to restaurant and customers
			this.socketGateway.emitBillCreated(bill.restaurantId, bill);
		}

		const saleLines = sale.SaleLines || [];

		for (const line of saleLines) {
			const exists = bill.items?.find(item => item.lightspeedItemId === line.saleLineID);

			if (!exists) {
				const newItem = await this.items.save({
					billId: bill.id,
					name: line.itemName || line.label,
					price: line.price || line.unitPrice,
					quantity: line.quantity || 1,
					lightspeedItemId: line.saleLineID,
				});
				bill.items = [...(bill.items || []), newItem];
			}
		}

		return bill;
	}

	/**
	 * Sync a single sale by ID (used for webhooks)
	 */
	async syncSaleById(restaurantId: string, saleId: string) {
		const response = await this.lightspeed.request(restaurantId, 'GET', `Sale/${saleId}`);
		const sale = response.data.Sale;
		if (!sale) return;

		const bill = await this.upsertBillFromSale(restaurantId, sale);

		// Emit updated bill to all viewers
		this.socketGateway.emitBillUpdated(bill.restaurantId, bill.id, bill);

		return bill;
	}

	/**
	 * Sync all sales for a restaurant (used for cron)
	 */
	async syncSales(restaurantId: string) {
		const response = await this.lightspeed.request(restaurantId, 'GET', 'Sale');
		const sales = response.data.Sale || [];

		// Run in parallel safely
		await Promise.all(sales.map(sale => this.syncSaleById(restaurantId, sale.saleID)));

		return { synced: sales.length };
	}

	/**
	 * Convenience method to sync a new order (frontend QR creation)
	 */
	async syncOrder(restaurantId: string, saleId: string) {
		const response = await this.lightspeed.request(restaurantId, 'GET', `Sale/${saleId}`);
		const sale = response.data.Sale;
		if (!sale) return;

		const bill = await this.upsertBillFromSale(restaurantId, sale);

		// Emit created event
		this.socketGateway.emitBillCreated(bill.restaurantId, bill);

		return bill;
	}
}
