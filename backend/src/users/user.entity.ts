import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Employee } from '../employees/employee.entity';
import { LeaveRequest } from '../leaves/leave-request.entity';

export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR_ADMIN';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 150 })
  email!: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  role!: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'must_change_password', default: false })
  mustChangePassword!: boolean;

  @Column({ name: 'reset_password_token_hash', type: 'text', nullable: true })
resetPasswordTokenHash?: string | null;

@Column({ name: 'reset_password_expires_at', type: 'timestamp', nullable: true })
resetPasswordExpiresAt?: Date | null;

  @OneToOne(() => Employee, (employee) => employee.user, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee?: Employee;

  @OneToMany(() => LeaveRequest, (leaveRequest) => leaveRequest.approvedByUser)
  approvedLeaveRequests!: LeaveRequest[];
}