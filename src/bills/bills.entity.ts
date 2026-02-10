import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

import { BillItem } from './bill-item.entity';
import { Payment } from '../payments/payment.entity';

@Entity()
@Index(['restaurantId', 'lightspeedSaleId'], { unique: true })
export class Bill {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	// Multi-tenant isolation
	@Column()
	@Index()
	restaurantId: string;

	// Lightspeed identifiers
	@Column({ nullable: true })
	lightspeedSaleId: string;

	@Column({ nullable: true })
	lightspeedTableId: string;

	@Column({ nullable: true })
	lightspeedAccountId: string;

	// Table info
	@Column({ nullable: true })
	tableNumber: string;

	// QR code for customers
	@Column({
		nullable: true,
		type: 'text',
	})
	qrCode: string;

	// Bill totals
	@Column({
		type: 'decimal',
		precision: 10,
		scale: 2,
		default: 0,
	})
	totalAmount: number;

	@Column({
		type: 'decimal',
		precision: 10,
		scale: 2,
		default: 0,
	})
	paidAmount: number;

	@Column({
		type: 'decimal',
		precision: 10,
		scale: 2,
		default: 0,
	})
	remainingAmount: number;

	// Status
	@Column({
		default: 'OPEN',
	})
	status: 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'CLOSED';

	// Relations
	@OneToMany(() => BillItem, item => item.bill)
	items: BillItem[];

	@OneToMany(() => Payment, payment => payment.bill)
	payments: Payment[];

	// Audit
	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
