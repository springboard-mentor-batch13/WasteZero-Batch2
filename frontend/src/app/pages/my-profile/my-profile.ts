import { Component, OnInit } from '@angular/core';
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
export class MyProfile implements OnInit {

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


  password = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };


  ngOnInit() {

    this.loadProfile();

  }



  getHeaders() {

    const token = localStorage.getItem('token');

    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });

  }



  // Fetch profile from database
  loadProfile() {

    this.http.get(
      'http://localhost:5000/api/profile',
      { headers: this.getHeaders() }
    ).subscribe({

      next: (response: any) => {

        console.log('Profile Loaded:', response);


        this.user = {

          fullName: response.data.fullName || '',

          email: response.data.email || '',

          location: response.data.location || '',

          skills: response.data.skills || '',

          bio: response.data.bio || ''

        };

      },


      error: (error) => {

        console.error(error);

      }

    });

  }



  // Update profile
  saveProfile() {


    const body = {

      fullName: this.user.fullName,

      location: this.user.location,

      skills: this.user.skills,

      bio: this.user.bio

    };


    this.http.put(
      'http://localhost:5000/api/profile',
      body,
      { headers: this.getHeaders() }
    ).subscribe({


      next: (response:any) => {


        console.log('Profile Updated:', response);


        this.user = {

          fullName: response.data.fullName || '',

          email: response.data.email || '',

          location: response.data.location || '',

          skills: response.data.skills || '',

          bio: response.data.bio || ''

        };


        alert('Profile Updated Successfully!');


      },


      error: (error) => {


        console.error(error);

        alert('Failed to update profile.');


      }


    });


  }





  // Change password
  updatePassword() {


    this.http.put(
      'http://localhost:5000/api/profile/change-password',
      this.password,
      { headers: this.getHeaders() }
    ).subscribe({


      next: () => {


        alert('Password Updated Successfully!');


        this.password = {

          currentPassword: '',

          newPassword: '',

          confirmPassword: ''

        };


      },


      error: (error) => {


        console.error(error);


        alert(

          error.error?.message ||

          'Password update failed'

        );


      }


    });


  }





  onFileSelected(event:any) {


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


  }


}