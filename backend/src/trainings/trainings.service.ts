import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Training } from './training.entity';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';

@Injectable()
export class TrainingsService {
  constructor(
    @InjectRepository(Training)
    private readonly repo: Repository<Training>,
  ) {}

  findAll() {
    return this.repo.find({
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const training = await this.repo.findOneBy({ id });

    if (!training) {
      throw new NotFoundException('Training not found');
    }

    return training;
  }

  async create(dto: CreateTrainingDto) {
    const training = this.repo.create({
      title: dto.title,
      category: dto.category,
      provider: dto.provider,
      durationHours: dto.durationHours,
      level: dto.level,
      status: dto.status,
      startDate: dto.startDate,
    });

    return this.repo.save(training);
  }

  async update(id: number, dto: UpdateTrainingDto) {
    const training = await this.findOne(id);

    Object.assign(training, {
      title: dto.title ?? training.title,
      category: dto.category ?? training.category,
      provider: dto.provider ?? training.provider,
      durationHours: dto.durationHours ?? training.durationHours,
      level: dto.level ?? training.level,
      status: dto.status ?? training.status,
      startDate: dto.startDate ?? training.startDate,
    });

    return this.repo.save(training);
  }

  async remove(id: number) {
    const training = await this.findOne(id);
    await this.repo.remove(training);
    return { message: 'Training deleted successfully' };
  }
}