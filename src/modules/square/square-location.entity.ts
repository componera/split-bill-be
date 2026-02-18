import { Entity, PrimaryColumn, Column, ManyToOne } from "typeorm";
import { Restaurant } from "../restaurants/entities/restaurant.entity";

@Entity()
export class SquareLocation {
    @PrimaryColumn()
    id: string;

    @Column()
    name: string;

    @ManyToOne(() => Restaurant, r => r.squareLocations)
    restaurant: Restaurant;

    @Column({ default: false })
    isSelected: boolean;
}
