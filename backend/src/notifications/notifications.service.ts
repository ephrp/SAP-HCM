import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { User } from '../users/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async createNotification(params: {
    user: User;
    title: string;
    message: string;
    type: NotificationType;
  }) {
    const notif = this.repo.create({
      user: params.user,
      title: params.title,
      message: params.message,
      type: params.type,
      isRead: false,
    });

    return this.repo.save(notif);
  }

  async getUserNotifications(userId: number) {
    return this.repo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async markAsRead(id: number, userId: number) {
    const notif = await this.repo.findOne({
      where: {
        id,
        user: { id: userId },
      },
    });

    if (!notif) return null;

    notif.isRead = true;
    return this.repo.save(notif);
  }

  async markAllAsRead(userId: number) {
    await this.repo.update(
      {
        user: { id: userId },
        isRead: false,
      },
      {
        isRead: true,
      },
    );

    return { message: 'All notifications marked as read' };
  }
}