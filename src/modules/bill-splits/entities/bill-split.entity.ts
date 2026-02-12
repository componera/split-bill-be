import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class BillSplit {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	billId: string;

	@Column()
	restaurantId: string;

	@Column('decimal')
	amount: number;

	@Column()
	status: 'PENDING' | 'PAID';

	@Column({ nullable: true })
	paymentId: string;
}
