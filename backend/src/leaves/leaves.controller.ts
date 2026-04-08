import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';

@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Get()
  findAll() {
    return this.leavesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leavesService.findOne(Number(id));
  }

  @Post()
  create(@Body() dto: CreateLeaveDto) {
    return this.leavesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeaveDto) {
    return this.leavesService.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leavesService.remove(Number(id));
  }
}
