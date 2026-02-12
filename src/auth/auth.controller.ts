import { Controller, Post, Body, Res, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) { }

	@Post('login')
	async login(@Body() dto: any, @Res({ passthrough: true }) res: Response) {
		const tokens = await this.authService.login(
			dto.email,
			dto.password,
		);

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
	async refresh(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		const refreshToken = req.cookies.refreshToken;

		const payload = this.jwtService.verify(
			refreshToken,
			{ secret: process.env.JWT_REFRESH_SECRET },
		);

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
}
