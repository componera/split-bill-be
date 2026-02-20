import { Controller, Post, Body, Res, Req, Get, UseGuards, UnauthorizedException } from '@nestjs/common';
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
		const user = req.user;

		return {
			id: user.id,
			email: user.email,
			role: user.role,
			restaurantId: user.restaurantId,
			firstName: user.firstName,
			lastName: user.lastName,
		};
	}

	@Post('register')
	async register(
		@Body() body: RegisterDto,
		@Res({ passthrough: true }) res: FastifyReply
	) {
		// Register returns { accessToken, refreshToken }
		const tokens = await this.authService.register(body);

		// Set access token cookie (short-lived)
		res.setCookie('access_token', tokens.accessToken, {
			httpOnly: true,
			path: '/',
			domain: '.divvytab.com',
			sameSite: 'none',                   // allows top-level redirects
			secure: true,
			maxAge: 60 * 15,                   // 15 minutes
		});

		// Set refresh token cookie (longer-lived)
		res.setCookie('refresh_token', tokens.refreshToken, {
			httpOnly: true,
			path: '/',
			domain: '.divvytab.com',
			sameSite: 'none',
			secure: true,
			maxAge: 60 * 60 * 24 * 30,         // 30 days
		});

		// Return minimal info only
		return { message: 'Registered successfully' };
	}

	@Post('login')
	async login(
		@Body() body: LoginDto,
		@Res({ passthrough: true }) res: FastifyReply
	) {
		// Login returns { accessToken, refreshToken }
		const tokens = await this.authService.login(body);

		// Set access token cookie (short-lived)
		res.setCookie('access_token', tokens.accessToken, {
			httpOnly: true,
			path: '/',
			domain: '.divvytab.com',
			sameSite: 'none',                   // allows top-level redirects
			secure: true,
			maxAge: 60 * 15,                   // 15 minutes
		});

		// Set refresh token cookie (longer-lived)
		res.setCookie('refresh_token', tokens.refreshToken, {
			httpOnly: true,
			path: '/',
			domain: '.divvytab.com',
			sameSite: 'none',
			secure: true,
			maxAge: 60 * 60 * 24 * 30,         // 30 days
		});

		// Return minimal info to frontend (optional)
		return { message: 'Logged in' };
	}

	@Post("refresh")
	async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
		const refreshToken = req.cookies.refresh_token;
		if (!refreshToken) throw new UnauthorizedException("Missing refresh token");

		const payload = this.jwtService.verify(refreshToken, {
			secret: process.env.JWT_REFRESH_SECRET,
		});

		const tokens = await this.authService.refresh(payload.sub);

		// Set new access_token cookie (short-lived)
		res.setCookie("access_token", tokens.accessToken, {
			httpOnly: true,
			secure: true,
			sameSite: "lax", // safe for top-level GET
			path: "/",
			maxAge: 60 * 15, // 15 minutes
		});

		return { message: "Access token refreshed" };
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
