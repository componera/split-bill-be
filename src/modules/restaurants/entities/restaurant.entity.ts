// src/modules/restaurants/entities/restaurant.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { LightspeedToken } from '../../lightspeed/entities/lightspeed-token.entity';
import { Bill } from '../../bills/entities/bill.entity';
import { SquareLocation } from 'src/modules/square/square-location.entity';

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

	@OneToMany(() => Bill, bill => bill.restaurant)
	bills: Relation<Bill[]>;

	@Column({ nullable: true })
	selectedLocationId?: string; // keep track of selected location

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
