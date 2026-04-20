import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
export type LeaveType = 'Annual' | 'Sick' | 'Unpaid' | 'Remote';

export interface LeaveRequest {
  id: number;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department: { id: number; name: string } | null;
  };
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  note?: string;
  rejectionReason?: string;
  processedAt?: string;
  approvedByUser?: {
    id: number;
    email: string;
    role: string;
  } | null;
}

export interface CreateLeavePayload {
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status?: LeaveStatus;
  note?: string;
}

export interface UpdateLeavePayload {
  type?: LeaveType;
  startDate?: string;
  endDate?: string;
  days?: number;
  status?: LeaveStatus;
  note?: string;
  rejectionReason?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LeaveService {
  private readonly apiUrl = 'http://localhost:3000/leaves';

  constructor(private http: HttpClient) {}

  getLeaves(): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(this.apiUrl);
  }

  getLeaveById(id: number): Observable<LeaveRequest> {
    return this.http.get<LeaveRequest>(`${this.apiUrl}/${id}`);
  }

  createLeave(payload: CreateLeavePayload): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(this.apiUrl, payload);
  }

  updateLeave(id: number, payload: UpdateLeavePayload): Observable<LeaveRequest> {
    return this.http.patch<LeaveRequest>(`${this.apiUrl}/${id}`, payload);
  }

  deleteLeave(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  approveLeave(id: number): Observable<LeaveRequest> {
    return this.updateLeave(id, {
      status: 'Approved',
    });
  }

  rejectLeave(id: number, rejectionReason: string): Observable<LeaveRequest> {
    return this.updateLeave(id, {
      status: 'Rejected',
      rejectionReason,
    });
  }
}