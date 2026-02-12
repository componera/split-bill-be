import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Restaurant {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	name: string;

	@Column()
	email: string;

	@Column()
	password: string;

	@Column({ nullable: true })
	lightspeedAccountId: string;

	@Column({ nullable: true })
	yocoSecretKey: string;

	@Column({ nullable: true })
	refreshToken?: string;

}
