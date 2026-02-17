// Imports
import { Injectable } from '@nestjs/common';

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
 * Bun WebSocket room manager
 * @description Manages the rooms and sockets for the Bun WebSocket server
 * @example
 * const roomManager = new BunWebSocketRoomManager();
 * roomManager.addSocket(ws);
 * roomManager.removeSocket(ws);
 * roomManager.to('room1').emit('message', 'Hello, world!');
 * roomManager.broadcast('message', 'Hello, world!');
 */
@Injectable()
export class BunWebSocketRoomManager {
	/**
	 * The rooms map
	 */
	private readonly rooms = new Map<string, Set<BunWs>>();

	/**
	 * The sockets to rooms map
	 */
	private readonly socketToRooms = new Map<BunWs, Set<string>>();

	/**
	 * Add a socket to the room manager
	 * @param ws - The socket to add
	 */
	addSocket(ws: BunWs): void {
		// Initialize the socket to rooms map
		this.socketToRooms.set(ws, new Set());
	}

	/**
	 * Remove a socket from the room manager
	 * @param ws - The socket to remove
	 */
	removeSocket(ws: BunWs): void {
		// Get the rooms the socket is in
		const rooms = this.socketToRooms.get(ws);

		// If the socket is not in any rooms, return
		if (!rooms) return;

		// Iterate over the rooms the socket is in
		for (const room of rooms) {
			// Get the rooms set
			const set = this.rooms.get(room);

			// If the room is not in the rooms map, continue
			if (!set) continue;

			// Delete the socket from the room
			set.delete(ws);

			// If the room is empty, delete the room
			if (set.size === 0) this.rooms.delete(room);
		}

		// Delete the socket from the socket to rooms map
		this.socketToRooms.delete(ws);
	}

	/**
	 * Add a socket to a room
	 * @param ws - The socket to add
	 * @param room - The room to add the socket to
	 */
	addToRoom(ws: BunWs, room: string): void {
		// Get the rooms set
		let set = this.rooms.get(room);

		// If the room is not in the rooms map, create a new set
		if (!set) {
			// Create a new set
			set = new Set();

			// Set the room in the rooms map
			this.rooms.set(room, set);
		}

		// Add the socket to the room
		set.add(ws);

		// Add the room to the socket to rooms map
		this.socketToRooms.get(ws)?.add(room);
	}

	/**
	 * Remove a socket from a room
	 * @param ws - The socket to remove
	 * @param room - The room to remove the socket from
	 */
	removeFromRoom(ws: BunWs, room: string): void {
		// Get the rooms set
		this.rooms.get(room)?.delete(ws);

		// Delete the room from the socket to rooms map
		this.socketToRooms.get(ws)?.delete(room);
	}

	/**
	 * Emit to a room
	 * @param room - The room to emit to
	 * @returns The emit function
	 */
	to(room: string): { emit: (event: string, data: any) => void } {
		// Get the sockets in the room
		return {
			emit: (event: string, data: any) => {
				const sockets = this.rooms.get(room);
				if (!sockets) return;
				const payload = JSON.stringify({ event, data });
				for (const ws of sockets) {
					if (ws.readyState === 1) ws.send(payload);
				}
			},
		};
	}

	/**
	 * Broadcast to all sockets
	 * @param event - The event to broadcast
	 * @param data - The data to broadcast
	 */
	broadcast(event: string, data?: any): void {
		// Create the payload
		const payload = JSON.stringify({ event, data: data ?? null });

		// Iterate over the sockets to rooms map
		for (const [ws] of this.socketToRooms) {
			// If the socket is ready, send the payload
			if (ws.readyState === 1) ws.send(payload);
		}
	}
}
