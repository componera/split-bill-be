// Imports
import { Injectable } from '@nestjs/common';
import { BunWebSocketRoomManager } from './bun-ws.room-manager';

/**
 * Socket gateway
 * @description Emits real-time events over Bun's native WebSocket server (see main.ts).
 * Services inject this to push bill, payment, and staff updates to connected clients.
 */
@Injectable()
export class SocketGateway {
	/**
	 * Constructor
	 * @param roomManager - The room manager
	 */
	constructor(private readonly roomManager: BunWebSocketRoomManager) { }

	// ===============================
	// BILL EVENTS
	// ===============================

	/**
	 * Emit when a new bill is created for a restaurant
	 */
	emitBillCreated(restaurantId: string, bill: any): void {
		this.roomManager.to(`restaurant:${restaurantId}`).emit('bill.created', bill);
	}

	/**
	 * Emit when a bill is updated (restaurant room and bill room)
	 */
	emitBillUpdated(restaurantId: string, billId: string, bill: any): void {
		this.roomManager.to(`restaurant:${restaurantId}`).emit('bill.updated', bill);
		this.roomManager.to(`bill:${billId}`).emit('bill.updated', bill);
	}

	/**
	 * Emit when a bill is closed (restaurant room and bill room)
	 */
	emitBillClosed(restaurantId: string, billId: string, bill: any): void {
		this.roomManager.to(`restaurant:${restaurantId}`).emit('bill.closed', bill);
		this.roomManager.to(`bill:${billId}`).emit('bill.closed', bill);
	}

	// ===============================
	// STAFF EVENTS
	// ===============================

	/**
	 * Broadcast staff list changed to all connected clients
	 */
	emitStaffUpdated(): void {
		this.roomManager.broadcast('staffUpdated');
	}

	// ===============================
	// PAYMENT EVENTS
	// ===============================

	/**
	 * Emit when a payment is completed (restaurant room and bill room)
	 */
	emitPaymentCompleted(restaurantId: string, billId: string, payment: any): void {
		this.roomManager.to(`restaurant:${restaurantId}`).emit('payment.completed', payment);
		this.roomManager.to(`bill:${billId}`).emit('payment.completed', payment);
	}
}
