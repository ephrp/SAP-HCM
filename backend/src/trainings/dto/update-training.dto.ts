import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import type { TrainingLevel, TrainingStatus } from '../training.entity';

export class UpdateTrainingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationHours?: number;

  @IsOptional()
  @IsString()
  level?: TrainingLevel;

  @IsOptional()
  @IsString()
  status?: TrainingStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}