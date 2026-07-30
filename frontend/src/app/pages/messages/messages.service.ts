import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {

  private roles = [
    {
      role: 'NGO',
      members: [
        {
          name: 'Rahul Sharma',
          messages: [{
               sender: 'Rahul Sharma',
              text: 'Hi! We need volunteers.',
              time: '10:30 AM'
}]
        },
        {
          name: 'Priya Patil',
          messages: [
            {
               sender: 'Priya Patil',
              text: 'Can you share the event location?',
              time: '10:55 AM'
}
          ]
        }
      ]
    },
    {
      role: 'Volunteer',
      members: [
        {
          name: 'Amit Kumar',
          messages: [
            {
               sender: 'Amit Kumar',
              text: 'I am available this weekend.',
              time: '02:55 PM'
            }
          ]
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
          messages: [
              {
               sender: 'Anjali Singh',
              text: 'Meeting is scheduled at 4 PM.',
              time: '03:00 PM'
            }

          ]
        }
      ]
    }
  ];

  constructor() {}

  getRoles(): Observable<any[]> {
    return of(this.roles);
  }

  sendMessage(member: any, message: string) {
    member.messages.push({
      sender: 'You',
      text: message,
      time: '03:50 PM'
    });
  }
}