import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.css'
})
export class MyProfile {

   constructor(private http: HttpClient) {}

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

  const token = localStorage.getItem('token');

  if (!token) {
    alert('Please login again.');
    return;
  }

  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  });

  const body = {
    name: this.user.fullName,
    bio: this.user.bio,
    skills: this.user.skills,
    location: this.user.location
  };

  this.http.put(
    'http://localhost:5000/api/profile',
    body,
    { headers }
  ).subscribe({
    next: (response) => {
      console.log('Profile Updated:', response);
      alert('Profile Updated Successfully!');
    },
    error: (error) => {
      console.error('Update Error:', error);
      alert('Failed to update profile.');
    }
  });
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