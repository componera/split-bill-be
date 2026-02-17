// src/modules/restaurants/entities/lightspeed-token.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
@Entity()
export class LightspeedToken {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	restaurantId: string;

	@ManyToOne(() => Restaurant, restaurant => restaurant.lightspeedTokens)
	@JoinColumn({ name: 'restaurantId' })
	restaurant: Relation<Restaurant>;

	@Column()
	accessToken: string;

	@Column()
	refreshToken: string;

	@Column({ type: 'timestamptz', nullable: true })
	expiresAt?: Date;

	@Column({ default: true })
	isActive: boolean;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
