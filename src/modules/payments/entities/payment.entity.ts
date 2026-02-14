import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PaymentStatus } from '../enums/payment-status.enum';
import { Bill } from 'src/modules/bills/entities/bill.entity';
import { Restaurant } from 'src/modules/restaurants/entities/restaurant.entity';

@Entity('payments')
@Index(['bill']) // use relation property
@Index(['restaurant']) // use relation property
@Index(['status'])
export class Payment {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => Bill)
	@JoinColumn({ name: 'billId' })
	bill: Bill;

	@ManyToOne(() => Restaurant)
	@JoinColumn({ name: 'restaurantId' })
	restaurant: Restaurant;

	@Column({
		type: 'decimal',
		precision: 10,
		scale: 2,
	})
	amount: number;

	@Column({ default: 'ZAR' })
	currency: string;

	@Column({
		type: 'enum',
		enum: PaymentStatus,
		default: PaymentStatus.PENDING,
	})
	status: PaymentStatus;

	@Column({ nullable: true })
	provider: string;

	@Column({ nullable: true })
	providerPaymentId: string;

	@Column({ nullable: true })
	checkoutId: string;

	@Column({ type: 'jsonb', nullable: true })
	metadata: any;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
