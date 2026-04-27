import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import {
  Notification,
  NotificationService,
} from './core/services/notification.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, DatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  showNotifications = false;

  private refreshInterval?: ReturnType<typeof setInterval>;

  constructor(
    private notifService: NotificationService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    if (this.authService.getToken()) {
      this.loadNotifications();

      this.refreshInterval = setInterval(() => {
        if (this.authService.getToken()) {
          this.loadNotifications();
        }
      }, 10000);
    }
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadNotifications(): void {
    this.notifService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.unreadCount = data.filter((n) => !n.isRead).length;
      },
      error: (err) => {
        console.error('Erreur chargement notifications', err);
      },
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;

    if (this.showNotifications && this.authService.getToken()) {
      this.loadNotifications();
    }
  }

  markAsRead(n: Notification): void {
    if (!n.isRead) {
      this.notifService.markAsRead(n.id).subscribe({
        next: () => {
          n.isRead = true;
          this.unreadCount = this.notifications.filter(
            (notif) => !notif.isRead,
          ).length;
        },
      });
    }
  }

  markAllAsRead(): void {
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => ({
          ...n,
          isRead: true,
        }));
        this.unreadCount = 0;
      },
    });
  }

  getNotificationIcon(type: string): string {
    if (type === 'LEAVE_CREATED') return '📝';
    if (type === 'LEAVE_APPROVED') return '✅';
    if (type === 'LEAVE_REJECTED') return '❌';
    if (type === 'TRAINING_ASSIGNED') return '🎓';
    if (type === 'TRAINING_COMPLETED') return '🏁';
    return '🔔';
  }
}