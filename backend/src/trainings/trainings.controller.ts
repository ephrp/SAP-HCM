import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TrainingsService } from './trainings.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('trainings')
@UseGuards(JwtAuthGuard)
export class TrainingsController {
  constructor(private readonly trainingsService: TrainingsService) {}

  @Get()
  findAll() {
    return this.trainingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trainingsService.findOne(Number(id));
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('HR_ADMIN')
  create(@Body() dto: CreateTrainingDto) {
    return this.trainingsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('HR_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateTrainingDto) {
    return this.trainingsService.update(Number(id), dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('HR_ADMIN')
  remove(@Param('id') id: string) {
    return this.trainingsService.remove(Number(id));
  }
}