import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { Employee } from './employee.entity';
import { Department } from '../departments/department.entity';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module'; // 🔥 AJOUT

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, Department]),
    UsersModule,
    MailModule,
    AuditLogsModule, // 🔥 IMPORTANT
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [TypeOrmModule, EmployeesService],
})
export class EmployeesModule {}