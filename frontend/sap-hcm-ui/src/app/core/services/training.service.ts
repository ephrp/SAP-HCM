import { Injectable } from '@angular/core';

export type TrainingStatus = 'Planned' | 'Ongoing' | 'Completed';
export type TrainingLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Training {
  id: number;
  title: string;
  category: string;
  provider: string;
  durationHours: number;
  level: TrainingLevel;
  status: TrainingStatus;
  startDate: string;
}

@Injectable({
  providedIn: 'root',
})
export class TrainingService {
  private trainings: Training[] = [
    {
      id: 201,
      title: 'Angular Advanced',
      category: 'Frontend',
      provider: 'OpenClassrooms',
      durationHours: 18,
      level: 'Advanced',
      status: 'Ongoing',
      startDate: '2026-02-05',
    },
    {
      id: 202,
      title: 'Leadership Essentials',
      category: 'Management',
      provider: 'Coursera',
      durationHours: 10,
      level: 'Beginner',
      status: 'Planned',
      startDate: '2026-03-01',
    },
    {
      id: 203,
      title: 'HR Analytics Basics',
      category: 'HR',
      provider: 'Udemy',
      durationHours: 12,
      level: 'Intermediate',
      status: 'Completed',
      startDate: '2026-01-10',
    },
  ];

  getTrainings(): Training[] {
    return this.trainings;
  }

  addTraining(training: Training): void {
    this.trainings = [training, ...this.trainings];
  }
}