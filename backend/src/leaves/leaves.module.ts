import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';
import { LeaveRequest } from './leave-request.entity';
import { Employee } from '../employees/employee.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveRequest, Employee, User])],
  controllers: [LeavesController],
  providers: [LeavesService],
  exports: [TypeOrmModule],
})
export class LeavesModule {}
