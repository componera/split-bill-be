import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
	constructor() { }

	@Get()
	root() {
		return {
			status: 'ok',
			service: 'Divvy Tab API',
			version: '1.0.0',
		};
	}
}
