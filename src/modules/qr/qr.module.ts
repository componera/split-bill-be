import { Module } from '@nestjs/common';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';

@Module({
	providers: [QrService],
	controllers: [QrController],
	exports: [QrService],
})
export class QrModule {}
