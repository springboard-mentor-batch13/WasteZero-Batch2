import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';

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
    private socketService: SocketService,
    private cdr: ChangeDetectorRef
  ) {}

  roles: any[] = [];

  selectedMember: any = null;

  newMessage = '';

  searchText = '';

  expandedRole = '';

  // ============================================================
  // CURRENT USER
  // ============================================================

  currentUserId = '';
  currentUserRole = '';

  @ViewChild('messagesContainer')
  messagesContainer!: ElementRef;


  // ============================================================
  // MESSAGE REQUEST STATE
  // ============================================================

  conversationStatus:
    | 'NONE'
    | 'PENDING'
    | 'ACCEPTED'
    | 'BLOCKED'
    | '' = '';

  conversationRequest: any = null;

  requestLoading = false;

  requestError = '';

  // ============================================================
  // INITIALIZATION
  // ============================================================

  ngOnInit(): void {

    const user = localStorage.getItem('user');

    if (user) {

      try {

        const userData = JSON.parse(user);

        this.currentUserId =
          userData.id ||
          userData._id ||
          '';

        this.currentUserRole =
          userData.role ||
          '';

      } catch (error) {

        console.error(
          'Invalid user data:',
          error
        );

      }

    }

    // Connect socket
    this.socketService.connect();

    // Register socket events
    this.registerSocketEvents();

    // Load users
    this.loadUsers();
  }


  // ============================================================
  // USER STATUS
  // ============================================================

  updateUserStatus(
    userId: string,
    online: boolean
  ): void {

    this.roles.forEach(role => {

      role.members.forEach((member: any) => {

        if (
          String(member._id) ===
          String(userId)
        ) {

          member.online = online;

          if (
            this.selectedMember?._id ===
            userId
          ) {

            this.selectedMember.online =
              online;
          }

        }

      });

    });

    this.cdr.detectChanges();
  }


  // ============================================================
  // LOAD USERS
  // ============================================================

  loadUsers(): void {

    this.messageService
      .getUsersByRole()
      .subscribe({

        next: (data: any[]) => {

          // Volunteer → Admin + NGO
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

          // Admin cannot message Admin
          if (
            this.currentUserRole ===
            'Admin'
          ) {

            data = data.filter(
              role =>
                role.role !== 'Admin'
            );
          }

          // NGO cannot message NGO
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

          this.cdr.detectChanges();


          // ====================================================
          // OPEN CHAT REQUESTED FROM OPPORTUNITY
          // ====================================================

          const lastChatUserId =
            localStorage.getItem(
              'lastChatUser'
            );

          if (lastChatUserId) {

            let targetMember: any = null;

            for (
              const role of this.roles
            ) {

              const member =
                role.members?.find(
                  (m: any) =>
                    String(m._id) ===
                    String(lastChatUserId)
                );

              if (member) {

                targetMember =
                  member;

                break;
              }
            }

            if (targetMember) {

              this.selectMember(
                targetMember
              );

            } else {

              localStorage.removeItem(
                'lastChatUser'
              );
            }
          }


          // ====================================================
          // LOAD EXISTING CONVERSATIONS
          // ====================================================

          this.roles.forEach(
            (role: any) => {

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

                        // Don't overwrite a
                        // currently selected chat
                        if (
                          this.selectedMember &&
                          String(
                            this.selectedMember._id
                          ) ===
                          String(member._id)
                        ) {

                          this.selectedMember.messages =
                            res.data || [];
                        }

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

                            return bTime - aTime;
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


  // ============================================================
  // SELECT MEMBER
  // ============================================================

  selectMember(
    member: any
  ): void {

    if (!member) {
      return;
    }

    this.selectedMember =
      member;

    localStorage.setItem(
      'lastChatUser',
      member._id
    );

    this.newMessage = '';

    this.conversationStatus = '';

    this.conversationRequest = null;

    this.requestError = '';

    this.cdr.detectChanges();

    // Check relationship first
    this.checkConversationStatus(
      member
    );
  }


  // ============================================================
  // CHECK CONVERSATION STATUS
  // ============================================================

  checkConversationStatus(
    member: any
  ): void {

    this.requestLoading = true;

    this.messageService
      .getConversationStatus(
        member._id
      )
      .subscribe({

        next: (res: any) => {

          this.requestLoading = false;

          if (
            !res.exists ||
            !res.data
          ) {

            this.conversationStatus =
              'NONE';

            this.conversationRequest =
              null;

            this.cdr.detectChanges();

            /*
             * We do NOT automatically create
             * the request.
             *
             * The sender must confirm first.
             */
            this.askToStartConversation();

            return;
          }

          const request =
            res.data;

          this.conversationRequest =
            request;

          this.conversationStatus =
            request.status;

          this.cdr.detectChanges();

          // Load conversation
          this.loadSelectedConversation();

        },

        error: (err) => {

          this.requestLoading = false;

          console.error(
            'Failed to check conversation status:',
            err
          );

          this.requestError =
            err.error?.message ||
            'Unable to check conversation status.';

          this.cdr.detectChanges();
        }

      });
  }


  // ============================================================
  // FIRST CONTACT CONFIRMATION
  // ============================================================

  askToStartConversation(): void {

    if (!this.selectedMember) {
      return;
    }

    const name =
      this.selectedMember.username ||
      this.selectedMember.fullName ||
      'this user';

    const confirmed =
      window.confirm(
        `You are about to start a conversation with ${name}.\n\n` +
        `Messages are end-to-end encrypted.\n\n` +
        `Do you want to send a message request?`
      );

    if (!confirmed) {

      this.conversationStatus =
        'NONE';

      this.cdr.detectChanges();

      return;
    }

    this.createConversationRequest();
  }


  // ============================================================
  // CREATE MESSAGE REQUEST
  // ============================================================

  createConversationRequest(): void {

    if (
      !this.selectedMember ||
      this.requestLoading
    ) {
      return;
    }

    this.requestLoading = true;

    this.messageService
      .createMessageRequest(
        this.selectedMember._id
      )
      .subscribe({

        next: (res: any) => {

          this.requestLoading = false;

          this.conversationRequest =
            res.data;

          this.conversationStatus =
            res.data?.status ||
            'PENDING';

          this.cdr.detectChanges();
        },

        error: (err) => {

          this.requestLoading = false;

          console.error(
            'Failed to create message request:',
            err
          );

          this.requestError =
            err.error?.message ||
            'Unable to send message request.';

          this.cdr.detectChanges();
        }

      });
  }


  // ============================================================
  // LOAD SELECTED CONVERSATION
  // ============================================================

  loadSelectedConversation(): void {

    if (!this.selectedMember) {
      return;
    }

    this.messageService
      .getConversation(
        this.selectedMember._id
      )
      .subscribe({

        next: (res: any) => {

          if (!this.selectedMember) {
            return;
          }

          this.selectedMember.messages =
            res.data || [];

          // Keep left panel synchronized
          this.roles.forEach(
            role => {

              role.members.forEach(
                (member: any) => {

                  if (
                    String(member._id) ===
                    String(
                      this.selectedMember._id
                    )
                  ) {

                    member.messages =
                      [
                        ...(
                          res.data || []
                        )
                      ];
                  }

                }
              );

            }
          );

          this.cdr.detectChanges();

          this.markMessagesAsRead();

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


  // ============================================================
  // ACCEPT REQUEST
  // ============================================================

  acceptRequest(): void {

    if (
      !this.conversationRequest?._id ||
      this.requestLoading
    ) {
      return;
    }

    this.requestLoading = true;

    this.messageService
      .acceptMessageRequest(
        this.conversationRequest._id
      )
      .subscribe({

        next: (res: any) => {

          this.requestLoading = false;

          this.conversationRequest =
            res.data;

          this.conversationStatus =
            'ACCEPTED';

          this.cdr.detectChanges();

          this.loadSelectedConversation();
        },

        error: (err) => {

          this.requestLoading = false;

          console.error(
            'Accept request error:',
            err
          );

          this.requestError =
            err.error?.message ||
            'Unable to accept message request.';

          this.cdr.detectChanges();
        }

      });
  }


  // ============================================================
  // BLOCK USER
  // ============================================================

  blockSelectedUser(): void {

    if (
      !this.conversationRequest?._id ||
      this.requestLoading
    ) {
      return;
    }

    const name =
      this.selectedMember?.username ||
      this.selectedMember?.fullName ||
      'this user';

    const confirmed =
      window.confirm(
        `Block ${name}?\n\n` +
        `This user will not be able to notify you with new messages until you unblock them.`
      );

    if (!confirmed) {
      return;
    }

    this.requestLoading = true;

    this.messageService
      .blockUser(
        this.conversationRequest._id
      )
      .subscribe({

        next: (res: any) => {

          this.requestLoading = false;

          this.conversationRequest =
            res.data;

          this.conversationStatus =
            'BLOCKED';

          this.cdr.detectChanges();
        },

        error: (err) => {

          this.requestLoading = false;

          console.error(
            'Block user error:',
            err
          );

          this.requestError =
            err.error?.message ||
            'Unable to block user.';

          this.cdr.detectChanges();
        }

      });
  }


  // ============================================================
  // UNBLOCK USER
  // ============================================================

  unblockSelectedUser(): void {

    if (
      !this.conversationRequest?._id ||
      this.requestLoading
    ) {
      return;
    }

    this.requestLoading = true;

    this.messageService
      .unblockUser(
        this.conversationRequest._id
      )
      .subscribe({

        next: (res: any) => {

          this.requestLoading = false;

          this.conversationRequest =
            res.data;

          this.conversationStatus =
            res.data?.status ||
            'ACCEPTED';

          this.cdr.detectChanges();

          this.loadSelectedConversation();
        },

        error: (err) => {

          this.requestLoading = false;

          console.error(
            'Unblock user error:',
            err
          );

          this.requestError =
            err.error?.message ||
            'Unable to unblock user.';

          this.cdr.detectChanges();
        }

      });
  }


  // ============================================================
  // SEND MESSAGE
  // ============================================================

  sendMessage(): void {

    if (
      !this.selectedMember ||
      !this.newMessage.trim()
    ) {
      return;
    }

    /*
     * Do not allow the recipient of a
     * pending request to send.
     */

    if (
      this.conversationStatus ===
      'PENDING'
    ) {

      const senderId =
        this.conversationRequest
          ?.senderId?._id ||
        this.conversationRequest
          ?.senderId;

      if (
        String(senderId) !==
        String(this.currentUserId)
      ) {

        return;
      }
    }


    /*
     * Blocker cannot send while blocked.
     */

    if (
      this.conversationStatus ===
      'BLOCKED'
    ) {

      const blockedBy =
        this.conversationRequest
          ?.blockedBy?._id ||
        this.conversationRequest
          ?.blockedBy;

      if (
        String(blockedBy) ===
        String(this.currentUserId)
      ) {

        return;
      }
    }


    const text =
      this.newMessage.trim();

    this.newMessage = '';

    this.messageService
      .sendMessage(
        this.selectedMember._id,
        text
      )
      .subscribe({

        next: () => {

          this.loadSelectedConversation();

        },

        error: (err) => {

          console.error(
            'Send message error:',
            err
          );

          // Restore message if backend rejected it
          this.newMessage =
            text;

          alert(
            err.error?.message ||
            'Unable to send message.'
          );

          this.cdr.detectChanges();
        }

      });
  }


  // ============================================================
  // SEARCH
  // ============================================================

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
                  (
                    member.username ||
                    ''
                  )
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


  // ============================================================
  // ROLE
  // ============================================================

  toggleRole(
    roleName: string
  ): void {

    this.expandedRole =
      this.expandedRole ===
      roleName
        ? ''
        : roleName;
  }


  // ============================================================
  // UNREAD
  // ============================================================

  getUnreadCount(
    member: any
  ): number {

    if (!member?.messages) {
      return 0;
    }

    return member.messages.filter(
      (message: any) =>
        !this.isMyMessage(message) &&
        message.status !== 'read'
    ).length;
  }


  // ============================================================
  // LAST MESSAGE
  // ============================================================

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

    if (isNaN(date.getTime())) {
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


  // ============================================================
  // MESSAGE CHECK
  // ============================================================

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


  // ============================================================
  // ONLINE STATUS
  // ============================================================

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


  // ============================================================
  // MESSAGE TICKS
  // ============================================================

  getMessageTick(
    message: any
  ): string {

    if (!this.isMyMessage(message)) {
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


  // ============================================================
  // SOCKET EVENTS
  // ============================================================

  registerSocketEvents(): void {

    this.socketService
      .onReceiveMessage(
        (message: any) => {

          console.log(
            'Receive Message:',
            message
          );

          const senderId =
            message.senderId?._id ||
            message.senderId;

          this.roles.forEach(
            role => {

              role.members.forEach(
                (member: any) => {

                  if (
                    String(member._id) ===
                    String(senderId)
                  ) {

                    if (!member.messages) {
                      member.messages = [];
                    }

                    member.messages.push(
                      message
                    );
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

            this.selectedMember.messages =
              [
                ...this.selectedMember.messages,
                message
              ];

            this.cdr.detectChanges();

            this.scrollToBottom();

            this.markMessagesAsRead();
          }

        }
      );


    this.socketService
      .onUserOnline(
        (data: any) => {

          this.updateUserStatus(
            data.userId,
            true
          );

        }
      );


    this.socketService
      .onUserOffline(
        (data: any) => {

          this.updateUserStatus(
            data.userId,
            false
          );

        }
      );


    this.socketService
      .onMessageDelivered(
        (data: any) => {

          this.updateMessageStatus(
            data.messageId,
            data.status
          );

        }
      );


    this.socketService
      .onMessageRead(
        (data: any) => {

          this.updateMessageStatus(
            data.messageId,
            data.status
          );

        }
      );

  }


  // ============================================================
  // MARK READ
  // ============================================================

  markMessagesAsRead(): void {

    if (!this.selectedMember) {
      return;
    }

    this.selectedMember.messages
      ?.forEach(
        (message: any) => {

          if (
            !this.isMyMessage(message) &&
            message.status !== 'read'
          ) {

            this.socketService
              .markAsRead(
                message._id
              );

          }

        }
      );
  }


  // ============================================================
  // UPDATE MESSAGE STATUS
  // ============================================================

  updateMessageStatus(
    messageId: string,
    status: string
  ): void {

    this.roles.forEach(
      role => {

        role.members.forEach(
          (member: any) => {

            if (!member.messages) {
              return;
            }

            member.messages.forEach(
              (msg: any) => {

                if (
                  msg._id ===
                  messageId
                ) {

                  msg.status =
                    status;
                }

              }
            );

          }
        );

      }
    );


    if (!this.selectedMember) {
      return;
    }

    this.selectedMember.messages
      ?.forEach(
        (msg: any) => {

          if (
            msg._id ===
            messageId
          ) {

            msg.status =
              status;
          }

        }
      );

    this.cdr.detectChanges();
  }


  // ============================================================
  // SCROLL
  // ============================================================

  scrollToBottom(): void {

    setTimeout(() => {

      if (this.messagesContainer) {

        const element =
          this.messagesContainer.nativeElement;

        element.scrollTop =
          element.scrollHeight;
      }

    }, 100);
  }


  // ============================================================
  // UI HELPERS
  // ============================================================

  isPendingRecipient(): boolean {

    if (
      this.conversationStatus !==
      'PENDING'
    ) {
      return false;
    }

    const senderId =
      this.conversationRequest
        ?.senderId?._id ||
      this.conversationRequest
        ?.senderId;

    return (
      String(senderId) !==
      String(this.currentUserId)
    );
  }


  isPendingSender(): boolean {

    if (
      this.conversationStatus !==
      'PENDING'
    ) {
      return false;
    }

    const senderId =
      this.conversationRequest
        ?.senderId?._id ||
      this.conversationRequest
        ?.senderId;

    return (
      String(senderId) ===
      String(this.currentUserId)
    );
  }


  isCurrentUserBlocker(): boolean {

    if (
      this.conversationStatus !==
      'BLOCKED'
    ) {
      return false;
    }

    const blockedBy =
      this.conversationRequest
        ?.blockedBy?._id ||
      this.conversationRequest
        ?.blockedBy;

    return (
      String(blockedBy) ===
      String(this.currentUserId)
    );
  }


  isCurrentUserBlocked(): boolean {

    if (
      this.conversationStatus !==
      'BLOCKED'
    ) {
      return false;
    }

    return !this.isCurrentUserBlocker();
  }
}