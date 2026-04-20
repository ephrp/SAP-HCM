import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Employee } from '../employees/employee.entity';
import { LeaveRequest } from '../leaves/leave-request.entity';
import { Training } from '../trainings/training.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, LeaveRequest, Training])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}