import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Training } from './training.entity';
import { EmployeeTraining } from './employee-training.entity';
import { Employee } from '../employees/employee.entity';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { AssignTrainingDto } from './dto/assign-training.dto';
import { UpdateEmployeeTrainingDto } from './dto/update-employee-training.dto';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

type CurrentUser = {
  userId: number;
  email: string;
  role: string;
  employeeId: number | null;
};

@Injectable()
export class TrainingsService {
  constructor(
    @InjectRepository(Training)
    private readonly repo: Repository<Training>,

    @InjectRepository(EmployeeTraining)
    private readonly employeeTrainingRepo: Repository<EmployeeTraining>,

    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,

    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAll(currentUser: CurrentUser) {
    if (currentUser.role === 'HR_ADMIN') {
      return this.repo.find({
        order: { id: 'DESC' },
      });
    }

    if (currentUser.role === 'MANAGER') {
      if (!currentUser.employeeId) {
        return [];
      }

      return this.repo.find({
        where: [
          { scope: 'GLOBAL' },
          { scope: 'TEAM', ownerManagerId: currentUser.employeeId },
        ],
        order: { id: 'DESC' },
      });
    }

    return [];
  }

  async findOne(id: number, currentUser: CurrentUser) {
    const training = await this.repo.findOneBy({ id });

    if (!training) {
      throw new NotFoundException('Training not found');
    }

    if (currentUser.role === 'HR_ADMIN') {
      return training;
    }

    if (currentUser.role === 'MANAGER') {
      if (
        training.scope === 'GLOBAL' ||
        training.ownerManagerId === currentUser.employeeId
      ) {
        return training;
      }

      throw new BadRequestException('Training not accessible');
    }

    throw new BadRequestException('Training not accessible');
  }

  async create(dto: CreateTrainingDto, currentUser: CurrentUser) {
    if (currentUser.role !== 'HR_ADMIN' && currentUser.role !== 'MANAGER') {
      throw new BadRequestException('Unauthorized action');
    }

    if (currentUser.role === 'MANAGER' && !currentUser.employeeId) {
      throw new BadRequestException('Manager profile is not linked');
    }

    const training = this.repo.create({
      title: dto.title,
      category: dto.category,
      provider: dto.provider,
      durationHours: dto.durationHours,
      level: dto.level,
      status: dto.status,
      startDate: dto.startDate,
      scope: currentUser.role === 'HR_ADMIN' ? 'GLOBAL' : 'TEAM',
      createdByRole: currentUser.role as 'HR_ADMIN' | 'MANAGER',
      createdByUserId: currentUser.userId,
      ownerManagerId:
        currentUser.role === 'MANAGER'
          ? (currentUser.employeeId ?? undefined)
          : undefined,
    });

    const savedTraining = await this.repo.save(training);

    await this.auditLogsService.createLog({
      action: 'TRAINING_CREATED',
      actorUserId: currentUser.userId,
      actorEmail: currentUser.email,
      targetType: 'Training',
      targetId: savedTraining.id,
      message: `Formation créée : ${savedTraining.title}`,
      metadata: {
        title: savedTraining.title,
        category: savedTraining.category,
        provider: savedTraining.provider,
        durationHours: savedTraining.durationHours,
        level: savedTraining.level,
        status: savedTraining.status,
        startDate: savedTraining.startDate,
        scope: savedTraining.scope,
        createdByRole: savedTraining.createdByRole,
        ownerManagerId: savedTraining.ownerManagerId ?? null,
      },
    });

    return savedTraining;
  }

  async update(id: number, dto: UpdateTrainingDto, currentUser: CurrentUser) {
    const training = await this.findOne(id, currentUser);

    if (
      currentUser.role === 'MANAGER' &&
      training.ownerManagerId !== currentUser.employeeId
    ) {
      throw new BadRequestException(
        'You can only update trainings created for your team',
      );
    }

    Object.assign(training, {
      title: dto.title ?? training.title,
      category: dto.category ?? training.category,
      provider: dto.provider ?? training.provider,
      durationHours: dto.durationHours ?? training.durationHours,
      level: dto.level ?? training.level,
      status: dto.status ?? training.status,
      startDate: dto.startDate ?? training.startDate,
    });

    return this.repo.save(training);
  }

  async remove(id: number, currentUser: CurrentUser) {
    const training = await this.findOne(id, currentUser);

    if (
      currentUser.role === 'MANAGER' &&
      training.ownerManagerId !== currentUser.employeeId
    ) {
      throw new BadRequestException(
        'You can only delete trainings created for your team',
      );
    }

    await this.repo.remove(training);
    return { message: 'Training deleted successfully' };
  }

  async getAssignableEmployees(currentUser: CurrentUser) {
    if (currentUser.role === 'HR_ADMIN') {
      return this.employeeRepo.find({
        relations: ['department', 'manager'],
        order: { firstName: 'ASC', lastName: 'ASC' },
      });
    }

    if (currentUser.role === 'MANAGER') {
      if (!currentUser.employeeId) {
        return [];
      }

      const manager = await this.employeeRepo.findOne({
        where: { id: currentUser.employeeId },
        relations: [
          'teamMembers',
          'teamMembers.department',
          'teamMembers.manager',
        ],
      });

      if (!manager) {
        return [];
      }

      return manager.teamMembers
        .filter((employee) => employee.status === 'Active')
        .sort((a, b) =>
          `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`,
          ),
        );
    }

    return [];
  }

