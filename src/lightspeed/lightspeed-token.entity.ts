import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
export class LightspeedToken {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Index()
	@Column()
	restaurantId: string;

	@Column()
	accessToken: string;

	@Column()
	refreshToken: string;

	@Column()
	expiresAt: Date;

	@Column({ nullable: true })
	accountId: string;

	@Column({ nullable: true })
	createdAt: Date;

	@Column({ nullable: true })
	updatedAt: Date;

	@Column({ default: true })
	isActive: boolean;

	@Column({ nullable: true })
	lastSyncAt: Date;
}
