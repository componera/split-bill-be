import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import cookie from '@fastify/cookie';

async function bootstrap() {
	const isProduction = process.env.NODE_ENV === 'production';

	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter({
			trustProxy: true,
			bodyLimit: 1_048_576,
			caseSensitive: true,
			ignoreTrailingSlash: true,
		}),
		{
			bufferLogs: true,
			logger: isProduction ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug'],
		},
	);

	await app.register(cookie);

	app.enableCors({
		origin: process.env.FRONTEND_URL || true,
		credentials: true,
	});

	app.enableShutdownHooks();

	const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

	await app.listen(port, '0.0.0.0');

	Logger.log(`Server running on port ${port}`, 'Bootstrap');
}

bootstrap();
