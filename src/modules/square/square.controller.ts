import { Controller, Get, Req, Post, Body, UseGuards } from "@nestjs/common";
import { SquareService } from "./square.service";
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { Restaurant } from "../restaurants/entities/restaurant.entity";

@Controller("square")
export class SquareController {
    constructor(private squareService: SquareService) { }

    @UseGuards(JwtAuthGuard)
    @Post('auth')
    async saveSquareAuth(
        @Req() req: FastifyRequest & { user: { restaurantId: string; restaurant: Restaurant } },
        @Body() body: {
            squareAccessToken: string;
            squareRefreshToken?: string;
            squareMerchantId: string;
            expiresAt?: string;
        }
    ) {
        // Save locations first
        const locations = await this.squareService.saveLocations(
            req.user.restaurant,
            body.squareAccessToken,
        );

        // Save auth to DB
        await this.squareService.saveAuth({
            restaurantId: req.user.restaurantId,
            ...body,
        });

        // Return plain JSON — no res.send() or passthrough to avoid dispatch errors
        return { success: true, locations };
    }

    @Get("locations")
    async getLocations(@Req() req) {
        const restaurantId = req.user.restaurantId;
        return this.squareService.getLocations(restaurantId);
    }

    @Post("select-location")
    async selectLocation(
        @Req() req,
        @Body() body: { locationId: string }
    ) {
        const restaurantId = req.user.restaurantId;

        return this.squareService.selectLocation(
            restaurantId,
            body.locationId,
        );
    }
}
