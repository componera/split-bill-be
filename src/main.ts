// Imports
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import cookie from '@fastify/cookie';

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter({ trustProxy: true }),
	);

	await app.register(cookie);

	app.enableCors({
		origin: [
			'https://www.divvytab.com',
			'https://divvytab.com',
		],
		credentials: true,
	});

	const port = process.env.PORT
		? parseInt(process.env.PORT, 10)
		: 8080;

	await app.listen(port, '0.0.0.0');

	console.log(`[Bootstrap] Server running on port ${port}`);
}

bootstrap();