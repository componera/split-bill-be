// src/modules/restaurants/dto/connect-lightspeed.dto.ts
import { IsString } from 'class-validator';

export class ConnectLightspeedDto {
	@IsString()
	accountId: string;

	@IsString()
	accessToken: string;

	@IsString()
	refreshToken: string;
}
