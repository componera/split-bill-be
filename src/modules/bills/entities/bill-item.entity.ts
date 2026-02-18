import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Bill } from './bill.entity';
import { Payment } from '../../payments/entities/payment.entity';

@Entity()
export class BillItem {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	name: string;

	@Column({ default: 1 })
	quantity: number;

	@Column('decimal', { precision: 10, scale: 2 })
	price: number;

	@Column({ default: false })
	isPaid: boolean;

	@Column({ type: 'timestamp', nullable: true })
	paidAt?: Date;

	@Column({ nullable: true })
	@Index()
	selectedBy?: string; // customer session id or uuid

	@Column({ type: 'timestamp', nullable: true })
	selectedAt?: Date;

	@Column({ nullable: true })
	lightspeedItemId?: string;

	// inside BillItem entity
	@ManyToOne(() => Payment)
	@JoinColumn({ name: 'paymentId' })
	payment?: Relation<Payment>;

	@Column({ type: 'uuid', nullable: true })
	paymentId?: string;

	@ManyToOne(() => Bill, bill => bill.items)
	bill: Relation<Bill>;

	@Column()
	billId: string;
}
