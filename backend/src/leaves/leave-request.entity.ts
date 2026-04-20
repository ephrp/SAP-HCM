import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Employee } from '../employees/employee.entity';
import { User } from '../users/user.entity';

export type LeaveType = 'Annual' | 'Sick' | 'Unpaid' | 'Remote';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

@Entity('leave_requests')
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Employee, (employee) => employee.leaveRequests, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @Column({
    type: 'varchar',
    length: 20,
  })
  type!: LeaveType;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: string;

  @Column({ type: 'int' })
  days!: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'Pending',
  })
  status!: LeaveStatus;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt?: Date;

  @ManyToOne(() => User, (user) => user.approvedLeaveRequests, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'approved_by_user_id' })
  approvedByUser?: User;
}