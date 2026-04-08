import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type EmployeeStatus = 'Active' | 'Inactive';

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: { id: number; name: string } | null;
  position: string;
  status: EmployeeStatus;
  photoUrl?: string;
}

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  departmentName?: string;
  photoUrl?: string;
}

export interface UpdateEmployeePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  position?: string;
  departmentName?: string;
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private readonly apiUrl = 'http://localhost:3000/employees';

  constructor(private http: HttpClient) {}

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.apiUrl);
  }

  getEmployeeById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  addEmployee(payload: CreateEmployeePayload): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, payload);
  }

  updateEmployee(id: number, payload: UpdateEmployeePayload): Observable<Employee> {
    return this.http.patch<Employee>(`${this.apiUrl}/${id}`, payload);
  }

  deleteEmployee(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}