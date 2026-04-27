import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class AssignTrainingDto {
  @IsInt()
  @Min(1)
  employeeId!: number;

  @IsInt()
  @Min(1)
  trainingId!: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}