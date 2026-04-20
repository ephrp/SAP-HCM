import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from './user.entity';
import { Employee } from '../employees/employee.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findAll() {
    return this.repo.find({
      relations: ['employee'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const user = await this.repo.findOne({
      where: { id },
      relations: ['employee'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.repo.findOne({
      where: { email },
      relations: ['employee', 'employee.department'],
    });
  }

  async emailAlreadyUsed(email: string): Promise<boolean> {
    const existing = await this.repo.findOne({
      where: { email },
    });

    return !!existing;
  }

  async createUser(params: {
    email: string;
    password: string;
    role: UserRole;
    employee?: Employee;
    mustChangePassword?: boolean;
  }) {
    const existing = await this.findByEmail(params.email);

    if (existing) {
      throw new BadRequestException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(params.password, 10);

    const user = this.repo.create({
      email: params.email,
      passwordHash,
      role: params.role,
      isActive: true,
      employee: params.employee,
      mustChangePassword: params.mustChangePassword ?? false,
    });

    return this.repo.save(user);
  }

  async updatePassword(userId: number, newPassword: string) {
    const user = await this.findOne(userId);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    user.passwordHash = passwordHash;
    user.mustChangePassword = false;

    return this.repo.save(user);
  }
}