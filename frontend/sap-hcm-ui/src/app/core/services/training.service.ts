import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

export interface CreateTrainingPayload {
  title: string;
  category: string;
  provider: string;
  durationHours: number;
  level: TrainingLevel;
  status: TrainingStatus;
  startDate: string;
}

export interface UpdateTrainingPayload {
  title?: string;
  category?: string;
  provider?: string;
  durationHours?: number;
  level?: TrainingLevel;
  status?: TrainingStatus;
  startDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TrainingService {
  private readonly apiUrl = 'http://localhost:3000/trainings';

  constructor(private http: HttpClient) {}

  getTrainings(): Observable<Training[]> {
    return this.http.get<Training[]>(this.apiUrl);
  }

  getTrainingById(id: number): Observable<Training> {
    return this.http.get<Training>(`${this.apiUrl}/${id}`);
  }

  createTraining(payload: CreateTrainingPayload): Observable<Training> {
    return this.http.post<Training>(this.apiUrl, payload);
  }

  updateTraining(
    id: number,
    payload: UpdateTrainingPayload
  ): Observable<Training> {
    return this.http.patch<Training>(`${this.apiUrl}/${id}`, payload);
  }

  deleteTraining(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}