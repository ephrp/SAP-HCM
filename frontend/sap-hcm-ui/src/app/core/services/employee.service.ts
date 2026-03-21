import { Injectable } from '@angular/core';

export type EmployeeStatus = 'Active' | 'Inactive';

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  status: EmployeeStatus;
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private employees: Employee[] = [
    {
      id: 1,
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@company.com',
      department: 'IT',
      position: 'Software Engineer',
      status: 'Active',
      photoUrl: 'https://i.pravatar.cc/150?img=12',
    },
    {
      id: 2,
      firstName: 'Marie',
      lastName: 'Roy',
      email: 'marie.roy@company.com',
      department: 'HR',
      position: 'HR Manager',
      status: 'Active',
      photoUrl: 'https://i.pravatar.cc/150?img=32',
    },
    {
      id: 3,
      firstName: 'Paul',
      lastName: 'Martin',
      email: 'paul.martin@company.com',
      department: 'Finance',
      position: 'Accountant',
      status: 'Inactive',
      photoUrl: 'https://i.pravatar.cc/150?img=56',
    },
  ];

  getEmployees(): Employee[] {
    return this.employees;
  }

  addEmployee(employee: Employee): void {
    this.employees = [employee, ...this.employees];
  }

  updateEmployee(updated: Employee): void {
    this.employees = this.employees.map((e) =>
      e.id === updated.id ? updated : e
    );
  }

  deleteEmployee(id: number): void {
    this.employees = this.employees.filter((e) => e.id !== id);
  }
}
