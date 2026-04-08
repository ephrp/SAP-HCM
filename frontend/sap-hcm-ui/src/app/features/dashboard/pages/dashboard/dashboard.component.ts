import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../../../core/services/auth.service';
import {
  Employee,
  EmployeeService,
} from '../../../../core/services/employee.service';
import {
  LeaveRequest,
  LeaveService,
} from '../../../../core/services/leave.service';
import {
  Training,
  TrainingService,
} from '../../../../core/services/training.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private authService: AuthService,
    private employeeService: EmployeeService,
    private leaveService: LeaveService,
    private trainingService: TrainingService
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  stats = {
    totalEmployees: 0,
    pendingLeaves: 0,
    trainingHours: 0,
    departments: 0,
  };

  showVideo = false;
  isLoading = false;
  errorMessage = '';

  employeeTrend: number[] = [0, 0, 0, 0, 0, 0];
  readonly chartMonths = ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'];

  ngOnInit(): void {
    this.refreshDashboard();
  }

  refreshDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const user = this.authService.getUser();
    const trainings: Training[] = this.trainingService.getTrainings();

    forkJoin({
      employees: this.employeeService.getEmployees(),
      leaves: this.leaveService.getLeaves(),
    }).subscribe({
      next: ({
        employees,
        leaves,
      }: {
        employees: Employee[];
        leaves: LeaveRequest[];
      }) => {
        const activeEmployees = employees.filter(
          (employee: Employee) => employee.status === 'Active'
        );

        const visibleLeaves =
          this.authService.isEmployee() && user?.email
            ? leaves.filter(
                (leave: LeaveRequest) => leave.employee.email === user.email
              )
            : leaves;

        const pendingLeaves = visibleLeaves.filter(
          (leave: LeaveRequest) => leave.status === 'Pending'
        ).length;

        const totalEmployees = this.authService.isEmployee()
          ? 1
          : activeEmployees.length;

        const departments = this.authService.isEmployee()
          ? 1
          : new Set(
              activeEmployees
                .map((employee: Employee) => employee.department?.name)
                .filter((name): name is string => !!name)
            ).size;

        const trainingHours = trainings.reduce(
          (sum: number, training: Training) => sum + training.durationHours,
          0
        );

        this.stats = {
          totalEmployees,
          pendingLeaves,
          trainingHours,
          departments,
        };

        this.buildEmployeeTrend(totalEmployees);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Dashboard load error:', err);

        this.stats = {
          totalEmployees: 0,
          pendingLeaves: 0,
          trainingHours: 0,
          departments: 0,
        };

        this.buildEmployeeTrend(0);
        this.errorMessage = 'Impossible de charger les données du dashboard.';
        this.isLoading = false;
      },
    });
  }

  private buildEmployeeTrend(totalEmployees: number): void {
    this.employeeTrend = [
      Math.max(0, totalEmployees - 10),
      Math.max(0, totalEmployees - 8),
      Math.max(0, totalEmployees - 6),
      Math.max(0, totalEmployees - 4),
      Math.max(0, totalEmployees - 2),
      totalEmployees,
    ];
  }

  getChartPoints(): string {
    const baseX = 70;
    const stepX = 100;
    const max = Math.max(...this.employeeTrend, 1);

    return this.employeeTrend
      .map((value, index) => {
        const x = baseX + index * stepX;
        const y = 180 - (value / max) * 120;
        return `${x} ${y}`;
      })
      .join(' L ');
  }

  getFillPath(): string {
    return `M ${this.getChartPoints()} L 570 180 L 70 180 Z`;
  }

  getDots(): { x: number; y: number; value: number }[] {
    const baseX = 70;
    const stepX = 100;
    const max = Math.max(...this.employeeTrend, 1);

    return this.employeeTrend.map((value, index) => {
      const x = baseX + index * stepX;
      const y = 180 - (value / max) * 120;
      return { x, y, value };
    });
  }

  openVideo(): void {
    this.showVideo = true;
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeVideo(): void {
    this.showVideo = false;
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }
}