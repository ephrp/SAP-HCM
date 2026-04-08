import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LeaveRequest } from './leave-request.entity';
import { Employee } from '../employees/employee.entity';
import { Department } from '../departments/department.entity';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(LeaveRequest)
    private readonly repo: Repository<LeaveRequest>,

    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,

    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
  ) {}

  async findAll() {
    return this.repo.find({
      relations: ['employee', 'employee.department', 'approvedByUser'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const leave = await this.repo.findOne({
      where: { id },
      relations: ['employee', 'employee.department', 'approvedByUser'],
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    return leave;
  }

  async create(dto: CreateLeaveDto) {
    let employee = await this.employeeRepo.findOne({
      where: { email: dto.email.trim() },
      relations: ['department'],
    });

    if (!employee) {
      let department: Department | null = null;

      if (dto.departmentName?.trim()) {
        const normalizedDepartment = dto.departmentName.trim();

        department =
          (await this.departmentRepo.findOne({
            where: { name: normalizedDepartment },
          })) ?? null;

        if (!department) {
          department = this.departmentRepo.create({
            name: normalizedDepartment,
          });
          department = await this.departmentRepo.save(department);
        }
      }

      const [firstName = '', ...rest] = dto.employeeName.trim().split(' ');
      const lastName = rest.join(' ') || 'Unknown';

      employee = this.employeeRepo.create({
        firstName,
        lastName,
        email: dto.email.trim(),
        position: 'Employee',
        status: 'Active',
        department: department ?? undefined,
      });

      employee = await this.employeeRepo.save(employee);
    }

    const leave = this.repo.create({
      employee,
      type: dto.type,
      startDate: dto.startDate,
      endDate: dto.endDate,
      days: dto.days,
      status: dto.status ?? 'Pending',
      note: dto.note,
    });

    return this.repo.save(leave);
  }

  async update(id: number, dto: UpdateLeaveDto) {
    const leave = await this.findOne(id);

    Object.assign(leave, {
      type: dto.type ?? leave.type,
      startDate: dto.startDate ?? leave.startDate,
      endDate: dto.endDate ?? leave.endDate,
      days: dto.days ?? leave.days,
      status: dto.status ?? leave.status,
      note: dto.note ?? leave.note,
    });

    return this.repo.save(leave);
  }

  async remove(id: number) {
    const leave = await this.findOne(id);
    await this.repo.remove(leave);
    return { message: 'Leave request deleted successfully' };
  }
}
