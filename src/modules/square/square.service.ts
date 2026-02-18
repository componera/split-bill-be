// square.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SquareAuth } from './entities/square.auth.entity';
import { SquareLocation } from './entities/square-location.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';

@Injectable()
export class SquareService {
    constructor(
        @InjectRepository(SquareAuth)
        private authRepo: Repository<SquareAuth>,
        @InjectRepository(SquareLocation)
        private locRepo: Repository<SquareLocation>,
        @InjectRepository(Restaurant)
        private restaurantRepo: Repository<Restaurant>
    ) { }

    async saveAuth(data: {
        restaurantId: string;
        squareAccessToken: string;
        squareRefreshToken?: string;
        squareMerchantId: string;
        expiresAt?: string;
    }) {
        const restaurant = await this.restaurantRepo.findOne({ where: { id: data.restaurantId } });
        if (!restaurant) throw new Error("Restaurant not found");

        const existing = await this.authRepo.findOne({ where: { restaurant: { id: data.restaurantId } } });

        if (existing) {
            return this.authRepo.update({ restaurant: { id: data.restaurantId } }, {
                accessToken: data.squareAccessToken,
                refreshToken: data.squareRefreshToken,
                merchantId: data.squareMerchantId,
                expiresAt: data.expiresAt,
            });
        } else {
            const auth = this.authRepo.create({
                restaurant,
                accessToken: data.squareAccessToken,
                refreshToken: data.squareRefreshToken,
                merchantId: data.squareMerchantId,
                expiresAt: data.expiresAt,
            });
            return this.authRepo.save(auth);
        }
    }


    /** Fetch locations and mark the selected one */
    async getLocations(restaurantId: string): Promise<SquareLocation[]> {
        const restaurant = await this.restaurantRepo.findOne({
            where: { id: restaurantId },
            relations: ["squareLocations"],
        });

        if (!restaurant) return [];

        return restaurant.squareLocations.map(loc => ({
            ...loc,
            isSelected: loc.id === restaurant.selectedLocationId,
        }));
    }

    /** Save the selected location */
    async selectLocation(
        restaurantId: string,
        locationId: string
    ): Promise<SquareLocation | null> {
        const restaurant = await this.restaurantRepo.findOne({
            where: { id: restaurantId },
        });
        if (!restaurant) return null;

        // Update selectedLocationId in restaurant
        restaurant.selectedLocationId = locationId;
        await this.restaurantRepo.save(restaurant);

        // Optional: mark isSelected on locations table
        await this.locRepo.update({ restaurant: { id: restaurantId } }, { isSelected: false });
        await this.locRepo.update({ id: locationId }, { isSelected: true });

        return this.locRepo.findOne({ where: { id: locationId } });
    }
}
