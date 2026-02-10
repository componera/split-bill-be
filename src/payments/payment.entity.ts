import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	Index,
} from 'typeorm';

import { PaymentStatus } from './enums/payment-status.enum';

@Entity('payments')
@Index(['restaurantId'])
@Index(['billId'])
@Index(['status'])
export class Payment {

	@PrimaryGeneratedColumn('uuid')
	id: string;

	/*
	================================
	MULTI TENANT
	================================
	*/

	@Column()
	@Index()
	restaurantId: string;

	@Column()
	@Index()
	billId: string;

	/*
	================================
	AMOUNT
	================================
	*/

	@Column({
		type: 'decimal',
		precision: 10,
		scale: 2,
	})
	amount: number;

	@Column({
		default: 'ZAR',
	})
	currency: string;

	/*
	================================
	STATUS
	================================
	*/

	@Column({
		type: 'enum',
		enum: PaymentStatus,
		default: PaymentStatus.PENDING,
	})
	status: PaymentStatus;

	/*
	================================
	PROVIDER INFO
	================================
	*/

	@Column({ nullable: true })
	provider: string; // YOCO

	@Column({ nullable: true })
	providerPaymentId: string;

	@Column({ nullable: true })
	checkoutId: string;

	/*
	================================
	METADATA
	================================
	*/

	@Column({
		type: 'jsonb',
		nullable: true,
	})
	metadata: any;

	/*
	================================
	AUDIT
	================================
	*/

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
