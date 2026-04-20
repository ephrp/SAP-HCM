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
import { LeavesService } from './leaves.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('leaves')
@UseGuards(JwtAuthGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.leavesService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leavesService.findOne(Number(id));
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateLeaveDto) {
    return this.leavesService.create(req.user, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'HR_ADMIN', 'EMPLOYEE')
  update(@Param('id') id: string, @Body() dto: UpdateLeaveDto, @Req() req: any) {
    return this.leavesService.update(Number(id), dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.leavesService.remove(Number(id), req.user);
  }
}