import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagesService } from './messages.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.html',
  styleUrl: './messages.css'
})
export class Messages implements OnInit {

  constructor(
  private messageService: MessagesService,
  private socketService: SocketService
) {}

  roles: any[] = [];

  selectedMember: any = null;
  newMessage = '';
  searchText = '';
  expandedRole = '';

  // Current logged-in user
  currentUserId = '';
  currentUserRole = '';

  ngOnInit(): void {

    // Get current user from localStorage
    const user = localStorage.getItem('user');

    if (user) {
      try {
        const userData = JSON.parse(user);

        console.log('User Object:', userData);

        this.currentUserId = userData.id || userData._id || '';
        this.currentUserRole = userData.role || '';

        console.log('Current User ID:', this.currentUserId);
        console.log('Current User Role:', this.currentUserRole);

      } catch (error) {
        console.error('Invalid user data:', error);
      }
    }

    // Load users
    this.socketService.connect();

     this.registerSocketEvents();

     this.loadUsers();

     this.roles.forEach((role: any) => {
  role.members.forEach((member: any) => {
    console.log(
      member.username,
      member._id,
      member.online
    );
  });
});
  }

  updateUserStatus(userId: string, online: boolean): void {

  this.roles.forEach(role => {

    role.members.forEach((member: any) => {

      if (member._id === userId) {

        console.log('MATCH FOUND');
        member.online = online;

        if (this.selectedMember?._id === userId) {
          this.selectedMember.online = online;
        }

        console.log('Member online value:', member.online);
        console.log('Selected online:', this.selectedMember?.online);

      }

    });

  });

}




  // =========================
  // LOAD USERS
  // =========================
  loadUsers(): void {

  this.messageService.getUsersByRole().subscribe({
    next: (data: any[]) => {

      // Volunteer can message only Admin and NGO
      if (this.currentUserRole === 'Volunteer') {
        data = data.filter(role =>
          role.role === 'Admin' || role.role === 'NGO'
        );
      }

      this.roles = data;
     console.log('Users by role:', this.roles);

      this.roles.forEach((role: any) => {
        role.members.forEach((member: any) => {

          this.messageService.getConversation(member._id).subscribe({
            next: (res: any) => {
              member.messages = res.data || [];
            },
            error: () => {
              member.messages = [];
            }
          });

        });
      });

      console.log('Users by role:', this.roles);
    },

    error: (err) => {
      console.error('Error loading users:', err);
    }
  });
}

  // =========================
  // SELECT MEMBER
  // =========================
  selectMember(member: any): void {
     console.log('Selected Member:', member);

    this.selectedMember = member;

    this.messageService.getConversation(member._id).subscribe({
      next: (res: any) => {

        this.selectedMember.messages = res.data || [];

         member.messages = res.data || [];

        console.log(
          'Conversation:',
          this.selectedMember.messages
        );

        // When user opens chat,
        // received messages should become read.
        this.markMessagesAsRead();
      },

      error: (err) => {
        console.error('Error loading conversation:', err);
      }
    });
  }

  // =========================
  // TOGGLE ROLE
  // =========================
  toggleRole(roleName: string): void {

    this.expandedRole =
      this.expandedRole === roleName
        ? ''
        : roleName;
  }

  // =========================
  // SEND MESSAGE
  // =========================
 sendMessage(): void {

  if (!this.selectedMember || !this.newMessage.trim()) {
    return;
  }

  const text = this.newMessage.trim();

  this.messageService
    .sendMessage(this.selectedMember._id, text)
    .subscribe({

      next: (response: any) => {

        console.log('Send Response:', response);

        this.messageService
          .getConversation(this.selectedMember._id)
          .subscribe({

            next: (res: any) => {

              console.log('Conversation Response:', res);

                this.newMessage = '';

              this.selectedMember.messages = [...(res.data || [])];

              console.log(
                'Messages updated:',
                this.selectedMember.messages
              );

              this.newMessage = '';
            },

            error: (err) => {
              console.error('Error refreshing messages:', err);
            }

          });

      },

      error: (err) => {
        console.error('Error sending message:', err);
      }

    });
}
  // =========================
  // SEARCH
  // =========================
  getFilteredRoles(): any[] {

    const search =
      this.searchText.trim().toLowerCase();

    if (!search) {
      return this.roles;
    }

    return this.roles

      .map(role => {

        // Search by role
        if (
          role.role &&
          role.role.toLowerCase().includes(search)
        ) {
          return role;
        }

        // Search by member username
        return {
          ...role,

          members: (role.members || []).filter(
            (member: any) =>
              (member.username || '')
                .toLowerCase()
                .includes(search)
          )
        };
      })

      .filter(role =>
        role.members &&
        role.members.length > 0
      );
  }

