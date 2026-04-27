import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStatsResponse {
  scope: 'global' | 'team' | 'personal' | 'unknown';

  stats: {
    totalEmployees: number;
    pendingLeaves: number;
    trainingHours: number;
    departments: number;
  };

  chartMonths: string[];
  employeeTrend: number[];

  profile: {
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    status: 'Active' | 'Inactive';
    departmentName: string;
    managerName: string;
    photoUrl?: string;
    createdAt: string;
  } | null;

  leaveSummary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  } | null;

  leaveHistory: Array<{
    id: number;
    type: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    startDate: string;
    endDate: string;
    days: number;
  }>;

  // 🔥 NOUVEAU
  trainingSummary: {
    total: number;
    inProgress: number;
    completed: number;
  } | null;

  trainingList: Array<{
    id: number;
    title: string;
    progress: number;
    status: string;
    dueDate?: string;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly apiUrl = 'http://localhost:3000/dashboard';

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStatsResponse> {
    return this.http.get<DashboardStatsResponse>(`${this.apiUrl}/stats`);
  }
}