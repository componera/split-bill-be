import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
	@Get()
	root() {
		return {
			status: 'ok',
			service: 'Split Bill API',
			uptime: process.uptime(),
			timestamp: new Date(),
		};
	}

	@Get('health')
	health() {
		return 'OK';
	}
}
