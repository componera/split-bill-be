import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SquareService } from './square.service';

@Controller('square')
export class SquareController {
    constructor(private readonly squareService: SquareService) { }

    /**
     * Complete Square OAuth exchange, save auth and locations,
     * return the list of locations for the frontend to display.
     */
    @UseGuards(JwtAuthGuard)
    @Post('exchange')
    async exchangeCode(
        @Req() req: any & { user: { restaurantId: string; restaurant: any } },
        @Body() body: { code: string },
    ) {
        if (!body.code) throw new Error('Missing Square OAuth code');

        const { restaurant, restaurantId } = req.user;

        // Exchange code for access token + refresh token
        const tokenData = await this.squareService.exchangeCode(body.code);

        // Save locations to DB
        const locations = await this.squareService.saveLocations(restaurant, tokenData.access_token);

        // Save auth info to DB
        await this.squareService.saveAuth({
            restaurantId,
            squareAccessToken: tokenData.access_token,
            squareRefreshToken: tokenData.refresh_token,
            squareMerchantId: tokenData.merchant_id,
            expiresAt: tokenData.expires_at,
        });

        return { success: true, locations };
    }

    /**
     * Get all locations for the authenticated restaurant,
     * marking the selected location if any.
     */
    @UseGuards(JwtAuthGuard)
    @Get('locations')
    async getLocations(@Req() req: any & { user: { restaurantId: string } }) {
        const restaurantId = req.user.restaurantId;
        return this.squareService.getLocations(restaurantId);
    }

    /**
     * Mark a specific location as selected for the restaurant.
     */
    @UseGuards(JwtAuthGuard)
    @Post('select-location')
    async selectLocation(
        @Req() req: any & { user: { restaurantId: string } },
        @Body() body: { locationId: string },
    ) {
        const restaurantId = req.user.restaurantId;
        if (!body.locationId) throw new Error('Missing locationId');
        return this.squareService.selectLocation(restaurantId, body.locationId);
    }
}