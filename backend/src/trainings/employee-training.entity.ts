import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Employee } from '../employees/employee.entity';
import { Training } from './training.entity';

export type EmployeeTrainingStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED';

@Entity('employee_trainings')
@Check(`"progress" >= 0 AND "progress" <= 100`)
export class EmployeeTraining {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Employee, (employee) => employee.employeeTrainings, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @ManyToOne(() => Training, (training) => training.employeeTrainings, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'training_id' })
  training!: Training;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'NOT_STARTED',
  })
  status!: EmployeeTrainingStatus;

  @Column({
    type: 'int',
    default: 0,
  })
  progress!: number;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: string;
}