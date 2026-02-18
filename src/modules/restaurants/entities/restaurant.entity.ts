// src/modules/restaurants/entities/restaurant.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { LightspeedToken } from '../../lightspeed/entities/lightspeed-token.entity';
import { Bill } from '../../bills/entities/bill.entity';

@Entity()
export class Restaurant {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	name: string;

	@Column({ nullable: true })
	email?: string;

	@Column({ nullable: true })
	location?: string;

	@Column({ nullable: true })
	ownerName?: string;

	@Column({ nullable: true })
	lightspeedAccountId?: string;

	@OneToMany(() => LightspeedToken, token => token.restaurant)
	lightspeedTokens: Relation<LightspeedToken[]>;

	@Column({ nullable: true })
	yocoSecretKey?: string;

	@Column({ nullable: true })
	squareAccessToken: string;

	@Column({ nullable: true })
	squareMerchantId: string;

	@Column({ nullable: true })
	squareRefreshToken: string;

	@OneToMany(() => Bill, bill => bill.restaurant)
	bills: Relation<Bill[]>;

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
