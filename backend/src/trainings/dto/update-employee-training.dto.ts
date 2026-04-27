import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { EmployeeTrainingStatus } from '../employee-training.entity';

export class UpdateEmployeeTrainingDto {
  @IsOptional()
  @IsString()
  status?: EmployeeTrainingStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;
}