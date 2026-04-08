import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';
import { LeaveRequest } from './leave-request.entity';
import { Employee } from '../employees/employee.entity';
import { Department } from '../departments/department.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveRequest, Employee, Department])],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [TypeOrmModule, LeavesService],
})
export class LeavesModule {}
