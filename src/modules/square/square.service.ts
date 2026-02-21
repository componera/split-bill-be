import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SquareAuth } from './entities/square.auth.entity';
import { SquareLocation } from './entities/square-location.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';

interface TokenData {
    access_token: string;
    refresh_token?: string;
    merchant_id: string;
    expires_at?: string;
}

@Injectable()
export class SquareService {
    private readonly logger = new Logger(SquareService.name);

    constructor(
        @InjectRepository(SquareAuth)
        private authRepo: Repository<SquareAuth>,

        @InjectRepository(SquareLocation)
        private locRepo: Repository<SquareLocation>,

        @InjectRepository(Restaurant)
        private restaurantRepo: Repository<Restaurant>,
    ) { }

    /**
     * Exchange Square OAuth code for tokens
     */
    async exchangeCode(code: string): Promise<TokenData> {
        this.logger.log(`Exchanging Square OAuth code for tokens`);

        const res = await fetch(`${process.env.SQUARE_API_URL}/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.SQUARE_APP_ID,
                client_secret: process.env.SQUARE_APP_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: `${process.env.FRONTEND_URL}/admin/pos`,
            }),
        });

        if (!res.ok) {
            const text = await res.text();
            this.logger.error(`Failed to exchange code: ${text}`);
            throw new Error('Failed to exchange Square OAuth code');
        }

        const data = await res.json();
        return {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            merchant_id: data.merchant_id,
            expires_at: data.expires_at,
        };
    }

    /**
     * Save locations for a restaurant
     */
    async saveLocations(restaurant: Restaurant, accessToken: string) {
        this.logger.log(`Fetching locations for restaurant ${restaurant.id}`);

        const res = await fetch(`${process.env.SQUARE_API_URL}/v2/locations`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            const text = await res.text();
            this.logger.error(`Failed to fetch locations: ${text}`);
            throw new Error('Failed to fetch Square locations');
        }

        const data = await res.json();
        const locations = data.locations ?? [];

        // Delete old locations first
        await this.locRepo.delete({ restaurant: { id: restaurant.id } });

        const entities = locations.map(loc =>
            this.locRepo.create({
                id: loc.id,
                name: loc.name,
                restaurant,
                isSelected: false,
            }),
        );

        await this.locRepo.save(entities);
        this.logger.log(`Saved ${entities.length} locations for restaurant ${restaurant.id}`);

        return entities;
    }

    /**
     * Save auth information for a restaurant
     */
    async saveAuth(data: {
        restaurantId: string;
        squareAccessToken: string;
        squareRefreshToken?: string;
        squareMerchantId: string;
        expiresAt?: string;
    }) {
        const restaurant = await this.restaurantRepo.findOne({ where: { id: data.restaurantId } });
        if (!restaurant) throw new Error('Restaurant not found');

        const existing = await this.authRepo.findOne({ where: { restaurant: { id: data.restaurantId } } });

        if (existing) {
            await this.authRepo.update(
                { restaurant: { id: data.restaurantId } },
                {
                    accessToken: data.squareAccessToken,
                    refreshToken: data.squareRefreshToken,
                    merchantId: data.squareMerchantId,
                    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
                },
            );
            this.logger.log(`Updated Square auth for restaurant ${data.restaurantId}`);
        } else {
            const auth = this.authRepo.create({
                restaurant,
                accessToken: data.squareAccessToken,
                refreshToken: data.squareRefreshToken,
                merchantId: data.squareMerchantId,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            });
            await this.authRepo.save(auth);
            this.logger.log(`Saved new Square auth for restaurant ${data.restaurantId}`);
        }
    }

    /**
     * Get all locations for a restaurant
     */
    async getLocations(restaurantId: string) {
        const auth = await this.authRepo.findOne({ where: { restaurant: { id: restaurantId } } });
        if (!auth) return [];

        const locations = await this.locRepo.find({ where: { restaurant: { id: restaurantId } } });
        return locations.map(loc => ({
            id: loc.id,
            name: loc.name,
            isSelected: loc.isSelected,
        }));
    }

    /**
     * Select a location for the restaurant
     */
    async selectLocation(restaurantId: string, locationId: string) {
        const auth = await this.authRepo.findOne({ where: { restaurant: { id: restaurantId } } });
        if (!auth) throw new Error('Square not connected');

        // Mark all locations as not selected
        await this.locRepo.update({ restaurant: { id: restaurantId } }, { isSelected: false });

        // Mark the selected location
        const selected = await this.locRepo.findOne({ where: { id: locationId, restaurant: { id: restaurantId } } });
        if (!selected) throw new Error('Location not found');

        selected.isSelected = true;
        await this.locRepo.save(selected);

        auth.selectedLocationId = locationId;
        await this.authRepo.save(auth);

        this.logger.log(`Selected location ${locationId} for restaurant ${restaurantId}`);
        return { locationId };
    }
}