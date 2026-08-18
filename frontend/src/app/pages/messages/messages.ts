import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagesService } from './messages.service';
import { SocketService } from '../../services/socket.service';
import { NotificationService } from '../notifications/notification.service';

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
    private socketService: SocketService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  roles: any[] = [];
  private onlineUsers = new Set<string>();

  selectedMember: any = null;
  newMessage = '';
  searchText = '';
  expandedRole = '';

  currentUserId = '';
  currentUserRole = '';

  @ViewChild('messagesContainer')
  messagesContainer!: ElementRef;

  ngOnInit(): void {

    const user = localStorage.getItem('user');

    if (user) {
      try {
        const userData = JSON.parse(user);

        console.log('User Object:', userData);

        this.currentUserId =
          userData.id ||
          userData._id ||
          '';

        this.currentUserRole =
          userData.role ||
          '';

        console.log(
          'Current User ID:',
          this.currentUserId
        );

        console.log(
          'Current User Role:',
          this.currentUserRole
        );

      } catch (error) {
        console.error(
          'Invalid user data:',
          error
        );
      }
    }

    this.socketService.connect();

    this.registerSocketEvents();

    this.notificationService
      .markMessageNotificationsAsRead()
      .subscribe({
        next: () => {
          this.notificationService
            .refreshNotifications()
            .subscribe();
        },
        error: (err) => {
          console.error(
            'Failed to mark message notifications as read',
            err
          );
        }
      });

    this.loadUsers();
  }

  updateUserStatus(
    userId: string,
    online: boolean
  ): void {

    console.log(
      'Updating:',
      userId,
      online
    );

    const id = String(userId);

    this.roles.forEach(role => {

      role.members.forEach((member: any) => {

        if (
          String(member._id) === id
        ) {

          member.online = online;

        }

      });

    });

    if (
      this.selectedMember &&
      String(this.selectedMember._id) === id
    ) {

      this.selectedMember.online =
        online;

    }

    this.cdr.detectChanges();
  }

  loadUsers(): void {

    this.messageService
      .getUsersByRole()
      .subscribe({

        next: (data: any[]) => {

          console.log(
            'API Response:',
            data
          );

          if (
            this.currentUserRole ===
            'Volunteer'
          ) {

            data = data.filter(
              role =>
                role.role === 'Admin' ||
                role.role === 'NGO'
            );

          }

          if (
            this.currentUserRole ===
            'Admin'
          ) {

            data = data.filter(
              role =>
                role.role !== 'Admin'
            );

          }

          if (
            this.currentUserRole ===
            'NGO'
          ) {

            data = data.filter(
              role =>
                role.role !== 'NGO'
            );

          }

          this.roles = data;

          const lastChatUserId =
            localStorage.getItem(
              'lastChatUser'
            );

          if (lastChatUserId) {

            for (
              const role of this.roles
            ) {

              const member =
                role.members.find(
                  (m: any) =>
                    String(m._id) ===
                    String(lastChatUserId)
                );

              if (member) {

                this.selectedMember =
                  member;

                this.messageService
                  .getConversation(
                    member._id
                  )
                  .subscribe({

                    next: (res: any) => {

                      this.selectedMember.messages =
                        res.data || [];

                      member.messages =
                        res.data || [];

                      this.cdr.detectChanges();

                      this.scrollToBottom();

                    },

                    error: (err) => {

                      console.error(
                        'Error restoring conversation:',
                        err
                      );

                      member.messages = [];

                    }

                  });

                break;

              }

            }

          }

          this.roles.forEach(
            role => {

              role.members.forEach(
                (member: any) => {

                  member.online =
                    this.onlineUsers.has(
                      String(member._id)
                    );

                }
              );

            }
          );

          this.cdr.detectChanges();

          this.roles.forEach(
            role => {

              role.members.forEach(
                (member: any) => {

                  this.messageService
                    .getConversation(
                      member._id
                    )
                    .subscribe({

                      next: (res: any) => {

                        member.messages =
                          res.data || [];

                        role.members.sort(
                          (
                            a: any,
                            b: any
                          ) => {

                            const aTime =
                              a.messages?.length
                                ? new Date(
                                    a.messages[
                                      a.messages.length - 1
                                    ].createdAt
                                  ).getTime()
                                : 0;

                            const bTime =
                              b.messages?.length
                                ? new Date(
                                    b.messages[
                                      b.messages.length - 1
                                    ].createdAt
                                  ).getTime()
                                : 0;

                            return (
                              bTime -
                              aTime
                            );

                          }
                        );

                        this.cdr.detectChanges();

                      },

                      error: () => {

                        member.messages =
                          [];

                      }

                    });

                });

            });

        },

        error: (err) => {

          console.error(
            'Error loading users:',
            err
          );

        }

      });

  }

  selectMember(member: any): void {

    console.log(
      'Selected Member:',
      member
    );

    this.selectedMember =
      member;

    localStorage.setItem(
      'lastChatUser',
      String(member._id)
    );

    this.messageService
      .getConversation(member._id)
      .subscribe({

        next: (res: any) => {

          this.selectedMember.messages =
            res.data || [];

          member.messages =
            res.data || [];

          console.log(
            'Conversation:',
            this.selectedMember.messages
          );

          this.markMessagesAsRead();

          this.cdr.detectChanges();

          this.scrollToBottom();

        },

        error: (err) => {

          console.error(
            'Error loading conversation:',
            err
          );

        }

      });

  }

  toggleRole(
    roleName: string
  ): void {

    this.expandedRole =
      this.expandedRole === roleName
        ? ''
        : roleName;

  }

  getUnreadCount(
    member: any
  ): number {

    if (!member.messages) {
      return 0;
    }

    return member.messages.filter(
      (message: any) =>
        !this.isMyMessage(message) &&
        String(message.status)
          .toLowerCase() !== 'read'
    ).length;

  }

  scrollToBottom(): void {

    setTimeout(() => {

      if (this.messagesContainer) {

        const element =
          this.messagesContainer
            .nativeElement;

        element.scrollTop =
          element.scrollHeight;

      }

    }, 100);

  }

  sendMessage(): void {

    if (
      !this.selectedMember ||
      !this.newMessage.trim()
    ) {
      return;
    }

    const text =
      this.newMessage.trim();

    this.newMessage = '';

    console.log(
      'Sending message to:',
      this.selectedMember._id
    );

    this.socketService.sendMessage(
      String(this.selectedMember._id),
      text
    );

  }

  getFilteredRoles(): any[] {

    const search =
      this.searchText
        .trim()
        .toLowerCase();

    if (!search) {
      return this.roles;
    }

    return this.roles

      .map(role => {

        if (
          role.role &&
          role.role
            .toLowerCase()
            .includes(search)
        ) {

          return role;

        }

        return {

          ...role,

          members:
            (role.members || [])
              .filter(
                (member: any) =>
                  (member.username || '')
                    .toLowerCase()
                    .includes(search)
              )

        };

      })

      .filter(
        role =>
          role.members &&
          role.members.length > 0
      );

  }

  getLastMessage(
    member: any
  ): any {

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

  getLastMessageText(
    member: any
  ): string {

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

  getLastMessageTime(
    member: any
  ): string {

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

    const date =
      new Date(value);

    if (
      isNaN(date.getTime())
    ) {

      return String(value);

    }

    return date.toLocaleTimeString(
      [],
      {
        hour: 'numeric',
        minute: '2-digit'
      }
    );

  }

  isMyMessage(
    message: any
  ): boolean {

    const senderId =
      message?.senderId?._id ||
      message?.senderId ||
      message?.sender?._id ||
      message?.sender;

    return (
      String(senderId) ===
      String(this.currentUserId)
    );

  }

  isMemberOnline(
    member: any
  ): boolean {

    return (
      member?.online === true ||
      member?.isOnline === true ||
      member?.status === 'online'
    );

  }

  getMemberStatus(
    member: any
  ): string {

    if (
      this.isMemberOnline(member)
    ) {

      return 'Online';

    }

    if (member?.lastSeen) {

      return `Last seen ${member.lastSeen}`;

    }

    return 'Offline';

  }

  getMessageTick(
    message: any
  ): string {

    if (
      !this.isMyMessage(message)
    ) {

      return '';

    }

    const status =
      String(
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

  isMessageRead(
    message: any
  ): boolean {

    const status =
      String(
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

  registerSocketEvents(): void {

    this.socketService.onMessageSent(
      (message: any) => {

        console.log(
          'Message Sent:',
          message
        );

        const receiverId =
          message?.receiverId?._id ||
          message?.receiverId;

        if (
          !this.selectedMember ||
          String(receiverId) !==
          String(this.selectedMember._id)
        ) {
          return;
        }

        if (
          !this.selectedMember.messages
        ) {

          this.selectedMember.messages =
            [];

        }

        const existingIndex =
          this.selectedMember.messages
            .findIndex(
              (msg: any) =>
                String(msg._id) ===
                String(message._id)
            );

        if (
          existingIndex >= 0
        ) {

          this.selectedMember.messages[
            existingIndex
          ] = {
            ...this.selectedMember.messages[
              existingIndex
            ],
            ...message
          };

        } else {

          this.selectedMember.messages =
            [
              ...this.selectedMember.messages,
              message
            ];

        }

        this.cdr.detectChanges();

        this.scrollToBottom();

      }
    );


    this.socketService.onReceiveMessage(
      (message: any) => {

        console.log(
          'Receive Message:',
          message
        );

        const senderId =
          message?.senderId?._id ||
          message?.senderId;

        this.roles.forEach(
          role => {

            role.members.forEach(
              (member: any) => {

                if (
                  String(member._id) !==
                  String(senderId)
                ) {
                  return;
                }

                if (
                  !member.messages
                ) {

                  member.messages =
                    [];

                }

                const exists =
                  member.messages.some(
                    (msg: any) =>
                      String(msg._id) ===
                      String(message._id)
                  );

                if (!exists) {

                  member.messages =
                    [
                      ...member.messages,
                      message
                    ];

                }

              }
            );

          }
        );


        if (
          this.selectedMember &&
          String(
            this.selectedMember._id
          ) ===
          String(senderId)
        ) {

          if (
            !this.selectedMember.messages
          ) {

            this.selectedMember.messages =
              [];

          }

          const exists =
            this.selectedMember.messages.some(
              (msg: any) =>
                String(msg._id) ===
                String(message._id)
            );

          if (!exists) {

            this.selectedMember.messages =
              [
                ...this.selectedMember.messages,
                message
              ];

          }

          this.cdr.detectChanges();

          this.scrollToBottom();

          this.markMessagesAsRead();

        }

      }
    );


    this.socketService.onOnlineUsers(
      (users: string[]) => {

        console.log(
          'ONLINE USERS:',
          users
        );

        this.onlineUsers =
          new Set(
            (users || []).map(
              user => String(user)
            )
          );

        this.roles.forEach(
          role => {

            role.members.forEach(
              (member: any) => {

                member.online =
                  this.onlineUsers.has(
                    String(member._id)
                  );

              }
            );

          }
        );

        if (this.selectedMember) {

          this.selectedMember.online =
            this.onlineUsers.has(
              String(
                this.selectedMember._id
              )
            );

        }

        this.cdr.detectChanges();

      }
    );


    this.socketService.onUserOnline(
      (data: any) => {

        console.log(
          'ONLINE:',
          data
        );

        this.updateUserStatus(
          String(data.userId),
          true
        );

      }
    );


    this.socketService.onUserOffline(
      (data: any) => {

        console.log(
          'OFFLINE:',
          data
        );

        this.updateUserStatus(
          String(data.userId),
          false
        );

      }
    );


    this.socketService.onMessageDelivered(
      (data: any) => {

        console.log(
          'MESSAGE DELIVERED:',
          data
        );

        this.updateMessageStatus(
          String(data.messageId),
          String(data.status)
        );

      }
    );


    this.socketService.onMessageRead(
      (data: any) => {

        console.log(
          'MESSAGE READ:',
          data
        );

        this.updateMessageStatus(
          String(data.messageId),
          String(data.status)
        );

      }
    );

  }

  markMessagesAsRead(): void {

    if (
      !this.selectedMember ||
      !this.selectedMember.messages
    ) {
      return;
    }

    this.selectedMember.messages.forEach(
      (message: any) => {

        if (
          !this.isMyMessage(message) &&
          String(message.status)
            .toLowerCase() !== 'read'
        ) {

          this.socketService.markAsRead(
            String(message._id)
          );

        }

      }
    );

  }

  updateMessageStatus(
    messageId: string,
    status: string
  ): void {

    const id =
      String(messageId);

    const normalizedStatus =
      String(status).toLowerCase();

    this.roles.forEach(
      role => {

        role.members.forEach(
          (member: any) => {

            if (
              !member.messages
            ) {
              return;
            }

            member.messages.forEach(
              (msg: any) => {

                if (
                  String(msg._id) === id
                ) {

                  msg.status =
                    normalizedStatus;

                }

              }
            );

          }
        );

      }
    );


    if (
      this.selectedMember?.messages
    ) {

      this.selectedMember.messages.forEach(
        (msg: any) => {

          if (
            String(msg._id) === id
          ) {

            msg.status =
              normalizedStatus;

          }

        }
      );

    }

    this.cdr.detectChanges();

  }

}