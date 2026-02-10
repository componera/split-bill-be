import Module from 'module';
import { QrController } from './qr.controller';
import { QrService } from './qr.service';

@Module({
	providers: [QrService],
	controllers: [QrController],
})
export class QrModule {}
