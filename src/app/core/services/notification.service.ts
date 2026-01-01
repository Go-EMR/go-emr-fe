import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
  data?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly API_URL = `${environment.apiUrl}/notifications`;
  
  private readonly _notifications = signal<Notification[]>([]);
  
  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = computed(() => 
    this._notifications().filter(n => !n.read).length
  );
  
  constructor(private readonly http: HttpClient) {}
  
  loadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.API_URL).pipe(
      tap(notifications => this._notifications.set(notifications))
    );
  }
  
  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/${id}/read`, {}).pipe(
      tap(() => {
        this._notifications.update(notifications =>
          notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          )
        );
      })
    );
  }
  
  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.API_URL}/read-all`, {}).pipe(
      tap(() => {
        this._notifications.update(notifications =>
          notifications.map(n => ({ ...n, read: true }))
        );
      })
    );
  }
  
  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => {
        this._notifications.update(notifications =>
          notifications.filter(n => n.id !== id)
        );
      })
    );
  }
  
  // Add notification locally (for real-time updates via WebSocket/NATS)
  addNotification(notification: Notification): void {
    this._notifications.update(notifications => [notification, ...notifications]);
  }
}
