import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
	constructor(
		private authService: AuthService,
		private jwtService: JwtService,
	) {}

	@Post('register')
	async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
		const tokens = await this.authService.register(dto);

		res.cookie('refreshToken', tokens.refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/auth/refresh',
		});

		return {
			accessToken: tokens.accessToken,
		};
	}

	@Post('login')
	async login(@Body() dto: any, @Res({ passthrough: true }) res: Response) {
		const tokens = await this.authService.login(dto.email, dto.password);

		res.cookie('refreshToken', tokens.refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/auth/refresh',
		});

		return {
			accessToken: tokens.accessToken,
		};
	}

	@Post('refresh')
	async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		const refreshToken = req.cookies.refreshToken;

		const payload = this.jwtService.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });

		const tokens = await this.authService.refresh(payload.sub);

		res.cookie('refreshToken', tokens.refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/auth/refresh',
		});

		return {
			accessToken: tokens.accessToken,
		};
	}

	@Post('accept-invite')
	async acceptInvite(
		@Body()
		body: {
			token: string;
			password: string;
		},
	) {
		return this.authService.acceptInvite(body.token, body.password);
	}

	@Post('verify-email')
	async verifyEmail(@Body() body: { token: string }) {
		return this.authService.verifyEmail(body.token);
	}
}
