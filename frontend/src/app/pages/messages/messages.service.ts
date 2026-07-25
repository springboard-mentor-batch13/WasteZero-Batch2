import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {

  private apiUrl = 'http://localhost:5000/api/messages';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  getUsersByRole(): Observable<any[]> {
    return this.http
      .get<any>(`${this.apiUrl}/users`, this.getHeaders())
      .pipe(
        map(res => [
          {
            role: 'Admin',
            members: res.data.admins.map((user: any) => ({
              _id: user._id,
              fullName: user.fullName,
              role: user.role,
              messages: []
            }))
          },
          {
            role: 'NGO',
            members: res.data.ngos.map((user: any) => ({
              _id: user._id,
              fullName: user.fullName,
              role: user.role,
              messages: []
            }))
          },
          {
            role: 'Volunteer',
            members: res.data.volunteers.map((user: any) => ({
              _id: user._id,
              fullName: user.fullName,
              role: user.role,
              messages: []
            }))
          }
        ])
      );
  }

  getConversation(userId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/conversation/${userId}`,
      this.getHeaders()
    );
  }

  sendMessage(receiverId: string, content: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/send`,
      {
        receiverId,
        content
      },
      this.getHeaders()
    );
  }
}