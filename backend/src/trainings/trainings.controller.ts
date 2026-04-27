import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TrainingsService } from './trainings.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { AssignTrainingDto } from './dto/assign-training.dto';
import { UpdateEmployeeTrainingDto } from './dto/update-employee-training.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('trainings')
@UseGuards(JwtAuthGuard)
export class TrainingsController {
  constructor(private readonly trainingsService: TrainingsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.trainingsService.findAll(req.user);
  }

  @Get('assignable-employees')
  getAssignableEmployees(@Req() req: any) {
    return this.trainingsService.getAssignableEmployees(req.user);
  }

  @Get('assignments/all')
  getAssignments(@Req() req: any) {
    return this.trainingsService.getAssignments(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.trainingsService.findOne(Number(id), req.user);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('HR_ADMIN', 'MANAGER')
  create(@Body() dto: CreateTrainingDto, @Req() req: any) {
    return this.trainingsService.create(dto, req.user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('HR_ADMIN', 'MANAGER')
  update(@Param('id') id: string, @Body() dto: UpdateTrainingDto, @Req() req: any) {
    return this.trainingsService.update(Number(id), dto, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('HR_ADMIN', 'MANAGER')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.trainingsService.remove(Number(id), req.user);
  }

  @Post('assignments')
  @UseGuards(RolesGuard)
  @Roles('HR_ADMIN', 'MANAGER')
  assignToEmployee(@Body() dto: AssignTrainingDto, @Req() req: any) {
    return this.trainingsService.assignToEmployee(dto, req.user);
  }

  @Patch('assignments/:id')
  @UseGuards(RolesGuard)
  @Roles('HR_ADMIN', 'MANAGER', 'EMPLOYEE')
  updateAssignment(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeTrainingDto,
    @Req() req: any,
  ) {
    return this.trainingsService.updateAssignment(Number(id), dto, req.user);
  }
}