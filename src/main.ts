import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.useWebSocketAdapter(new IoAdapter(app));

	app.use(cookieParser());

	const port = process.env.PORT || 3000;

	await app.listen(port);
}
bootstrap();
