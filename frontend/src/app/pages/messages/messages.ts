import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages.html',
  styleUrl: './messages.css'
})
export class Messages {

  roles = [
    {
      role: 'NGO',
      members: [
        {
          name: 'Rahul Sharma',
          messages: []
        },
        {
          name: 'Priya Patil',
          messages: []
        }
      ]
    },
    {
      role: 'Volunteer',
      members: [
        {
          name: 'Amit Kumar',
          messages: []
        },
        {
          name: 'Sneha Patil',
          messages: []
        }
      ]
    },
    {
      role: 'Admin',
      members: [
        {
          name: 'Rohit Verma',
          messages: []
        },
        {
          name: 'Anjali Singh',
          messages: []
        }
      ]
    }
  ];

  // Selected member
  selectedMember: any = null;

  // Message input
  newMessage = '';

  // Search input
  searchText = '';

  // Expanded role
  expandedRole = '';

  // Select member
  selectMember(member: any) {
    this.selectedMember = member;
  }

  // Expand / Collapse Role
  toggleRole(roleName: string) {
    if (this.expandedRole === roleName) {
      this.expandedRole = '';
    } else {
      this.expandedRole = roleName;
    }
  }

  // Search members
  getFilteredMembers(members: any[]) {
    if (!this.searchText.trim()) {
      return members;
    }

    return members.filter(member =>
      member.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  // Send message
  sendMessage() {

    if (!this.selectedMember) {
      return;
    }

    if (!this.newMessage.trim()) {
      return;
    }

    this.selectedMember.messages.push({
      sender: 'You',
      text: this.newMessage
    });

    this.newMessage = '';
  }

 getFilteredRoles() {
  const search = this.searchText.trim().toLowerCase();

  if (!search) {
    return this.roles;
  }

  return this.roles
    .map(role => {

      // Agar role match hua (NGO, Volunteer, Admin)
      if (role.role.toLowerCase().includes(search)) {
        return role; // Saare members dikhao
      }

      // Agar member match hua
      return {
        ...role,
        members: role.members.filter(member =>
          member.name.toLowerCase().includes(search)
        )
      };
    })
    .filter(role => role.members.length > 0);
}

}