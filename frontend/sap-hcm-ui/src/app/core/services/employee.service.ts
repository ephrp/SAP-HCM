import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type EmployeeStatus = 'Active' | 'Inactive';
export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR_ADMIN';

export interface EmployeeDepartment {
  id: number;
  name: string;
}

export interface EmployeeManager {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: EmployeeDepartment | null;
  manager?: EmployeeManager | null;
  position: string;
  status: EmployeeStatus;
  photoUrl?: string;
  createdAt: string;

  user?: {
  id: number;
  role: UserRole;
};
}

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  departmentName?: string;
  photoUrl?: string;
  createAccount?: boolean;
  role?: UserRole;
  managerId?: number;
}

export interface CreateEmployeeResponse {
  employee: Employee;
  accountCreated: boolean;
  temporaryPassword?: string;
  role?: UserRole;
}

export interface UpdateEmployeePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  position?: string;
  departmentName?: string;
  photoUrl?: string;
  managerId?: number;
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

  addEmployee(
    payload: CreateEmployeePayload,
  ): Observable<CreateEmployeeResponse> {
    return this.http.post<CreateEmployeeResponse>(this.apiUrl, payload);
  }

  updateEmployee(
    id: number,
    payload: UpdateEmployeePayload,
  ): Observable<Employee> {
    return this.http.patch<Employee>(`${this.apiUrl}/${id}`, payload);
  }

  deleteEmployee(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  

}