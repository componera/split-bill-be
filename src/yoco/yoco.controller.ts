import { Controller, Post, Body } from '@nestjs/common';
import { YocoService } from './yoco.service';

@Controller('yoco')
export class YocoController {
	constructor(private yocoService: YocoService) {}

	@Post('webhook')
	async webhook(@Body() body: any) {
		return this.yocoService.handleWebhook(body);
	}
}
