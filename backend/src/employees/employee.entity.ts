import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Department } from 'src/departments/department.entity';
import { User } from 'src/users/user.entity';
import { LeaveRequest } from 'src/leaves/leave-request.entity';

export type EmployeeStatus = 'Active' | 'Inactive';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ length: 150 })
  position: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'Active',
  })
  status: EmployeeStatus;

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl?: string;

  @ManyToOne(() => Department, (department) => department.employees, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @ManyToOne(() => Employee, (employee) => employee.teamMembers, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'manager_id' })
  manager?: Employee;

  @OneToMany(() => Employee, (employee) => employee.manager)
  teamMembers: Employee[];

  @OneToOne(() => User, (user) => user.employee)
  user: User;

  @OneToMany(() => LeaveRequest, (leaveRequest) => leaveRequest.employee)
  leaveRequests: LeaveRequest[];
}