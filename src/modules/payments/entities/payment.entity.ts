import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, JoinColumn, ManyToOne } from 'typeorm';

import { PaymentStatus } from '../enums/payment-status.enum';
import { Bill } from 'src/modules/bills/entities/bill.entity';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';

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

	@ManyToOne(() => Bill)
	@JoinColumn({ name: 'billId' })
	bill: Bill;

	@ManyToOne(() => Restaurant)
	@JoinColumn({ name: 'restaurantId' })
	restaurant: Restaurant;


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
