// main.ts
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import cookie from '@fastify/cookie';
import { createBunWsHandlers } from './websocket/bun-ws.handlers';

/** WebSocket upgrade path */
const WS_PATH = '/ws';

async function bootstrap() {
	console.log('[Bootstrap] Starting...');
	const isProduction = process.env.NODE_ENV === 'production';

	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter({
			trustProxy: true,
			bodyLimit: 1_048_576, // 1 MB
			routerOptions: {
				caseSensitive: true,
				ignoreTrailingSlash: true,
			},
		}),
		{
			bufferLogs: true,
			logger: isProduction ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug'],
		},
	);

	// Register cookies
	await app.register(cookie, {
		parseOptions: {
			domain: '.divvytab.com',        // matches frontend/backend
			httpOnly: true,
			path: '/',
			sameSite: 'lax',                // safe default
			secure: isProduction,
		},
	});

	// Enable CORS
	app.enableCors({
		origin: [
			'https://www.divvytab.com',
			'https://divvytab.com',
		],
		credentials: true,
	});

	app.enableShutdownHooks();
	await app.init();

	const fastify = app.getHttpAdapter().getInstance();
	const wsHandlers = createBunWsHandlers(app);

	const port = parseInt(process.env.PORT || '3000', 10);

	// Bun HTTP + WebSocket server
	Bun.serve({
		port,
		hostname: '0.0.0.0',
		fetch: async (req, server) => {
			const url = new URL(req.url);

			// WebSocket upgrade
			const isWsUpgrade =
				url.pathname === WS_PATH &&
				req.headers.get('upgrade')?.toLowerCase() === 'websocket';

			if (isWsUpgrade) {
				const token = url.searchParams.get('token') ?? undefined;
				const success = (server as any).upgrade(req, { data: { token } });
				if (!success) return handleHttp(req, fastify);
				return undefined;
			}

			// Normal HTTP request
			return handleHttp(req, fastify);
		},
		websocket: {
			open(ws) {
				wsHandlers.open(ws);
			},
			message(ws, message) {
				wsHandlers.message(ws, message);
			},
			close(ws, code, reason) {
				wsHandlers.close(ws, code, reason);
			},
		},
	});

	console.log(`[Bootstrap] Server running on port ${port} (Bun + Fastify + WebSocket)`);
}

/**
 * Forward HTTP requests to Fastify and return a Fetch Response
 */
async function handleHttp(
	req: Request,
	fastify: { inject: (opts: any) => Promise<any> },
): Promise<Response> {
	const url = new URL(req.url);

	const headers: Record<string, string> = {};
	req.headers.forEach((v, k) => (headers[k] = v));

	// Only read body for methods that may have one
	const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
	const payload = hasBody ? await req.arrayBuffer() : undefined;

	const res = await fastify.inject({
		method: req.method,
		url: url.pathname + url.search,
		headers,
		payload: payload ? Buffer.from(payload) : undefined,
	});

	return new Response(res.body ?? undefined, {
		status: res.statusCode,
		headers: res.headers as Record<string, string>,
	});
}

bootstrap().catch(err => {
	console.error('[Bootstrap] Fatal error:', err);
	process.exit(1);
});