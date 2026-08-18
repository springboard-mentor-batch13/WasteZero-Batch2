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

    const token =
      localStorage.getItem('token');

    this.socket = io(
      'http://localhost:5000',
      {
        auth: {
          token
        }
      }
    );

    this.socket.on(
      'connect',
      () => {

        console.log(
          'Socket Connected:',
          this.socket.id
        );

      }
    );

    this.socket.on(
      'connect_error',
      (error) => {

        console.error(
          'Socket Connection Error:',
          error
        );

      }
    );

    this.socket.on(
      'disconnect',
      (reason) => {

        console.log(
          'Socket Disconnected:',
          reason
        );

      }
    );

    this.socket.on(
      'messageError',
      (error) => {

        console.error(
          'Message Error:',
          error
        );

      }
    );

  }

  disconnect(): void {

    if (this.socket) {
      this.socket.disconnect();
    }

  }

  sendMessage(
    receiverId: string,
    content: string
  ): void {

    if (!this.socket?.connected) {

      console.error(
        'Socket is not connected'
      );

      return;
    }

    console.log(
      'Sending socket message:',
      {
        receiverId,
        content
      }
    );

    this.socket.emit(
      'sendMessage',
      {
        receiverId,
        content
      }
    );

  }

  markAsRead(
    messageId: string
  ): void {

    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit(
      'markAsRead',
      {
        messageId
      }
    );

  }

  onReceiveMessage(
    callback: (message: any) => void
  ): void {

    this.socket.on(
      'receiveMessage',
      callback
    );

  }

  onMessageSent(
    callback: (message: any) => void
  ): void {

    this.socket.on(
      'messageSent',
      callback
    );

  }

  onUserOnline(
    callback: (data: any) => void
  ): void {

    this.socket.on(
      'userOnline',
      callback
    );

  }

  onUserOffline(
    callback: (data: any) => void
  ): void {

    this.socket.on(
      'userOffline',
      callback
    );

  }

  onOnlineUsers(
    callback: (users: string[]) => void
  ): void {

    this.socket.on(
      'onlineUsers',
      callback
    );

  }

  onMessageDelivered(
    callback: (data: any) => void
  ): void {

    this.socket.on(
      'messageDelivered',
      callback
    );

  }

  onMessageRead(
    callback: (data: any) => void
  ): void {

    this.socket.on(
      'messageRead',
      callback
    );

  }

}