import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

import { Restaurant } from '../../restaurants/entities/restaurant.entity';

export enum UserRole {
	OWNER = 'owner',
	ADMIN = 'admin',
	STAFF = 'staff',
}

@Entity('users')
export class User {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	firstName: string;

	@Column()
	lastName: string;

	@Column({ unique: true })
	email: string;

	@Column({ default: false })
	emailVerified: boolean;

	@Column()
	password: string;

	@Column({
		type: 'enum',
		enum: UserRole,
		default: UserRole.STAFF,
	})
	role: UserRole;

	@Column({ nullable: true })
	refreshToken?: string;

	@ManyToOne(() => Restaurant)
	@JoinColumn({ name: 'restaurantId' })
	restaurant: Restaurant;

	@Column()
	restaurantId: string;

	@Column({ default: true })
	isActive: boolean;

	@Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
	createdAt: Date;
}
