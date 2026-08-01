import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket!: Socket;

  connect(): void {

    if (this.socket?.connected) {
      return;
    }

    const token = localStorage.getItem('token');

    this.socket = io('http://localhost:5000', {
      auth: {
        token
      }
    });

    this.socket.on('connect', () => {
      console.log('Socket Connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket Disconnected');
    });
  }

  disconnect(): void {

    if (this.socket) {
      this.socket.disconnect();
    }

  }

  // ===========================
  // EMIT EVENTS
  // ===========================

  sendMessage(receiverId: string, content: string): void {

    this.socket.emit('sendMessage', {
      receiverId,
      content
    });

  }

  markAsRead(messageId: string): void {

    this.socket.emit('markAsRead', {
      messageId
    });

  }

  // ===========================
  // LISTEN EVENTS
  // ===========================

  onReceiveMessage(callback: (message: any) => void): void {

    this.socket.on('receiveMessage', callback);

  }

  onMessageSent(callback: (message: any) => void): void {

    this.socket.on('messageSent', callback);

  }

  onUserOnline(callback: (data: any) => void): void {

    this.socket.on('userOnline', callback);

  }

  onUserOffline(callback: (data: any) => void): void {

    this.socket.on('userOffline', callback);

  }

  onMessageDelivered(callback: (data: any) => void): void {

    this.socket.on('messageDelivered', callback);

  }

  onMessageRead(callback: (data: any) => void): void {

    this.socket.on('messageRead', callback);

  }

}