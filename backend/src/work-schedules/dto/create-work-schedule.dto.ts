import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateWorkScheduleDto {
  @IsInt()
  employeeId!: number;

  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @IsBoolean()
  isWorkingDay!: boolean;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  breakMinutes?: number;
}