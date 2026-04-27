import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingsController } from './trainings.controller';
import { TrainingsService } from './trainings.service';
import { Training } from './training.entity';
import { EmployeeTraining } from './employee-training.entity';
import { Employee } from '../employees/employee.entity';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
  TypeOrmModule.forFeature([Training, EmployeeTraining, Employee]),
  MailModule,
  NotificationsModule,
],
  controllers: [TrainingsController],
  providers: [TrainingsService],
  exports: [TrainingsService],
})
export class TrainingsModule {}