import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingsController } from './trainings.controller';
import { TrainingsService } from './trainings.service';
import { Training } from './training.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Training])],
  controllers: [TrainingsController],
  providers: [TrainingsService],
  exports: [TypeOrmModule],
})
export class TrainingsModule {}
