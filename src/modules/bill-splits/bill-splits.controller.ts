// src/modules/bill-splits/bill-splits.controller.ts

import { Controller, Post, Param, Body } from '@nestjs/common';
import { BillsService } from '../bills/bills.service';

@Controller('bill-splits')
export class BillSplitsController {
	constructor(private billsService: BillsService) {}

	@Post(':billId/select')
	selectItems(
		@Param('billId') billId: string,
		@Body()
		body: {
			itemIds: string[];
			customerId: string;
		},
	) {
		return this.billsService.markItemsSelected(billId, body.itemIds, body.customerId);
	}

	@Post(':billId/release')
	release(
		@Param('billId') billId: string,
		@Body()
		body: {
			customerId: string;
		},
	) {
		return this.billsService.releaseSelectedItems(billId, body.customerId);
	}
}
