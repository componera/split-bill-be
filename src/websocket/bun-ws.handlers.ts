// Imports
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/modules/users/users.service';
import { BunWebSocketRoomManager } from './bun-ws.room-manager';

/**
 * Bun WebSocket interface
 */
interface BunWs {
	/**
	 * The ready state of the WebSocket connection
	 */
	readyState: number;

	/**
	 * Send a message to the WebSocket connection
	 * @param payload - The message to send
	 */
	send(payload: string | Buffer): void;

	/**
	 * Close the WebSocket connection
	 * @param code - The code to close the connection with
	 * @param reason - The reason for closing the connection
	 */
	close(code?: number, reason?: string): void;

	/**
	 * The data associated with the WebSocket connection
	 * @param user - The user associated with the WebSocket connection
	 * @param token - The token associated with the WebSocket connection
	 */
	data?: { user?: any; token?: string };
}

/**
 * Bun WebSocket handlers
 * @description Handlers for open, message, and close events on Bun's native WebSocket server
 */
export interface BunWsHandlers {
	open: (ws: BunWs) => void | Promise<void>;
	message: (ws: BunWs, message: string | Buffer) => void | Promise<void>;
	close: (ws: BunWs, code: number, reason: string) => void;
}

/**
 * Create Bun WebSocket handlers wired to Nest app services
 * @param app - The Nest application instance
 * @returns Handlers for use with Bun.serve({ websocket: { ... } })
 */
export function createBunWsHandlers(app: INestApplication): BunWsHandlers {
	const roomManager = app.get(BunWebSocketRoomManager);
	const jwtService = app.get(JwtService);
	const usersService = app.get(UsersService);

	return {
		async open(ws: BunWs) {
			// Guard: require token
			const token = ws.data?.token;
			if (!token) return ws.close(4401, 'Missing token');

			// Verify the token
			try {
				// Verify the token
				const payload = jwtService.verify(token) as { sub: string };

				// Find the user by id
				const user = await usersService.findById(payload.sub);

				// Add the user to the WebSocket data
				(ws.data as { user?: any }).user = user;

				// Add the socket to the room manager
				roomManager.addSocket(ws);
			} catch {
				// Close the WebSocket connection with an invalid token error
				ws.close(4401, 'Invalid token');
			}
		},

		message(ws: BunWs, message: string | Buffer) {
			// Normalize message to string
			const raw = typeof message === 'string' ? message : message.toString();

			// Guard: must be valid JSON
			let msg: { type?: string; billId?: string };

			// Try to parse the message as JSON
			try {
				// Parse the message as JSON
				msg = JSON.parse(raw);
			} catch {
				// If the message is not valid JSON, return
				return;
			}

			// Get the user from the WebSocket data
			const user = ws.data?.user;

			// Switch on the message type
			switch (msg.type) {
				// Join a restaurant room
				case 'joinRestaurant':
					// Guard: require restaurant id
					if (!user?.restaurantId) break;

					// Add the socket to the restaurant room
					roomManager.addToRoom(ws, `restaurant:${user.restaurantId}`);

					// Break
					break;

				// Join a bill room
				case 'joinBill':
					// Guard: require bill id
					if (!msg.billId) break;

					// Add the socket to the bill room
					roomManager.addToRoom(ws, `bill:${msg.billId}`);

					// Add the socket to the restaurant room
					if (user?.restaurantId) roomManager.addToRoom(ws, `restaurant:${user.restaurantId}`);

					// Break
					break;

				// Leave a bill room
				case 'leaveBill':
					// Guard: require bill id
					if (!msg.billId) break;

					// Remove the socket from the bill room
					roomManager.removeFromRoom(ws, `bill:${msg.billId}`);

					// Remove the socket from the restaurant room
					break;

				// Default case
				default:
					break;
			}
		},

		close(ws: BunWs) {
			// Remove the socket from the room manager
			roomManager.removeSocket(ws);
		},
	};
}
