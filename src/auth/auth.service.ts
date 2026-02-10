import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/restaurants.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(Restaurant)
		private restaurants: Repository<Restaurant>,
		private jwtService: JwtService,
	) {}

	async register(dto) {
		const restaurant = await this.restaurants.save({
			name: dto.name,
			email: dto.email,
			password: dto.password,
		});

		return this.generateToken(restaurant);
	}

	async login(dto) {
		const restaurant = await this.restaurants.findOne({
			where: { email: dto.email },
		});

		return this.generateToken(restaurant);
	}

	generateToken(restaurant) {
		return {
			access_token: this.jwtService.sign({
				restaurantId: restaurant.id,
			}),
		};
	}
}
