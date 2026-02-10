import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

interface JoinRestaurantPayload {
	restaurantId: string;
}

interface JoinBillPayload {
	restaurantId: string;
	billId: string;
}

@WebSocketGateway({
	namespace: '/ws',
	cors: {
		origin: '*',
	},
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	handleConnection(client: Socket) {
		console.log('Client connected:', client.id);
	}

	handleDisconnect(client: Socket) {
		console.log('Client disconnected:', client.id);
	}

	// ===============================
	// JOIN ROOMS
	// ===============================

	@SubscribeMessage('joinRestaurant')
	handleJoinRestaurant(@MessageBody() payload: JoinRestaurantPayload, @ConnectedSocket() client: Socket) {
		const room = `restaurant:${payload.restaurantId}`;
		client.join(room);

		console.log(`Client ${client.id} joined ${room}`);
	}

	@SubscribeMessage('joinBill')
	handleJoinBill(@MessageBody() payload: JoinBillPayload, @ConnectedSocket() client: Socket) {
		const billRoom = `bill:${payload.billId}`;
		const restaurantRoom = `restaurant:${payload.restaurantId}`;

		client.join(billRoom);
		client.join(restaurantRoom);

		console.log(`Client ${client.id} joined ${billRoom}`);
	}

	@SubscribeMessage('leaveBill')
	handleLeaveBill(@MessageBody() payload: JoinBillPayload, @ConnectedSocket() client: Socket) {
		const room = `bill:${payload.billId}`;
		client.leave(room);

		console.log(`Client ${client.id} left ${room}`);
	}

	// ===============================
	// EMIT EVENTS
	// ===============================

	emitBillCreated(restaurantId: string, bill: any) {
		this.server.to(`restaurant:${restaurantId}`).emit('bill.created', bill);
	}

	emitBillUpdated(restaurantId: string, billId: string, bill: any) {
		// notify restaurant (admin)
		this.server.to(`restaurant:${restaurantId}`).emit('bill.updated', bill);

		// notify specific bill viewers (customers)
		this.server.to(`bill:${billId}`).emit('bill.updated', bill);
	}

	emitPaymentCompleted(restaurantId: string, billId: string, payment: any) {
		// admin portal
		this.server.to(`restaurant:${restaurantId}`).emit('payment.completed', payment);

		// customers viewing bill
		this.server.to(`bill:${billId}`).emit('payment.completed', payment);
	}

	emitBillClosed(restaurantId: string, billId: string, bill: any) {
		this.server.to(`restaurant:${restaurantId}`).emit('bill.closed', bill);

		this.server.to(`bill:${billId}`).emit('bill.closed', bill);
	}
}
