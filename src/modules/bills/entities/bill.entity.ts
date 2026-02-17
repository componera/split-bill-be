// src/modules/bills/entities/bill.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { BillItem } from './bill-item.entity';

@Entity()
export class Bill {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	restaurantId: string;

	@ManyToOne(() => Restaurant, restaurant => restaurant.bills)
	restaurant: Relation<Restaurant>;

	@Column({ nullable: true })
	lightspeedSaleId?: string;

	@Column({ nullable: true })
	tableNumber?: string;

	@Column({ default: 'OPEN' })
	status: 'OPEN' | 'CLOSED' | 'PAID';

	@Column({ nullable: true })
	qrCode?: string;

	@OneToMany(() => BillItem, item => item.bill, { cascade: true })
	items: Relation<BillItem[]>;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
