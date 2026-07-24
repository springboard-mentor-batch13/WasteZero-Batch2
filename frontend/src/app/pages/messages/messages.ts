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

  ngOnInit(): void {
    this.messageService.getRoles().subscribe(data => {
      this.roles = data;
    });
  }

  selectMember(member: any) {
    this.selectedMember = member;
  }

  toggleRole(roleName: string) {
    this.expandedRole =
      this.expandedRole === roleName ? '' : roleName;
  }

  sendMessage() {

    if (!this.selectedMember || !this.newMessage.trim()) {
      return;
    }

    this.messageService.sendMessage(
      this.selectedMember,
      this.newMessage
    );

    this.newMessage = '';
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
            member.name.toLowerCase().includes(search)
          )
        };

      })
      .filter(role => role.members.length > 0);
  }

}