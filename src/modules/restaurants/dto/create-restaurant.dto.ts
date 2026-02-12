// src/modules/restaurants/dto/create-restaurant.dto.ts
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateRestaurantDto {
	@IsString()
	name: string;

	@IsEmail()
	@IsOptional()
	email?: string;

	@IsString()
	@IsOptional()
	location?: string;

	@IsString()
	@IsOptional()
	ownerName?: string;
}
