import {
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import type { LeaveStatus, LeaveType } from '../leave-request.entity';

export class CreateLeaveDto {
  @IsString()
  employeeName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  departmentName?: string;

  @IsString()
  type: LeaveType;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsInt()
  @Min(1)
  days: number;

  @IsOptional()
  @IsString()
  status?: LeaveStatus;

  @IsOptional()
  @IsString()
  note?: string;
}