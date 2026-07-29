import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagesService } from './messages.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.html',
  styleUrl: './messages.css'
})
export class Messages implements OnInit {

  constructor(private messageService: MessagesService) {}

  roles: any[] = [];

  selectedMember: any = null;
  newMessage = '';
  searchText = '';
  expandedRole = '';

  // Current logged-in user id
  currentUserId = '';

  currentUserRole = '';

  ngOnInit(): void {

  // Get current user from localStorage
  const user = localStorage.getItem('user');

  if (user) {
    const userData = JSON.parse(user);

    console.log('User Object:', userData);

    this.currentUserId = userData.id;
    this.currentUserRole = userData.role;

    console.log('Current User ID:', this.currentUserId);
    console.log('Current User Role:', this.currentUserRole);
  }

  this.messageService.getUsersByRole().subscribe({
    next: (data: any[]) => {

      // Volunteer can message only Admin and NGO
      if (this.currentUserRole === 'Volunteer') {
        data = data.filter(role =>
          role.role === 'Admin' || role.role === 'NGO'
        );
      }

      this.roles = data;
    },
    error: (err) => {
      console.error('Error loading users:', err);
    }
  });
}
  selectMember(member: any) {
    this.selectedMember = member;

    this.messageService.getConversation(member._id).subscribe({
      next: (res: any) => {
        this.selectedMember.messages = res.data;
      },
      error: (err) => {
        console.error('Error loading conversation:', err);
      }
    });
  }

  toggleRole(roleName: string) {
    this.expandedRole =
      this.expandedRole === roleName ? '' : roleName;
  }

  sendMessage() {

    if (!this.selectedMember || !this.newMessage.trim()) {
      return;
    }

    this.messageService
      .sendMessage(this.selectedMember._id, this.newMessage)
      .subscribe({
        next: () => {

          this.messageService
            .getConversation(this.selectedMember._id)
            .subscribe({
              next: (res: any) => {
                
                this.selectedMember.messages = res.data;
              },
              error: (err) => {
                console.error(err);
              }
            });

          this.newMessage = '';
        },
        error: (err) => {
          console.error('Error sending message:', err);
        }
      });
  }

  getFilteredRoles() {

    const search = this.searchText.trim().toLowerCase();

    if (!search) {
      return this.roles;
    }

    return this.roles
      .map(role => {

        if (role.role.toLowerCase().includes(search)) {
          return role;
        }

        return {
          ...role,
          members: role.members.filter((member: any) =>
            member.fullName.toLowerCase().includes(search)
          )
        };

      })
      .filter(role => role.members.length > 0);
  }

  

}

