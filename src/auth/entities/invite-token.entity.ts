import { UserRole } from 'src/modules/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class InviteToken {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	email: string;

	@Column()
	restaurantId: string;

	@Column()
	role: UserRole;

	@Column({ unique: true })
	token: string;

	@Column()
	expiresAt: Date;

	@CreateDateColumn()
	createdAt: Date;
}
