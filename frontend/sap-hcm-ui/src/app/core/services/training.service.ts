import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TrainingStatus = 'Planned' | 'Ongoing' | 'Completed';
export type TrainingLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type EmployeeTrainingStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED';

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

export interface TrainingAssignment {
  id: number;
  status: EmployeeTrainingStatus;
  progress: number;
  assignedAt: string;
  completedAt?: string;
  dueDate?: string;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department?: {
      id: number;
      name: string;
    } | null;
  };
  training: Training;
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

export interface AssignTrainingPayload {
  employeeId: number;
  trainingId: number;
  dueDate?: string;
}

export interface UpdateTrainingAssignmentPayload {
  status?: EmployeeTrainingStatus;
  progress?: number;
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
    payload: UpdateTrainingPayload,
  ): Observable<Training> {
    return this.http.patch<Training>(`${this.apiUrl}/${id}`, payload);
  }

  deleteTraining(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  getAssignments(): Observable<TrainingAssignment[]> {
    return this.http.get<TrainingAssignment[]>(
      `${this.apiUrl}/assignments/all`,
    );
  }

  assignTraining(
    payload: AssignTrainingPayload,
  ): Observable<TrainingAssignment> {
    return this.http.post<TrainingAssignment>(
      `${this.apiUrl}/assignments`,
      payload,
    );
  }

  getAssignableEmployees(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/assignable-employees`);
}

  updateAssignment(
    id: number,
    payload: UpdateTrainingAssignmentPayload,
  ): Observable<TrainingAssignment> {
    return this.http.patch<TrainingAssignment>(
      `${this.apiUrl}/assignments/${id}`,
      payload,
    );
  }
}