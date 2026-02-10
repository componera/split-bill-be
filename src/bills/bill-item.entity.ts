import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { Bill } from './bills.entity';

@Entity('bill_items')
@Index(['restaurantId'])
@Index(['billId'])
@Index(['lightspeedItemId'])
export class BillItem {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	/*
	============================================
	RELATIONS
	============================================
	*/

	@Column()
	billId: string;

	@ManyToOne(() => Bill, bill => bill.items, {
		onDelete: 'CASCADE',
	})
	bill: Bill;

	/*
	============================================
	MULTI-TENANT
	============================================
	*/

	@Column()
	@Index()
	restaurantId: string;

	/*
	============================================
	LIGHTSPEED MAPPING
	============================================
	*/

	@Column({ nullable: true })
	@Index()
	lightspeedItemId: string;

	@Column({ nullable: true })
	lightspeedSaleId: string;

	@Column({ nullable: true })
	lightspeedProductId: string;

	/*
	============================================
	ITEM DETAILS
	============================================
	*/

	@Column()
	name: string;

	@Column('decimal', {
		precision: 10,
		scale: 2,
	})
	price: number;

	@Column({
		type: 'int',
		default: 1,
	})
	quantity: number;

	@Column('decimal', {
		precision: 10,
		scale: 2,
		default: 0,
	})
	total: number;

	/*
	============================================
	PAYMENT STATE
	============================================
	*/

	@Column({
		default: false,
	})
	paid: boolean;

	@Column({
		type: 'timestamp',
		nullable: true,
	})
	paidAt: Date;

	@Column({
		nullable: true,
	})
	paymentId: string;

	/*
	============================================
	SPLIT TRACKING
	============================================
	*/

	@Column({
		default: false,
	})
	isSplit: boolean;

	@Column({
		nullable: true,
	})
	splitId: string;

	/*
	============================================
	STATUS
	============================================
	*/

	@Column({
		default: 'OPEN',
	})
	status: 'OPEN' | 'PAID' | 'VOID';

	/*
	============================================
	AUDIT
	============================================
	*/

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
