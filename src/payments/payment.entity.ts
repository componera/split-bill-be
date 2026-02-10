import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';

import { Bill } from '../bills/bills.entity';

@Entity()
@Index(['restaurantId', 'yocoPaymentId'], { unique: true })
export class Payment {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	@Index()
	restaurantId: string;

	@Column()
	billId: string;

	@ManyToOne(() => Bill, bill => bill.payments, {
		onDelete: 'CASCADE',
	})
	bill: Bill;

	// Yoco identifiers
	@Column({
		nullable: true,
	})
	yocoPaymentId: string;

	@Column({
		nullable: true,
	})
	yocoCheckoutId: string;

	// Amount paid
	@Column({
		type: 'decimal',
		precision: 10,
		scale: 2,
	})
	amount: number;

	// Payment status
	@Column({
		default: 'PENDING',
	})
	status: 'PENDING' | 'SUCCESS' | 'FAILED';

	// Items covered in this payment
	@Column({
		type: 'jsonb',
		nullable: true,
	})
	billItemIds: string[];

	// Audit
	@CreateDateColumn()
	createdAt: Date;

	@Column()
	externalId: string;
}
