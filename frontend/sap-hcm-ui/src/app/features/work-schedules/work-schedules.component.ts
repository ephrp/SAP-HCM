import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  WorkSchedule,
  WorkScheduleService,
} from '../../core/services/work-schedule.service';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';

type ScheduleRow = {
  dayOfWeek: number;
  label: string;
  isWorkingDay: boolean;
  startTime: string;
  endTime: string;
  breakMinutes: number;
};

type EmployeeOption = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  position?: string;
};

@Component({
  selector: 'app-work-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-schedules.component.html',
  styleUrls: ['./work-schedules.component.scss'],
})
export class WorkSchedulesComponent implements OnInit {
  employeeId = 0;
  employees: EmployeeOption[] = [];

  isLoading = false;
  isSaving = false;
  isLoadingEmployees = false;

  errorMessage = '';
  successMessage = '';

  rows: ScheduleRow[] = this.getDefaultRows();

  constructor(
    private scheduleService: WorkScheduleService,
    public authService: AuthService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();

    if (this.canSelectEmployee) {
      this.loadAssignableEmployees();
      return;
    }

    if (user?.employeeId) {
      this.employeeId = user.employeeId;
      this.loadSchedule();
    }
  }

  get canSelectEmployee(): boolean {
    return this.authService.isHrAdmin() || this.authService.isManager();
  }

  get canEditSchedule(): boolean {
  return this.authService.isHrAdmin() || this.authService.isManager();
}

  loadAssignableEmployees(): void {
    this.isLoadingEmployees = true;
    this.errorMessage = '';

    this.http
      .get<EmployeeOption[]>('http://localhost:3000/trainings/assignable-employees')
      .subscribe({
        next: (employees) => {
          this.employees = employees;
          this.isLoadingEmployees = false;

          if (employees.length > 0) {
            this.employeeId = employees[0].id;
            this.loadSchedule();
          }
        },
        error: () => {
          this.errorMessage = 'Impossible de charger la liste des employés.';
          this.isLoadingEmployees = false;
        },
      });
  }

  onEmployeeChange(): void {
    this.rows = this.getDefaultRows();
    this.loadSchedule();
  }

  loadSchedule(): void {
    if (!this.employeeId) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.scheduleService.getEmployeeSchedule(this.employeeId).subscribe({
      next: (schedules) => {
        this.rows = this.getDefaultRows();
        this.applySchedules(schedules);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les horaires.';
        this.isLoading = false;
      },
    });
  }

  saveRow(row: ScheduleRow): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.canEditSchedule) {
  this.errorMessage = 'Vous pouvez consulter votre horaire, mais pas le modifier.';
  return;
}

    if (!this.employeeId) {
      this.errorMessage = 'Aucun employé sélectionné.';
      return;
    }

    if (row.isWorkingDay && (!row.startTime || !row.endTime)) {
      this.errorMessage =
        'Début et fin sont obligatoires pour un jour travaillé.';
      return;
    }

    if (row.isWorkingDay && row.endTime <= row.startTime) {
      this.errorMessage = 'L’heure de fin doit être après l’heure de début.';
      return;
    }

    this.isSaving = true;

    this.scheduleService
      .saveSchedule({
        employeeId: this.employeeId,
        dayOfWeek: row.dayOfWeek,
        isWorkingDay: row.isWorkingDay,
        startTime: row.isWorkingDay ? row.startTime : null,
        endTime: row.isWorkingDay ? row.endTime : null,
        breakMinutes: row.isWorkingDay ? row.breakMinutes : 0,
      })
      .subscribe({
        next: () => {
          this.successMessage = `${row.label} sauvegardé.`;
          this.isSaving = false;
        },
        error: () => {
          this.errorMessage = 'Impossible de sauvegarder cet horaire.';
          this.isSaving = false;
        },
      });
  }

  saveAll(): void {

    if (!this.canEditSchedule) {
  this.errorMessage = 'Vous pouvez consulter votre horaire, mais pas le modifier.';
  return;
}

    for (const row of this.rows) {
      if (row.isWorkingDay && (!row.startTime || !row.endTime)) {
        this.errorMessage =
          'Certains jours travaillés n’ont pas d’heure de début ou de fin.';
        return;
      }

      if (row.isWorkingDay && row.endTime <= row.startTime) {
        this.errorMessage =
          'Certaines heures de fin sont avant les heures de début.';
        return;
      }
    }

    this.rows.forEach((row) => this.saveRow(row));
  }

  applySchedules(schedules: WorkSchedule[]): void {
    for (const schedule of schedules) {
      const row = this.rows.find((r) => r.dayOfWeek === schedule.dayOfWeek);

      if (row) {
        row.isWorkingDay = schedule.isWorkingDay;
        row.startTime = schedule.startTime?.slice(0, 5) ?? '';
        row.endTime = schedule.endTime?.slice(0, 5) ?? '';
        row.breakMinutes = schedule.breakMinutes ?? 0;
      }
    }
  }

  get selectedEmployeeLabel(): string {
    const employee = this.employees.find((e) => e.id === Number(this.employeeId));

    if (!employee) {
      return `Employé #${this.employeeId}`;
    }

    return `${employee.firstName} ${employee.lastName}`;
  }

  get workingDaysCount(): number {
    return this.rows.filter((row) => row.isWorkingDay).length;
  }

  get weeklyHours(): number {
    return this.rows.reduce((total, row) => {
      if (!row.isWorkingDay || !row.startTime || !row.endTime) return total;

      const start = this.toMinutes(row.startTime);
      const end = this.toMinutes(row.endTime);
      const worked = Math.max(0, end - start - row.breakMinutes);

      return total + worked / 60;
    }, 0);
  }

  private toMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getDefaultRows(): ScheduleRow[] {
    return [
      {
        dayOfWeek: 1,
        label: 'Lundi',
        isWorkingDay: true,
        startTime: '09:00',
        endTime: '17:00',
        breakMinutes: 60,
      },
      {
        dayOfWeek: 2,
        label: 'Mardi',
        isWorkingDay: true,
        startTime: '09:00',
        endTime: '17:00',
        breakMinutes: 60,
      },
      {
        dayOfWeek: 3,
        label: 'Mercredi',
        isWorkingDay: true,
        startTime: '09:00',
        endTime: '17:00',
        breakMinutes: 60,
      },
      {
        dayOfWeek: 4,
        label: 'Jeudi',
        isWorkingDay: true,
        startTime: '09:00',
        endTime: '17:00',
        breakMinutes: 60,
      },
      {
        dayOfWeek: 5,
        label: 'Vendredi',
        isWorkingDay: true,
        startTime: '09:00',
        endTime: '17:00',
        breakMinutes: 60,
      },
      {
        dayOfWeek: 6,
        label: 'Samedi',
        isWorkingDay: false,
        startTime: '',
        endTime: '',
        breakMinutes: 0,
      },
      {
        dayOfWeek: 7,
        label: 'Dimanche',
        isWorkingDay: false,
        startTime: '',
        endTime: '',
        breakMinutes: 0,
      },
    ];
  }
}