import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillSplit } from './bill-split.entity';

@Injectable()
export class BillSplitsService {
	constructor(
		@InjectRepository(BillSplit)
		private splitRepo: Repository<BillSplit>,
	) {}

	async createSplit(data) {
		return this.splitRepo.save(data);
	}

	async markPaid(splitId: string, paymentId: string) {
		await this.splitRepo.update(splitId, {
			status: 'PAID',
			paymentId,
		});
	}
}
