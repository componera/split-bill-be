import {
    Controller,
    Get,
    Req,
    Post,
    Body,
    UseGuards,
    Logger,
    InternalServerErrorException,
    UnauthorizedException,
} from "@nestjs/common";
import { SquareService } from "./square.service";
import { FastifyRequest } from "fastify";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { Restaurant } from "../restaurants/entities/restaurant.entity";

@Controller("square")
@UseGuards(JwtAuthGuard) // Apply guard to entire controller
export class SquareController {
    private readonly logger = new Logger(SquareController.name);

    constructor(private squareService: SquareService) { }

    // =========================================
    // SAVE AUTH + LOCATIONS
    // =========================================
    @Post("auth")
    async saveSquareAuth(
        @Req()
        req: FastifyRequest & {
            user?: { restaurantId: string; restaurant: Restaurant };
        },
        @Body()
        body: {
            squareAccessToken: string;
            squareRefreshToken?: string;
            squareMerchantId: string;
            expiresAt?: string;
        }
    ) {
        this.logger.log("Square auth request received");

        if (!req.user?.restaurantId || !req.user?.restaurant) {
            this.logger.error("Missing user context in request");
            throw new UnauthorizedException("Invalid user context");
        }

        try {
            this.logger.debug(
                `Saving Square locations for restaurant ${req.user.restaurantId}`
            );

            const locations = await this.squareService.saveLocations(
                req.user.restaurant,
                body.squareAccessToken
            );

            this.logger.debug(`Saved ${locations.length} locations`);

            await this.squareService.saveAuth({
                restaurantId: req.user.restaurantId,
                ...body,
            });

            this.logger.log("Square auth saved successfully");

            return { success: true, locations };
        } catch (error: any) {
            this.logger.error(
                `Failed to save Square auth: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException(
                "Failed to save Square authentication"
            );
        }
    }

    // =========================================
    // GET LOCATIONS
    // =========================================
    @Get("locations")
    async getLocations(
        @Req() req: FastifyRequest & { user?: { restaurantId: string } }
    ) {
        if (!req.user?.restaurantId) {
            throw new UnauthorizedException("Missing restaurant context");
        }

        this.logger.debug(
            `Fetching Square locations for restaurant ${req.user.restaurantId}`
        );

        try {
            return await this.squareService.getLocations(
                req.user.restaurantId
            );
        } catch (error: any) {
            this.logger.error(
                `Failed to fetch locations: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException(
                "Failed to fetch Square locations"
            );
        }
    }

    // =========================================
    // SELECT LOCATION
    // =========================================
    @Post("select-location")
    async selectLocation(
        @Req() req: FastifyRequest & { user?: { restaurantId: string } },
        @Body() body: { locationId: string }
    ) {
        if (!req.user?.restaurantId) {
            throw new UnauthorizedException("Missing restaurant context");
        }

        this.logger.debug(
            `Selecting location ${body.locationId} for restaurant ${req.user.restaurantId}`
        );

        try {
            return await this.squareService.selectLocation(
                req.user.restaurantId,
                body.locationId
            );
        } catch (error: any) {
            this.logger.error(
                `Failed to select location: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException(
                "Failed to select Square location"
            );
        }
    }
}