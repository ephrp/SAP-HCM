import { Injectable } from '@angular/core';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
export type LeaveType = 'Annual' | 'Sick' | 'Unpaid' | 'Remote';

export interface LeaveRequest {
  id: number;
  employeeName: string;
  email: string;
  department?: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  createdAt: string;
  note?: string;
}

@Injectable({
  providedIn: 'root',
})
export class LeaveService {

  private leaves: LeaveRequest[] = [
    {
      id: 1,
      employeeName: 'Jean Dupont',
      email: 'jean.dupont@company.com',
      department: 'IT',
      type: 'Annual',
      startDate: '2026-03-10',
      endDate: '2026-03-14',
      days: 5,
      status: 'Pending',
      createdAt: '2026-02-10',
      note: 'Vacances famille',
    },
  ];

  getLeaves(): LeaveRequest[] {
    return this.leaves;
  }

  addLeave(request: LeaveRequest) {
    this.leaves = [request, ...this.leaves];
  }

  approveLeave(id: number) {
    this.leaves = this.leaves.map((leave) =>
      leave.id === id ? { ...leave, status: 'Approved' } : leave
    );
  }

  rejectLeave(id: number) {
    this.leaves = this.leaves.map((leave) =>
      leave.id === id ? { ...leave, status: 'Rejected' } : leave
    );
  }
}