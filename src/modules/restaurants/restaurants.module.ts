import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { Bill } from '../bills/entities/bill.entity';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsService } from './restaurants.service';

@Module({
	imports: [TypeOrmModule.forFeature([Restaurant])],
	controllers: [RestaurantsController],
	providers: [RestaurantsService],
	exports: [RestaurantsService],
})
export class RestaurantsModule {}
