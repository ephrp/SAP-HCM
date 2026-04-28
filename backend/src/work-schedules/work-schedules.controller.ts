import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { WorkSchedulesService } from './work-schedules.service';
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('work-schedules')
@UseGuards(JwtAuthGuard)
export class WorkSchedulesController {
  constructor(private readonly service: WorkSchedulesService) {}

  @Get(':employeeId')
  getSchedule(@Param('employeeId') employeeId: string, @Req() req: any) {
    return this.service.getEmployeeSchedule(Number(employeeId), req.user);
  }

  @Post()
  upsert(@Body() dto: CreateWorkScheduleDto, @Req() req: any) {
    return this.service.upsert(dto, req.user);
  }
}