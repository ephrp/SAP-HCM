import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Employee } from './employee.entity';
import { Department } from '../departments/department.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly repo: Repository<Employee>,

    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
  ) {}

  findAll() {
    return this.repo.find({
      relations: ['department'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const employee = await this.repo.findOne({
      where: { id },
      relations: ['department'],
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

    const employee = this.repo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      position: dto.position,
      photoUrl: dto.photoUrl,
      status: 'Active',
      department: department ?? undefined,
    });

    return this.repo.save(employee);
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
}