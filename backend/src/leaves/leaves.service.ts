  import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LeaveRequest } from './leave-request.entity';
import { Employee } from '../employees/employee.entity';
import { User } from '../users/user.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';

type CurrentUser = {
  userId: number;
  email: string;
  role: string;
  employeeId: number | null;
};

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(LeaveRequest)
    private readonly repo: Repository<LeaveRequest>,

    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(currentUser: CurrentUser) {
    if (currentUser.role === 'HR_ADMIN') {
      return this.repo.find({
        relations: [
          'employee',
          'employee.department',
          'employee.manager',
          'approvedByUser',
        ],
        order: { id: 'DESC' },
      });
    }

    if (currentUser.role === 'EMPLOYEE') {
      if (!currentUser.employeeId) {
        return [];
      }

      return this.repo.find({
        where: {
          employee: { id: currentUser.employeeId },
        },
        relations: [
          'employee',
          'employee.department',
          'employee.manager',
          'approvedByUser',
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

      return this.repo
        .createQueryBuilder('leave')
        .leftJoinAndSelect('leave.employee', 'employee')
        .leftJoinAndSelect('employee.department', 'department')
        .leftJoinAndSelect('employee.manager', 'manager')
        .leftJoinAndSelect('leave.approvedByUser', 'approvedByUser')
        .where('employee.id IN (:...ids)', { ids: teamIds })
        .orderBy('leave.id', 'DESC')
        .getMany();
    }

    return [];
  }

  async findOne(id: number) {
    const leave = await this.repo.findOne({
      where: { id },
      relations: [
        'employee',
        'employee.department',
        'employee.manager',
        'approvedByUser',
      ],
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    return leave;
  }

  async create(currentUser: CurrentUser, dto: CreateLeaveDto) {
    if (!currentUser.employeeId) {
      throw new BadRequestException(
        'This account is not linked to an employee profile',
      );
    }

    const employee = await this.employeeRepo.findOne({
      where: { id: currentUser.employeeId },
      relations: ['department', 'manager'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found for current user');
    }

    const leave = this.repo.create({
      employee,
      type: dto.type,
      startDate: dto.startDate,
      endDate: dto.endDate,
      days: dto.days,
      status: 'Pending',
      note: dto.note,
      rejectionReason: undefined,
      processedAt: undefined,
      approvedByUser: undefined,
    });

    return this.repo.save(leave);
  }

  async update(id: number, dto: UpdateLeaveDto, currentUser?: CurrentUser) {
    const leave = await this.findOne(id);

    const isApprovalAction =
      dto.status === 'Approved' &&
      dto.type === undefined &&
      dto.startDate === undefined &&
      dto.endDate === undefined &&
      dto.days === undefined &&
      dto.note === undefined &&
      dto.rejectionReason === undefined;

    const isRejectionAction =
      dto.status === 'Rejected' &&
      dto.type === undefined &&
      dto.startDate === undefined &&
      dto.endDate === undefined &&
      dto.days === undefined &&
      dto.note === undefined;

    if (isApprovalAction || isRejectionAction) {
      if (!currentUser) {
        throw new ForbiddenException('User context is required');
      }

      if (currentUser.role !== 'MANAGER' && currentUser.role !== 'HR_ADMIN') {
        throw new ForbiddenException(
          'Only managers and HR admins can process leave requests',
        );
      }

      if (currentUser.role === 'MANAGER') {
        if (!currentUser.employeeId) {
          throw new ForbiddenException(
            'Manager profile is not linked to an employee',
          );
        }

        if (!leave.employee.manager || leave.employee.manager.id !== currentUser.employeeId) {
          throw new ForbiddenException(
            'You can only process leave requests for your own team members',
          );
        }
      }
    }

    if (isApprovalAction) {
      leave.status = 'Approved';
      leave.rejectionReason = undefined;
      leave.processedAt = new Date();

      if (currentUser?.userId) {
        const decisionUser = await this.userRepo.findOne({
          where: { id: currentUser.userId },
        });

        leave.approvedByUser = decisionUser ?? undefined;
      }

      return this.repo.save(leave);
    }

    if (isRejectionAction) {
      const reason = dto.rejectionReason?.trim();

      if (!reason) {
        throw new BadRequestException(
          'Rejection reason is required when rejecting a leave',
        );
      }

      leave.status = 'Rejected';
      leave.rejectionReason = reason;
      leave.processedAt = new Date();

      if (currentUser?.userId) {
        const decisionUser = await this.userRepo.findOne({
          where: { id: currentUser.userId },
        });

        leave.approvedByUser = decisionUser ?? undefined;
      }

      return this.repo.save(leave);
    }

    if (leave.status !== 'Pending') {
      throw new BadRequestException('Only pending leaves can be edited');
    }

    if (currentUser?.role === 'EMPLOYEE') {
      if (currentUser.employeeId !== leave.employee.id) {
        throw new ForbiddenException(
          'You can only edit your own leave requests',
        );
      }
    }

    Object.assign(leave, {
      type: dto.type ?? leave.type,
      startDate: dto.startDate ?? leave.startDate,
      endDate: dto.endDate ?? leave.endDate,
      days: dto.days ?? leave.days,
      note: dto.note ?? leave.note,
    });

    return this.repo.save(leave);
  }

  async remove(id: number, currentUser?: CurrentUser) {
    const leave = await this.findOne(id);

    if (leave.status !== 'Pending') {
      throw new BadRequestException('Only pending leaves can be deleted');
    }

    if (currentUser?.role === 'EMPLOYEE') {
      if (currentUser.employeeId !== leave.employee.id) {
        throw new ForbiddenException(
          'You can only delete your own leave requests',
        );
      }
    }

    await this.repo.remove(leave);
    return { message: 'Leave request deleted successfully' };
  }
}