  async assignToEmployee(dto: AssignTrainingDto, currentUser: CurrentUser) {
    const employee = await this.employeeRepo.findOne({
      where: { id: dto.employeeId },
      relations: ['department', 'user', 'manager'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const training = await this.repo.findOne({
      where: { id: dto.trainingId },
    });

    if (!training) {
      throw new NotFoundException('Training not found');
    }

    if (currentUser.role === 'MANAGER') {
      if (!currentUser.employeeId) {
        throw new BadRequestException('Manager profile is not linked');
      }

      if (!employee.manager || employee.manager.id !== currentUser.employeeId) {
        throw new BadRequestException(
          'You can only assign trainings to your own team members',
        );
      }

      if (
        training.scope === 'TEAM' &&
        training.ownerManagerId !== currentUser.employeeId
      ) {
        throw new BadRequestException(
          'You can only assign trainings created for your team',
        );
      }
    }

    const existingAssignment = await this.employeeTrainingRepo.findOne({
      where: {
        employee: { id: dto.employeeId },
        training: { id: dto.trainingId },
      },
      relations: ['employee', 'training'],
    });

    if (existingAssignment) {
      throw new BadRequestException(
        'This training is already assigned to this employee',
      );
    }

    const assignment = this.employeeTrainingRepo.create({
      employee,
      training,
      status: 'NOT_STARTED',
      progress: 0,
      dueDate: dto.dueDate,
      completedAt: undefined,
    });

    const savedAssignment = await this.employeeTrainingRepo.save(assignment);

    await this.auditLogsService.createLog({
      action: 'TRAINING_ASSIGNED',
      actorUserId: currentUser.userId,
      actorEmail: currentUser.email,
      targetType: 'EmployeeTraining',
      targetId: savedAssignment.id,
      message: `Formation "${training.title}" assignée à ${employee.firstName} ${employee.lastName}`,
      metadata: {
        employeeId: employee.id,
        employeeEmail: employee.email,
        trainingId: training.id,
        trainingTitle: training.title,
        category: training.category,
        provider: training.provider,
        dueDate: dto.dueDate ?? null,
      },
    });

    try {
      await this.mailService.sendTrainingAssignedEmail({
        to: employee.email,
        firstName: employee.firstName,
        trainingTitle: training.title,
        category: training.category,
        provider: training.provider,
        dueDate: dto.dueDate,
      });
    } catch (error) {
      console.error('Erreur envoi email formation assignée :', error);
    }

    if (employee.user) {
      await this.notificationsService.createNotification({
        user: employee.user,
        title: 'Nouvelle formation assignée',
        message: `La formation "${training.title}" vous a été assignée.`,
        type: 'TRAINING_ASSIGNED',
      });
    }

    return savedAssignment;
  }

  async getAssignments(currentUser: CurrentUser) {
    if (currentUser.role === 'HR_ADMIN') {
      return this.employeeTrainingRepo.find({
        relations: [
          'employee',
          'employee.department',
          'employee.manager',
          'training',
        ],
        order: { id: 'DESC' },
      });
    }

    if (currentUser.role === 'MANAGER') {
      if (!currentUser.employeeId) {
        return [];
      }

      const manager = await this.employeeRepo.findOne({
        where: { id: currentUser.employeeId },
        relations: ['teamMembers'],
      });

      if (!manager) {
        return [];
      }

      const teamIds = manager.teamMembers.map((member) => member.id);

      if (teamIds.length === 0) {
        return [];
      }

      return this.employeeTrainingRepo
        .createQueryBuilder('assignment')
        .leftJoinAndSelect('assignment.employee', 'employee')
        .leftJoinAndSelect('employee.department', 'department')
        .leftJoinAndSelect('employee.manager', 'manager')
        .leftJoinAndSelect('assignment.training', 'training')
        .where('employee.id IN (:...ids)', { ids: teamIds })
        .orderBy('assignment.id', 'DESC')
        .getMany();
    }

    if (currentUser.role === 'EMPLOYEE') {
      if (!currentUser.employeeId) {
        return [];
      }

      return this.employeeTrainingRepo.find({
        where: {
          employee: { id: currentUser.employeeId },
        },
        relations: [
          'employee',
          'employee.department',
          'employee.manager',
          'training',
        ],
        order: { id: 'DESC' },
      });
    }

    return [];
  }

  async updateAssignment(
    id: number,
    dto: UpdateEmployeeTrainingDto,
    currentUser: CurrentUser,
  ) {
    const assignment = await this.employeeTrainingRepo.findOne({
      where: { id },
      relations: ['employee', 'employee.manager', 'training'],
    });

    if (!assignment) {
      throw new NotFoundException('Training assignment not found');
    }

    const isHrAdmin = currentUser.role === 'HR_ADMIN';
    const isManager = currentUser.role === 'MANAGER';
    const isEmployee = currentUser.role === 'EMPLOYEE';

    if (isEmployee) {
      if (assignment.employee.id !== currentUser.employeeId) {
        throw new BadRequestException(
          'You can only update your own training assignments',
        );
      }
    }

    if (isManager) {
      if (!currentUser.employeeId) {
        throw new BadRequestException('Manager profile is not linked');
      }

      if (
        !assignment.employee.manager ||
        assignment.employee.manager.id !== currentUser.employeeId
      ) {
        throw new BadRequestException(
          'You can only update assignments for your team members',
        );
      }
    }

    if (!isHrAdmin && !isManager && !isEmployee) {
      throw new BadRequestException('Unauthorized action');
    }

    if (dto.progress !== undefined) {
      assignment.progress = dto.progress;
    }

    if (dto.status !== undefined) {
      assignment.status = dto.status;
    }

    if (assignment.progress >= 100) {
      assignment.progress = 100;
      assignment.status = 'COMPLETED';
      assignment.completedAt = new Date();
    } else if (assignment.progress > 0 && assignment.status === 'NOT_STARTED') {
      assignment.status = 'IN_PROGRESS';
      assignment.completedAt = undefined;
    }

    if (assignment.status === 'COMPLETED') {
      assignment.progress = 100;
      assignment.completedAt = assignment.completedAt ?? new Date();
    }

    if (assignment.status === 'NOT_STARTED') {
      assignment.progress = 0;
      assignment.completedAt = undefined;
    }

    if (assignment.status === 'IN_PROGRESS' && assignment.progress === 100) {
      assignment.status = 'COMPLETED';
      assignment.completedAt = new Date();
    }

    return this.employeeTrainingRepo.save(assignment);
  }
}