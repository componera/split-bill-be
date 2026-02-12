import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { UseGuards } from '@nestjs/common';

@WebSocketGateway({
	namespace: '/ws',
	cors: { origin: '*' },
})
export class SocketGateway {
	@WebSocketServer()
	server: Server;

	// ===============================
	// JOIN ROOMS
	// ===============================
	@UseGuards(WsJwtGuard)
	@SubscribeMessage('joinRestaurant')
	handleJoin(@ConnectedSocket() client: Socket) {
		const user = client.data.user;
		client.join(`restaurant:${user.restaurantId}`);
	}

	@UseGuards(WsJwtGuard)
	@SubscribeMessage('joinBill')
	handleJoinBill(@MessageBody() payload: { billId: string }, @ConnectedSocket() client: Socket) {
		const user = client.data.user;
		const billRoom = `bill:${payload.billId}`;
		const restaurantRoom = `restaurant:${user.restaurantId}`;

		client.join(billRoom);
		client.join(restaurantRoom);
	}

	@SubscribeMessage('leaveBill')
	handleLeaveBill(@MessageBody() payload: { billId: string }, @ConnectedSocket() client: Socket) {
		const room = `bill:${payload.billId}`;
		client.leave(room);
	}

	// ===============================
	// EMIT EVENTS
	// ===============================
	emitBillCreated(restaurantId: string, bill: any) {
		this.server.to(`restaurant:${restaurantId}`).emit('bill.created', bill);
	}

	emitBillUpdated(restaurantId: string, billId: string, bill: any) {
		this.server.to(`restaurant:${restaurantId}`).emit('bill.updated', bill);
		this.server.to(`bill:${billId}`).emit('bill.updated', bill);
	}

	emitPaymentCompleted(restaurantId: string, billId: string, payment: any) {
		this.server.to(`restaurant:${restaurantId}`).emit('payment.completed', payment);
		this.server.to(`bill:${billId}`).emit('payment.completed', payment);
	}

	emitBillClosed(restaurantId: string, billId: string, bill: any) {
		this.server.to(`restaurant:${restaurantId}`).emit('bill.closed', bill);
		this.server.to(`bill:${billId}`).emit('bill.closed', bill);
	}
}
