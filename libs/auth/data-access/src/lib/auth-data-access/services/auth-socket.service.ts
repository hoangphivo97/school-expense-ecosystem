import { Injectable, inject, effect } from '@angular/core';
import { AuthSignalStore } from '../RouteGuard/auth-signal.store';
import { AuthService } from './auth.service';
import { UserStatus } from '@school-expense-ecosystem/auth/types';
import { io, Socket } from "socket.io-client";


@Injectable({ providedIn: 'root' })
export class AuthSocketService {
  private readonly authStore = inject(AuthSignalStore);
  private readonly authService = inject(AuthService);
  private socket: Socket | null = null;

  constructor() {
    /**
     * REACTIVE LIFECYCLE EFFECT:
     * Monitors the user identity stream. Automatically spins up the socket bridge
     * ONLY when a user is logged in and strictly stuck inside the PENDING approval state.
     */
    effect(() => {
      const user = this.authStore.user();

      if (user && user.status === UserStatus.PENDING) {
        this.connectSocket(user.uid);
      } else {
        this.disconnectSocket();
      }
    });
  }

  private connectSocket(userId: string): void {
    if (this.socket?.connected) return;

    this.socket = io('http://localhost:3000/auth-status', {
      query: { userId }
    });

    /**
     * CLEAN HYBRID PATTERN:
     * When backend pushes the 'statusChanged' signal, frontend executes a clean 
     * pull action via HTTP to fetch the updated profile parameters securely.
     */
    this.socket.on('statusChanged', () => {
    //   this.authService.getProfile().subscribe((updatedUser) => {
    //     this.authStore.updateAuthState(this.authStore.token(), updatedUser);
    //   });
    });
  }

  private disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}