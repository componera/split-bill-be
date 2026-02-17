import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LightspeedToken } from './entities/lightspeed-token.entity';

@Injectable()
export class LightspeedOAuthService {
	constructor(
		@InjectRepository(LightspeedToken)
		private tokenRepo: Repository<LightspeedToken>,
	) { }

	getAuthUrl(restaurantId: string) {
		const params = new URLSearchParams({
			response_type: 'code',
			client_id: process.env.LIGHTSPEED_CLIENT_ID,
			redirect_uri: process.env.LIGHTSPEED_REDIRECT_URI,
			scope: 'employee:all',
			state: restaurantId,
		});

		return `https://cloud.lightspeedapp.com/oauth/authorize?${params}`;
	}

	async exchangeCode(code: string, restaurantId: string) {
		const res = await fetch('https://cloud.lightspeedapp.com/oauth/access_token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				grant_type: 'authorization_code',
				code,
				client_id: process.env.LIGHTSPEED_CLIENT_ID,
				client_secret: process.env.LIGHTSPEED_CLIENT_SECRET,
			}),
		});

		if (!res.ok) throw new Error(`Lightspeed OAuth failed: ${res.status}`);

		const token = await res.json();

		await this.tokenRepo.save({
			restaurantId,
			accessToken: token.access_token,
			refreshToken: token.refresh_token,
			accountId: token.account_id,
			expiresAt: new Date(Date.now() + token.expires_in * 1000),
		});

		return token;
	}

	async refreshToken(restaurantId: string) {
		const token = await this.tokenRepo.findOne({
			where: { restaurantId },
		});

		const res = await fetch('https://cloud.lightspeedapp.com/oauth/access_token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				grant_type: 'refresh_token',
				refresh_token: token.refreshToken,
				client_id: process.env.LIGHTSPEED_CLIENT_ID,
				client_secret: process.env.LIGHTSPEED_CLIENT_SECRET,
			}),
		});

		if (!res.ok) throw new Error(`Lightspeed token refresh failed: ${res.status}`);

		const newToken = await res.json();

		token.accessToken = newToken.access_token;
		token.refreshToken = newToken.refresh_token;
		token.expiresAt = new Date(Date.now() + newToken.expires_in * 1000);

		await this.tokenRepo.save(token);

		return token.accessToken;
	}
}
