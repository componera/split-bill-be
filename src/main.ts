import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Enable CORS
	app.enableCors({
		origin: process.env.FRONTEND_URL || true,
		credentials: true,
	});

	// Railway provides PORT automatically
	const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

	// Listen on all interfaces (required for Railway)
	await app.listen(port, '0.0.0.0');

	console.log(`Server running on port ${port}`);
}

bootstrap();