  // =========================
  // GET LAST MESSAGE
  // =========================
  getLastMessage(member: any): any {

    if (
      !member ||
      !member.messages ||
      member.messages.length === 0
    ) {
      return null;
    }

    return member.messages[
      member.messages.length - 1
    ];
  }

  // =========================
  // GET LAST MESSAGE TEXT
  // =========================
  getLastMessageText(member: any): string {

    const message =
      this.getLastMessage(member);

    if (!message) {
      return 'No messages yet';
    }

    return (
      message.content ||
      message.message ||
      message.text ||
      ''
    );
  }

  // =========================
  // GET LAST MESSAGE TIME
  // =========================
  getLastMessageTime(member: any): string {

    const message =
      this.getLastMessage(member);

    if (!message) {
      return '';
    }

    const value =
      message.createdAt ||
      message.timestamp ||
      message.time;

    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  // =========================
  // CHECK CURRENT USER MESSAGE
  // =========================
  isMyMessage(message: any): boolean {

    const senderId =
      message?.senderId?._id ||
      message?.senderId ||
      message?.sender?._id ||
      message?.sender;

    return String(senderId) ===
      String(this.currentUserId);
  }

  // =========================
  // ONLINE STATUS
  // =========================
 isMemberOnline(member: any): boolean {

  console.log('Checking member:', member.username, member.online);

  return (
    member?.online === true ||
    member?.isOnline === true ||
    member?.status === 'online'
  );
}

  // =========================
  // USER STATUS TEXT
  // =========================
  getMemberStatus(member: any): string {

    if (this.isMemberOnline(member)) {
      return 'Online';
    }

    if (member?.lastSeen) {
      return `Last seen ${member.lastSeen}`;
    }

    return 'Offline';
  }

  // =========================
  // MESSAGE TICK
  // =========================
  getMessageTick(message: any): string {

    if (!this.isMyMessage(message)) {
      return '';
    }

    const status = String(
      message?.status ||
      message?.messageStatus ||
      message?.deliveryStatus ||
      'sent'
    ).toLowerCase();

    switch (status) {

      case 'sent':
        return '✓';

      case 'delivered':
        return '✓✓';

      case 'read':
        return '✓✓';

      default:
        return '✓';
    }
  }

  // =========================
  // CHECK BLUE TICK
  // =========================
  isMessageRead(message: any): boolean {

    const status = String(
      message?.status ||
      message?.messageStatus ||
      message?.deliveryStatus ||
      ''
    ).toLowerCase();

    return (
      status === 'read' ||
      message?.isRead === true ||
      message?.read === true
    );
  }

  // =========================
  // MARK AS READ
  // =========================

  registerSocketEvents(): void {

  this.socketService.onReceiveMessage((message: any) => {

    console.log('Receive Message:', message);

    this.roles.forEach(role => {

      role.members.forEach((member: any) => {

        const senderId =
          message.senderId?._id ||
          message.senderId;

        if (member._id === senderId) {

          if (!member.messages) {
            member.messages = [];
          }

          member.messages.push(message);

        }

      });

    });

    if (
      this.selectedMember &&
      (
        this.selectedMember._id ===
        (message.senderId?._id || message.senderId)
      )
    ) {

      if (!this.selectedMember.messages) {
        this.selectedMember.messages = [];
      }

      this.selectedMember.messages.push(message);

      this.markMessagesAsRead();

    }

  });

  this.socketService.onUserOnline((data: any) => {

    console.log('ONLINE', data);

    this.updateUserStatus(data.userId, true);

  });

  this.socketService.onUserOffline((data: any) => {

    console.log('OFFLINE', data);

    this.updateUserStatus(data.userId, false);

  });

  this.socketService.onMessageDelivered((data: any) => {

    console.log('Delivered', data);

    this.updateMessageStatus(
      data.messageId,
      data.status
    );

  });

  this.socketService.onMessageRead((data: any) => {

    console.log('Read', data);

    this.updateMessageStatus(
      data.messageId,
      data.status
    );

  });

}
  // =========================
// MARK AS READ
// =========================
markMessagesAsRead(): void {

  if (!this.selectedMember) {
    return;
  }

  this.selectedMember.messages.forEach((message: any) => {

    if (
      !this.isMyMessage(message) &&
      message.status !== 'read'
    ) {

      this.socketService.markAsRead(message._id);

    }

  });

}

updateMessageStatus(
  messageId: string,
  status: string
): void {

  this.roles.forEach(role => {

    role.members.forEach((member: any) => {

      if (!member.messages) {
        return;
      }

      member.messages.forEach((msg: any) => {

        if (msg._id === messageId) {

          msg.status = status;

        }

      });

    });

  });

  if (!this.selectedMember) {
    return;
  }

  this.selectedMember.messages.forEach((msg: any) => {

    if (msg._id === messageId) {

      msg.status = status;

    }

  });

}

}