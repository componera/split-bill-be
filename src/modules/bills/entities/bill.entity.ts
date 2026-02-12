import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BillItem } from './bill-item.entity';

@Entity()
export class Bill {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	restaurantId: string;

	@Column()
	lightspeedSaleId: string;

	@Column({ nullable: true })
	tableNumber?: string;

	@Column()
	status: 'OPEN' | 'CLOSED';

	@Column({ nullable: true })
	qrCode?: string;

	@OneToMany(() => BillItem, item => item.bill, { cascade: true })
	items: BillItem[];

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
