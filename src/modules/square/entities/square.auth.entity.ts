import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

@Entity('square_auth')
export class SquareAuth {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Restaurant)
    restaurant: Restaurant;

    @Column()
    accessToken: string;

    @Column()
    refreshToken: string;

    @Column()
    expiresAt: Date;

    @Column({ nullable: true })
    merchantId: string;

    @Column({ nullable: true })
    selectedLocationId: string;

    @Column({ nullable: true })
    selectedLocationName: string;

    @CreateDateColumn()
    createdAt: Date;
}
