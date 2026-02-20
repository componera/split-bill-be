import { Controller, Post, Body, Res, Req, Get, UseGuards } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
	constructor(
		private authService: AuthService,
		private jwtService: JwtService,
	) { }


	@Get("me")
	@UseGuards(JwtAuthGuard)
	getMe(@Req() req) {
		return req.user;
	}

	@Post('register')
	async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: FastifyReply) {
		const tokens = await this.authService.register(body);

		res.setCookie('access_token', tokens.accessToken, {
			httpOnly: true,
			path: '/',
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
		});

		return { message: 'Registered successfully', refreshToken: tokens.refreshToken };
	}

	@Post('login')
	async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: FastifyReply) {
		const tokens = await this.authService.login(body);

		res.setCookie('access_token', tokens.accessToken, {
			httpOnly: true,
			path: '/',
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
		});

		return { message: 'Logged in', refreshToken: tokens.refreshToken };
	}

	@Post('refresh')
	async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
		const refreshToken = req.cookies.refreshToken;

		const payload = this.jwtService.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });

		const tokens = await this.authService.refresh(payload.sub);

		res.setCookie('refreshToken', tokens.refreshToken, {
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
