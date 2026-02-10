import Module from 'module';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { YocoService } from './yoco.service';
import { YocoController } from './yoco.controller';

@Module({
	imports: [PaymentsModule, WebsocketModule],
	providers: [YocoService],
	controllers: [YocoController],
})
export class YocoModule { }
