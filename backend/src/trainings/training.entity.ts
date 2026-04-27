import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EmployeeTraining } from './employee-training.entity';

export type TrainingLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type TrainingStatus = 'Planned' | 'Ongoing' | 'Completed';
export type TrainingScope = 'GLOBAL' | 'TEAM';
export type TrainingCreatorRole = 'HR_ADMIN' | 'MANAGER';

@Entity('trainings')
export class Training {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 150 })
  title!: string;

  @Column({ length: 100 })
  category!: string;

  @Column({ length: 150 })
  provider!: string;

  @Column({ name: 'duration_hours', type: 'int' })
  durationHours!: number;

  @Column({
    type: 'varchar',
    length: 20,
  })
  level!: TrainingLevel;

  @Column({
    type: 'varchar',
    length: 20,
  })
  status!: TrainingStatus;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'GLOBAL',
  })
  scope!: TrainingScope;

  @Column({
    name: 'created_by_role',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  createdByRole?: TrainingCreatorRole;

  @Column({
    name: 'created_by_user_id',
    type: 'int',
    nullable: true,
  })
  createdByUserId?: number;

  @Column({
    name: 'owner_manager_id',
    type: 'int',
    nullable: true,
  })
  ownerManagerId?: number;

  @OneToMany(
    () => EmployeeTraining,
    (employeeTraining) => employeeTraining.training,
  )
  employeeTrainings!: EmployeeTraining[];
}