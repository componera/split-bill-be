import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class YocoToken {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	restaurantId: string;

	@Column()
	secretKey: string;

	@Column({ nullable: true })
	webhookSecret: string;
}
