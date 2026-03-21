import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { LeaveService } from '../../../../core/services/leave.service';
import { TrainingService } from '../../../../core/services/training.service';

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

  // Données du graphe
  employeeTrend: number[] = [0, 0, 0, 0, 0, 0];
  readonly chartMonths = ['Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'];

  ngOnInit(): void {
    this.refreshDashboard();
  }

  refreshDashboard(): void {
    const user = this.authService.getUser();

    const employees = this.employeeService.getEmployees();
    const leaves = this.leaveService.getLeaves();
    const trainings = this.trainingService.getTrainings();

    const activeEmployees = employees.filter((e) => e.status === 'Active');

    const visibleLeaves =
      this.authService.isEmployee() && user?.email
        ? leaves.filter((leave) => leave.email === user.email)
        : leaves;

    const pendingLeaves = visibleLeaves.filter(
      (leave) => leave.status === 'Pending'
    ).length;

    const totalEmployees = this.authService.isEmployee()
      ? 1
      : activeEmployees.length;

    const departments = this.authService.isEmployee()
      ? 1
      : new Set(activeEmployees.map((employee) => employee.department)).size;

    const trainingHours = trainings.reduce(
      (sum, training) => sum + training.durationHours,
      0
    );

    this.stats = {
      totalEmployees,
      pendingLeaves,
      trainingHours,
      departments,
    };

    this.buildEmployeeTrend(totalEmployees);
  }

  private buildEmployeeTrend(totalEmployees: number): void {
    // Simulation cohérente avec la valeur réelle actuelle
    // Le dernier point = totalEmployees
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