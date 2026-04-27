import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Employee } from './employee.entity';
import { Department } from '../departments/department.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UsersService } from '../users/users.service';
import type { UserRole } from '../users/user.entity';
import { MailService } from '../mail/mail.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly repo: Repository<Employee>,

    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,

    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly auditLogsService: AuditLogsService, // 🔥 AJOUT
  ) {}

  findAll() {
    return this.repo.find({
      relations: ['department', 'user', 'manager'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const employee = await this.repo.findOne({
      where: { id },
      relations: ['department', 'user', 'manager', 'teamMembers'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async create(dto: CreateEmployeeDto) {
    let department: Department | null = null;

    if (dto.departmentName?.trim()) {
      const normalizedName = dto.departmentName.trim();

      department =
        (await this.departmentRepo.findOne({
          where: { name: normalizedName },
        })) ?? null;

      if (!department) {
        department = this.departmentRepo.create({
          name: normalizedName,
        });
        department = await this.departmentRepo.save(department);
      }
    }

    let manager: Employee | null = null;

    if (dto.managerId !== undefined) {
      manager = await this.repo.findOne({
        where: { id: dto.managerId },
        relations: ['user'],
      });

      if (!manager) {
        throw new BadRequestException('Manager not found');
      }

      if (
        manager.user?.role !== 'MANAGER' &&
        manager.user?.role !== 'HR_ADMIN'
      ) {
        throw new BadRequestException(
          'Selected employee cannot be assigned as manager',
        );
      }
    }

    const employee = this.repo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      position: dto.position,
      photoUrl: dto.photoUrl,
      status: 'Active',
      department: department ?? undefined,
      manager: manager ?? undefined,
    });

    const savedEmployee = await this.repo.save(employee);

    // 🔥 AUDIT : EMPLOYEE CREATED
    await this.auditLogsService.createLog({
      action: 'EMPLOYEE_CREATED',
      actorUserId: null,
      actorEmail: null,
      targetType: 'Employee',
      targetId: savedEmployee.id,
      message: `Employé créé : ${savedEmployee.firstName} ${savedEmployee.lastName}`,
      metadata: {
        email: savedEmployee.email,
        position: savedEmployee.position,
        departmentName: dto.departmentName ?? null,
        managerId: dto.managerId ?? null,
      },
    });

    if (!dto.createAccount) {
      return {
        employee: savedEmployee,
        accountCreated: false,
      };
    }

    const emailAlreadyUsed = await this.usersService.emailAlreadyUsed(dto.email);

    if (emailAlreadyUsed) {
      throw new BadRequestException(
        'Employee created, but user account cannot be created because this email is already used',
      );
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const role: UserRole = dto.role ?? 'EMPLOYEE';

    const user = await this.usersService.createUser({
      email: dto.email,
      password: temporaryPassword,
      role,
      employee: savedEmployee,
      mustChangePassword: true,
    });

    // 🔥 AUDIT : ACCOUNT CREATED
    await this.auditLogsService.createLog({
      action: 'ACCOUNT_CREATED',
      actorUserId: null,
      actorEmail: null,
      targetType: 'User',
      targetId: user.id,
      message: `Compte utilisateur créé pour ${dto.email}`,
      metadata: {
        role,
        employeeId: savedEmployee.id,
      },
    });

    try {
      await this.mailService.sendAccountCreationEmail({
        to: dto.email,
        firstName: dto.firstName,
        role,
        temporaryPassword,
      });
    } catch (error) {
      console.error('Erreur envoi email création de compte :', error);
    }

    return {
      employee: {
        ...savedEmployee,
        user,
      },
      accountCreated: true,
      temporaryPassword,
      role,
    };
  }

  async update(id: number, dto: UpdateEmployeeDto) {
    const employee = await this.findOne(id);

    let department: Department | null = employee.department ?? null;

    if (dto.departmentName !== undefined) {
      if (dto.departmentName.trim() === '') {
        department = null;
      } else {
        const normalizedName = dto.departmentName.trim();

        department =
          (await this.departmentRepo.findOne({
            where: { name: normalizedName },
          })) ?? null;

        if (!department) {
          department = this.departmentRepo.create({
            name: normalizedName,
          });
          department = await this.departmentRepo.save(department);
        }
      }
    }

    if (dto.managerId !== undefined) {
      if (!dto.managerId) {
        employee.manager = undefined;
      } else {
        if (dto.managerId === employee.id) {
          throw new BadRequestException(
            'An employee cannot be their own manager',
          );
        }

        const manager = await this.repo.findOne({
          where: { id: dto.managerId },
          relations: ['user'],
        });

        if (!manager) {
          throw new BadRequestException('Manager not found');
        }

        if (
          manager.user?.role !== 'MANAGER' &&
          manager.user?.role !== 'HR_ADMIN'
        ) {
          throw new BadRequestException(
            'Selected employee cannot be assigned as manager',
          );
        }

        employee.manager = manager;
      }
    }

    Object.assign(employee, {
      firstName: dto.firstName ?? employee.firstName,
      lastName: dto.lastName ?? employee.lastName,
      email: dto.email ?? employee.email,
      position: dto.position ?? employee.position,
      photoUrl: dto.photoUrl ?? employee.photoUrl,
      department: department ?? undefined,
    });

    return this.repo.save(employee);
  }

  async remove(id: number) {
    const employee = await this.findOne(id);
    await this.repo.remove(employee);

    return { message: 'Employee deleted successfully' };
  }

  private generateTemporaryPassword(): string {
    const random = Math.random().toString(36).slice(-6);
    return `Temp@${random}`;
  }
}