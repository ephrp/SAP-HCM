import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Employee } from '../employees/employee.entity';

@Entity('work_schedules')
@Unique(['employee', 'dayOfWeek'])
export class WorkSchedule {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Employee, (employee) => employee.workSchedules, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employee_id' })
  employee!: Employee;

  @Column({ name: 'day_of_week', type: 'int' })
  dayOfWeek!: number; // 1 = Monday, 7 = Sunday

  @Column({ name: 'is_working_day', default: true })
  isWorkingDay!: boolean;

  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime?: string | null;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime?: string | null;

  @Column({ name: 'break_minutes', type: 'int', default: 0 })
  breakMinutes!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}