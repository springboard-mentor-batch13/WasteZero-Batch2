import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.css'
})
export class MyProfile {

   // Active Tab
  activeTab: 'profile' | 'password' = 'profile';

  user = {
    fullName: '',
    email: '',
    location: '',
    skills: '',
    bio: ''
  };

  saveProfile() {
    console.log(this.user);
    alert('Profile Saved Successfully!');
  }

  updatePassword() {
  alert('Password Updated Successfully!');
}
}