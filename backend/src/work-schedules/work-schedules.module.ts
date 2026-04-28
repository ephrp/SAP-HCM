import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkSchedule } from './work-schedule.entity';
import { WorkSchedulesController } from './work-schedules.controller';
import { WorkSchedulesService } from './work-schedules.service';
import { Employee } from '../employees/employee.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkSchedule, Employee]),
    AuditLogsModule,
  ],
  controllers: [WorkSchedulesController],
  providers: [WorkSchedulesService],
  exports: [WorkSchedulesService],
})
export class WorkSchedulesModule {}