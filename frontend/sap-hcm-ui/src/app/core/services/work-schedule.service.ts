import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WorkSchedule {
  id: number;
  dayOfWeek: number;
  isWorkingDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  breakMinutes: number;
}

export interface SaveWorkSchedulePayload {
  employeeId: number;
  dayOfWeek: number;
  isWorkingDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  breakMinutes?: number;
}

@Injectable({
  providedIn: 'root',
})
export class WorkScheduleService {
  private readonly apiUrl = 'http://localhost:3000/work-schedules';

  constructor(private http: HttpClient) {}

  getEmployeeSchedule(employeeId: number): Observable<WorkSchedule[]> {
    return this.http.get<WorkSchedule[]>(`${this.apiUrl}/${employeeId}`);
  }

  saveSchedule(payload: SaveWorkSchedulePayload): Observable<WorkSchedule> {
    return this.http.post<WorkSchedule>(this.apiUrl, payload);
  }
}