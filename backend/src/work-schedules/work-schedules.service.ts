import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { WorkSchedule } from './work-schedule.entity';
import { Employee } from '../employees/employee.entity';
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-work-schedule.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class WorkSchedulesService {
  constructor(
    @InjectRepository(WorkSchedule)
    private readonly repo: Repository<WorkSchedule>,

    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,

    private readonly auditService: AuditLogsService,
  ) {}

  // 🔍 GET horaires d’un employé
  async getEmployeeSchedule(employeeId: number, currentUser: any) {
    await this.checkAccess(employeeId, currentUser);

    return this.repo.find({
      where: { employee: { id: employeeId } },
      order: { dayOfWeek: 'ASC' },
    });
  }

  // ➕ CREATE ou UPDATE
  async upsert(dto: CreateWorkScheduleDto, currentUser: any) {
    await this.checkAccess(dto.employeeId, currentUser);

    const employee = await this.employeeRepo.findOne({
      where: { id: dto.employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // validation logique
    if (dto.isWorkingDay) {
      if (!dto.startTime || !dto.endTime) {
        throw new BadRequestException(
          'startTime and endTime required for working day',
        );
      }

      if (dto.endTime <= dto.startTime) {
        throw new BadRequestException('endTime must be after startTime');
      }
    }

    let schedule = await this.repo.findOne({
  where: {
    employee: { id: dto.employeeId },
    dayOfWeek: dto.dayOfWeek,
  },
});

const isNewSchedule = !schedule;

if (!schedule) {
  schedule = this.repo.create({
    employee,
    dayOfWeek: dto.dayOfWeek,
  });
}

    schedule.isWorkingDay = dto.isWorkingDay;
    schedule.startTime = dto.isWorkingDay ? dto.startTime : null;
    schedule.endTime = dto.isWorkingDay ? dto.endTime : null;
    schedule.breakMinutes = dto.breakMinutes ?? 0;

    const saved = await this.repo.save(schedule);

    // 🧾 AUDIT LOG
    await this.auditService.createLog({
  action: isNewSchedule ? 'WORK_SCHEDULE_CREATED' : 'WORK_SCHEDULE_UPDATED',
  actorUserId: currentUser.userId,
  actorEmail: currentUser.email,
  targetType: 'Employee',
  targetId: employee.id,
  message: isNewSchedule
    ? `Horaire créé pour ${employee.firstName} ${employee.lastName}`
    : `Horaire modifié pour ${employee.firstName} ${employee.lastName}`,
  metadata: {
    dayOfWeek: dto.dayOfWeek,
    isWorkingDay: dto.isWorkingDay,
    startTime: dto.startTime ?? null,
    endTime: dto.endTime ?? null,
    breakMinutes: dto.breakMinutes ?? 0,
  },
});

    return saved;
  }

  // 🔐 ACCESS CONTROL
  private async checkAccess(employeeId: number, currentUser: any) {
    if (currentUser.role === 'HR_ADMIN') return;

    if (currentUser.role === 'EMPLOYEE') {
      if (currentUser.employeeId !== employeeId) {
        throw new BadRequestException('Access denied');
      }
      return;
    }

    if (currentUser.role === 'MANAGER') {
      const employee = await this.employeeRepo.findOne({
        where: { id: employeeId },
        relations: ['manager'],
      });

      if (!employee || employee.manager?.id !== currentUser.employeeId) {
        throw new BadRequestException('Access denied');
      }
    }
  }
}