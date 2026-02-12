import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';

import { BillItem } from '../entities/bill-item.entity';
import { BillStatus } from '../enums/bill-status.enum';

@Entity('bills')
@Index(['restaurantId'])
@Index(['lightspeedSaleId'])
export class Bill {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	@Index()
	restaurantId: string;

	@Column({
		nullable: true,
	})
	lightspeedSaleId: string;

	@Column({
		nullable: true,
	})
	tableName: string;

	@Column({
		type: 'enum',
		enum: BillStatus,
		default: BillStatus.OPEN,
	})
	status: BillStatus;

	@Column({
		type: 'decimal',
		precision: 10,
		scale: 2,
		default: 0,
	})
	total: number;

	@Column({
		type: 'decimal',
		precision: 10,
		scale: 2,
		default: 0,
	})
	paidTotal: number;

	@OneToMany(() => BillItem, item => item.bill, {
		cascade: true,
	})
	items: BillItem[];

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
