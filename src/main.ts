// Imports
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import cookie from '@fastify/cookie';
import { createBunWsHandlers } from './websocket/bun-ws.handlers';

/** WebSocket upgrade path */
const WS_PATH = '/ws';

async function bootstrap() {
	// Always log so we see output when running dist (Nest production logger may hide Logger.log)
	console.log('[Bootstrap] Starting...');
	const isProduction = process.env.NODE_ENV === 'production';

	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter({
			trustProxy: true,
			bodyLimit: 1_048_576,
			routerOptions: {
				caseSensitive: true,
				ignoreTrailingSlash: true,
			},
		} as any),
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

	await app.init();

	const fastify = app.getHttpAdapter().getInstance();
	const wsHandlers = createBunWsHandlers(app);

	const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

	Bun.serve({
		port,
		hostname: '0.0.0.0',
		fetch(req, server) {
			const url = new URL(req.url);

			// Guard: non-WebSocket requests go to Fastify
			const isWsUpgrade =
				url.pathname === WS_PATH && req.headers.get('upgrade')?.toLowerCase() === 'websocket';
			if (!isWsUpgrade) return handleHttp(req, fastify);

			// Upgrade to Bun's native WebSocket (data passed to ws handlers)
			const token = url.searchParams.get('token') ?? undefined;
			const success = (server as any).upgrade(req, { data: { token } });
			if (!success) return handleHttp(req, fastify);

			return undefined;
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

	// Use console so it always shows (Nest production logger only shows error/warn)
	console.log(`[Bootstrap] Server running on port ${port} (Bun HTTP + WebSocket)`);
}

/**
 * Forward HTTP request to Nest/Fastify and return Fetch Response
 */
async function handleHttp(req: Request, fastify: { inject: (opts: any) => Promise<any> }): Promise<Response> {
	const url = new URL(req.url);

	const headers: Record<string, string> = {};
	req.headers.forEach((v, k) => (headers[k] = v));

	// Guard: only read body for methods that may have one
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

bootstrap().catch((err) => {
	console.error('[Bootstrap] Fatal error:', err);
	process.exit(1);
});
