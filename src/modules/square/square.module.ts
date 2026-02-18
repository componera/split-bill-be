import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SquareService } from "./square.service";
import { SquareController } from "./square.controller";
import { SquareAuth } from "./square.auth.entity";
import { SquareLocation } from "./square-location.entity";
import { Restaurant } from "../restaurants/entities/restaurant.entity";

@Module({
    imports: [TypeOrmModule.forFeature([SquareAuth, SquareLocation, Restaurant])],
    providers: [SquareService],
    controllers: [SquareController],
    exports: [SquareService],
})
export class SquareModule { }
