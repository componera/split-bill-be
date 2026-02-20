// square.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SquareClient, SquareEnvironment } from "square";
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
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            });
        } else {
            const auth = this.authRepo.create({
                restaurant,
                accessToken: data.squareAccessToken,
                refreshToken: data.squareRefreshToken,
                merchantId: data.squareMerchantId,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            });
            return this.authRepo.save(auth);
        }
    }

    async saveLocations(
        restaurant: Restaurant,
        accessToken: string,
    ) {
        const res = await fetch(`${process.env.SQUARE_API_URL}/v2/locations`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            throw new Error("Failed to fetch Square locations");
        }

        const data = await res.json();
        const locations = data.locations ?? [];

        // Clear old locations first (important for reconnect flow)
        await this.locRepo.delete({ restaurant: { id: restaurant.id } });

        const entities = locations.map(loc =>
            this.locRepo.create({
                id: loc.id,
                name: loc.name,
                restaurant,
                isSelected: false,
            })
        );

        await this.locRepo.save(entities);

        return entities;
    }


    /** Fetch locations and mark the selected one */
    async getLocations(restaurantId: string) {
        let auth = await this.authRepo.findOne({
            where: { restaurant: { id: restaurantId } },
        });

        // Not connected yet
        if (!auth) {
            return [];
        }

        // Refresh token if expired
        if (auth.expiresAt && new Date() > auth.expiresAt) {
            auth = await this.refreshAccessToken(auth);
        }

        const client = new SquareClient({
            token: auth.accessToken,
            environment: process.env.SQUARE_ENV === "production"
                ? SquareEnvironment.Production
                : SquareEnvironment.Sandbox,
        });

        const response = await client.locations.list();
        const locations = response.locations ?? [];

        return locations.map(loc => ({
            id: loc.id,
            name: loc.name,
            isSelected: auth.selectedLocationId === loc.id,
        }));
    }


    /** Save the selected location */
    async selectLocation(
        restaurantId: string,
        locationId: string
    ) {
        const auth = await this.authRepo.findOne({
            where: { restaurant: { id: restaurantId } },
        });

        if (!auth) throw new Error("Square not connected");

        auth.selectedLocationId = locationId;
        await this.authRepo.save(auth);

        return {
            locationId,
        };
    }

    async refreshAccessToken(auth: SquareAuth): Promise<SquareAuth> {
        if (!auth.refreshToken) {
            throw new Error("No refresh token available");
        }

        const response = await fetch(`${process.env.SQUARE_API_URL}/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.SQUARE_APP_ID,
                client_secret: process.env.SQUARE_APP_SECRET,
                grant_type: 'refresh_token',
                refresh_token: auth.refreshToken,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to refresh Square token: ${response.statusText}`);
        }

        const data = await response.json();

        auth.accessToken = data.access_token;
        auth.refreshToken = data.refresh_token;
        auth.expiresAt = data.expires_at ? new Date(data.expires_at) : null;

        await this.authRepo.save(auth);

        return auth;
    }
}
