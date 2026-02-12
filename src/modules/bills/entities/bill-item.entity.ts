// src/modules/bills/entities/bill-item.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { Bill } from './bill.entity';

@Entity('bill_items')
export class BillItem {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	name: string;

	@Column('decimal', { precision: 10, scale: 2 })
	price: number;

	@Column({ default: false })
	isPaid: boolean;

	@Column({ nullable: true })
	@Index()
	selectedBy?: string; // customer session id or uuid

	@Column({ type: 'timestamp', nullable: true })
	selectedAt?: Date;

	@Column({ nullable: true })
	lightspeedItemId?: string;

	@ManyToOne(() => Bill, bill => bill.items)
	bill: Bill;

	@Column()
	billId: string;
}
