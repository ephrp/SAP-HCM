import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type TrainingLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type TrainingStatus = 'Planned' | 'Ongoing' | 'Completed';

@Entity('trainings')
export class Training {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  title: string;

  @Column({ length: 100 })
  category: string;

  @Column({ length: 150 })
  provider: string;

  @Column({ name: 'duration_hours', type: 'int' })
  durationHours: number;

  @Column({
    type: 'varchar',
    length: 20,
  })
  level: TrainingLevel;

  @Column({
    type: 'varchar',
    length: 20,
  })
  status: TrainingStatus;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;
}