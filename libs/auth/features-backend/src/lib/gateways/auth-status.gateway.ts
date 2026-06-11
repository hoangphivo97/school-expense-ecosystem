import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: 'http://localhost:4200' }, // Secure this with your actual environment frontend URL later
  namespace: 'auth-status'
})
export class AuthStatusGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(AuthStatusGateway.name);

  handleConnection(client: Socket) {
    const userId = client.handshake.query['userId'] as string;
    if (userId) {
      // Group the user into a private dedicated socket room based on their UID
      client.join(`user-${userId}`);
      this.logger.log(`Client bound securely to real-time room: user-${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from session space: ${client.id}`);
  }

  /**
   * Enterprise Pattern: Pushes a lightweight notification trigger straight to the target client room.
   * This eliminates the need to transmit heavy data payloads over persistent connections.
   */
  emitStatusUpdate(userId: string): void {
    this.server.to(`user-${userId}`).emit('statusChanged', { action: 'FETCH_PROFILE' });
  }
}