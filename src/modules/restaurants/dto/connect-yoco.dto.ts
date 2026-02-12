// src/modules/restaurants/dto/connect-yoco.dto.ts
import { IsString } from 'class-validator';

export class ConnectYocoDto {
	@IsString()
	secretKey: string;

	@IsString()
	publicKey: string;
}
