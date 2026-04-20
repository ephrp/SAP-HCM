import { IsDateString, IsInt, IsString, Min } from 'class-validator';
import type { TrainingLevel, TrainingStatus } from '../training.entity';

export class CreateTrainingDto {
  @IsString()
  title!: string;

  @IsString()
  category!: string;

  @IsString()
  provider!: string;

  @IsInt()
  @Min(1)
  durationHours!: number;

  @IsString()
  level!: TrainingLevel;

  @IsString()
  status!: TrainingStatus;

  @IsDateString()
  startDate!: string;
}