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

  activeTab: 'profile' | 'password' = 'profile';

  selectedFile!: File;

  previewImage: string | ArrayBuffer | null = null;

  profileImage = '';

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

  onFileSelected(event: any) {

    if (event.target.files.length > 0) {

      this.selectedFile = event.target.files[0];

      const reader = new FileReader();

      reader.onload = () => {
        this.previewImage = reader.result;
      };

      reader.readAsDataURL(this.selectedFile);
    }
  }

  uploadImage() {

    if (!this.selectedFile) {
      alert('Please select an image first.');
      return;
    }

    alert('Image selected successfully.');

    console.log(this.selectedFile);
  }

  updatePassword() {
    alert('Password Updated Successfully!');
  }

}