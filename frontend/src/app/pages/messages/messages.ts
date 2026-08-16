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

  // Current logged-in user
  currentUserId = '';
  currentUserRole = '';

  @ViewChild('messagesContainer')
  messagesContainer!: ElementRef;

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

    // Connect socket
    this.socketService.connect();

    // Register socket events
    this.registerSocketEvents();

    // Load users
    this.loadUsers();
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

        console.log('API Response:', data);

        // Volunteer can message only Admin and NGO
        if (this.currentUserRole === 'Volunteer') {
          data = data.filter(role =>
            role.role === 'Admin' || role.role === 'NGO'
          );
        }

        // Admin should not see Admin role
        if (this.currentUserRole === 'Admin') {
          data = data.filter(role =>
            role.role !== 'Admin'
          );
        }

        // NGO should not see NGO role
        if (this.currentUserRole === 'NGO') {
          data = data.filter(role =>
            role.role !== 'NGO'
          );
        }

        this.roles = data;

        this.cdr.detectChanges();


        // =====================================================
        // OPEN CHAT REQUESTED FROM AN OPPORTUNITY
        // =====================================================

        const lastChatUserId = localStorage.getItem('lastChatUser');

        if (lastChatUserId) {

          let targetMember: any = null;

          // Find the opportunity creator inside Admin/NGO users
          for (const role of this.roles) {

            const member = role.members?.find(
              (m: any) =>
                String(m._id) === String(lastChatUserId)
            );

            if (member) {
              targetMember = member;
              break;
            }

          }


          if (targetMember) {

            console.log(
              'Opening requested chat:',
              targetMember
            );

            // IMPORTANT:
            // Use targetMember, not member
            this.selectedMember = targetMember;

            localStorage.setItem(
              'lastChatUser',
              targetMember._id
            );

            // Immediately update UI
            this.cdr.detectChanges();


            // Load the specific conversation
            this.messageService
              .getConversation(targetMember._id)
              .subscribe({

                next: (res: any) => {

                  this.selectedMember.messages =
                    res.data || [];

                  console.log(
                    'Automatically loaded conversation:',
                    this.selectedMember.messages
                  );

                  // Refresh UI
                  this.cdr.detectChanges();

                  // Mark messages as read
                  this.markMessagesAsRead();

                  // Scroll to latest message
                  this.scrollToBottom();

                },

                error: (err) => {

                  console.error(
                    'Failed to load requested conversation:',
                    err
                  );

                }

              });


            // Remove the temporary navigation value
            localStorage.removeItem('lastChatUser');

          } else {

            console.warn(
              'Requested chat user was not found:',
              lastChatUserId
            );

            localStorage.removeItem('lastChatUser');
          }

        }


        // =====================================================
        // LOAD CONVERSATIONS FOR ALL USERS
        // =====================================================

        this.roles.forEach((role: any) => {

          role.members.forEach((member: any) => {

            this.messageService
              .getConversation(member._id)
              .subscribe({

                next: (res: any) => {

                  console.log(
                    member.username,
                    res.data
                  );

                  member.messages =
                    res.data || [];


                  // Sort users by latest message
                  role.members.sort(
                    (a: any, b: any) => {

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

                },

                error: () => {

                  member.messages = [];

                }

              });

          });

        });


        console.log(
          'Users by role:',
          this.roles
        );

      },

      error: (err) => {

        console.error(
          'Error loading users:',
          err
        );

      }

    });

  }


  // =========================
  // SELECT MEMBER
  // =========================

  selectMember(member: any): void {

    console.log(
      'Selected Member:',
      member
    );

    this.selectedMember = member;

    localStorage.setItem(
      'lastChatUser',
      member._id
    );

    // Immediately update chat panel
    this.cdr.detectChanges();


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

          // Force UI update
          this.cdr.detectChanges();

          // Mark messages as read
          this.markMessagesAsRead();

          // Scroll to bottom
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


  // =========================
  // TOGGLE ROLE
  // =========================

  toggleRole(roleName: string): void {

    this.expandedRole =
      this.expandedRole === roleName
        ? ''
        : roleName;

  }


  getUnreadCount(member: any): number {

    console.log(
      member.username,
      member.messages
    );

    if (!member.messages) {
      return 0;
    }

    const count =
      member.messages.filter(
        (message: any) =>
          !this.isMyMessage(message) &&
          message.status !== 'read'
      ).length;

    console.log(
      'Unread Count:',
      member.username,
      count
    );

    return count;

  }


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


  // =========================
  // SEND MESSAGE
  // =========================

  sendMessage(): void {

    if (
      !this.selectedMember ||
      !this.newMessage.trim()
    ) {
      return;
    }

    const text =
      this.newMessage.trim();

    // Clear input immediately
    this.newMessage = '';

    this.messageService
      .sendMessage(
        this.selectedMember._id,
        text
      )
      .subscribe({

        next: () => {

          this.messageService
            .getConversation(
              this.selectedMember._id
            )
            .subscribe({

              next: (res: any) => {

                const messages =
                  res.data || [];

                // Selected chat update
                this.selectedMember.messages =
                  [...messages];


                // Left side member list update
                this.roles.forEach(role => {

                  role.members.forEach(
                    (member: any) => {

                      if (
                        member._id ===
                        this.selectedMember._id
                      ) {

                        member.messages =
                          [...messages];

                      }

                    }
                  );

                });


                // UI refresh
                this.cdr.detectChanges();

                // Scroll latest message
                this.scrollToBottom();

              },

              error: (err) => {

                console.error(err);

              }

            });

        },

        error: (err) => {

          console.error(err);

        }

      });

  }


  // =========================
  // SEARCH
  // =========================

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

        // Search by role
        if (
          role.role &&
          role.role
            .toLowerCase()
            .includes(search)
        ) {

          return role;

        }


        // Search by username
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

    console.log(
      'Checking member:',
      member.username,
      member.online
    );

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


  // =========================
  // CHECK BLUE TICK
  // =========================

  isMessageRead(message: any): boolean {

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


  // =========================
  // SOCKET EVENTS
  // =========================

  registerSocketEvents(): void {

    this.socketService
      .onReceiveMessage(
        (message: any) => {

          console.log(
            'Receive Message:',
            message
          );


          this.roles.forEach(role => {

            role.members.forEach(
              (member: any) => {

                const senderId =
                  message.senderId?._id ||
                  message.senderId;

                if (
                  member._id === senderId
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

          });


          if (
            this.selectedMember &&
            this.selectedMember._id ===
              (
                message.senderId?._id ||
                message.senderId
              )
          ) {

            if (
              !this.selectedMember.messages
            ) {

              this.selectedMember.messages = [];

            }

            this.selectedMember.messages = [
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

          console.log(
            'ONLINE',
            data
          );

          this.updateUserStatus(
            data.userId,
            true
          );

        }
      );


    this.socketService
      .onUserOffline(
        (data: any) => {

          console.log(
            'OFFLINE',
            data
          );

          this.updateUserStatus(
            data.userId,
            false
          );

        }
      );


    this.socketService
      .onMessageDelivered(
        (data: any) => {

          console.log(
            'Delivered',
            data
          );

          this.updateMessageStatus(
            data.messageId,
            data.status
          );

        }
      );


    this.socketService
      .onMessageRead(
        (data: any) => {

          console.log(
            'Read',
            data
          );

          this.updateMessageStatus(
            data.messageId,
            data.status
          );

        }
      );

  }


  // =========================
  // MARK AS READ
  // =========================

  markMessagesAsRead(): void {

    if (!this.selectedMember) {
      return;
    }

    this.selectedMember.messages
      .forEach((message: any) => {

        if (
          !this.isMyMessage(message) &&
          message.status !== 'read'
        ) {

          this.socketService
            .markAsRead(
              message._id
            );

        }

      });

  }


  updateMessageStatus(
    messageId: string,
    status: string
  ): void {

    this.roles.forEach(role => {

      role.members.forEach(
        (member: any) => {

          if (!member.messages) {
            return;
          }

          member.messages.forEach(
            (msg: any) => {

              if (
                msg._id === messageId
              ) {

                msg.status = status;

              }

            }
          );

        }
      );

    });


    if (!this.selectedMember) {
      return;
    }

    this.selectedMember.messages
      .forEach((msg: any) => {

        if (
          msg._id === messageId
        ) {

          msg.status = status;

        }

      });

  }

}