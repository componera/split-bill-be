import { Controller, Get, Req, Post, Body } from "@nestjs/common";
import { SquareService } from "./square.service";

@Controller("square")
export class SquareController {
    constructor(private squareService: SquareService) { }

    @Post("auth")
    async saveSquareAuth(
        @Req() req,
        @Body()
        body: {
            squareAccessToken: string;
            squareRefreshToken?: string;
            squareMerchantId: string;
            expiresAt?: string;
        }
    ) {
        const restaurantId = req.user.restaurantId;

        return this.squareService.saveAuth({
            restaurantId,
            ...body,
        });
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
