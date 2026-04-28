import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateWorkScheduleDto {
  @IsOptional()
  @IsBoolean()
  isWorkingDay?: boolean;

  @IsOptional()
  @IsString()
  startTime?: string | null;

  @IsOptional()
  @IsString()
  endTime?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  breakMinutes?: number;
}