import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';

import { DashboardService } from '../../../../core/services/dashboard.service';

type DashboardScope = 'global' | 'team' | 'personal' | 'unknown';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private dashboardService: DashboardService,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  scope: DashboardScope = 'unknown';

  stats = {
    totalEmployees: 0,
    pendingLeaves: 0,
    trainingHours: 0,
    departments: 0,
  };

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
  } | null = null;

  leaveSummary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  } | null = null;

  leaveHistory: Array<{
    id: number;
    type: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    startDate: string;
    endDate: string;
    days: number;
  }> = [];

  showVideo = false;
  isLoading = false;
  errorMessage = '';

  employeeTrend: number[] = [0, 0, 0, 0, 0, 0];
  chartMonths: string[] = [];

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.refreshDashboard();
  }

  refreshDashboard(): void {
    if (!this.isBrowser) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService.getStats().subscribe({
      next: (response) => {
        this.scope = response.scope;
        this.stats = response.stats;
        this.chartMonths = response.chartMonths;
        this.employeeTrend = response.employeeTrend;
        this.profile = response.profile;
        this.leaveSummary = response.leaveSummary;
        this.leaveHistory = response.leaveHistory;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Dashboard load error:', err);

        this.scope = 'unknown';
        this.stats = {
          totalEmployees: 0,
          pendingLeaves: 0,
          trainingHours: 0,
          departments: 0,
        };
        this.profile = null;
        this.leaveSummary = null;
        this.leaveHistory = [];
        this.chartMonths = [];
        this.employeeTrend = [0, 0, 0, 0, 0, 0];
        this.errorMessage = 'Impossible de charger les données du dashboard.';
        this.isLoading = false;
      },
    });
  }

  get dashboardTitle(): string {
    if (this.scope === 'global') return 'Dashboard RH global';
    if (this.scope === 'team') return 'Dashboard manager';
    if (this.scope === 'personal') return 'Mon espace personnel';
    return 'Dashboard RH';
  }

  get dashboardSubtitle(): string {
    if (this.scope === 'global') return 'Vue synthèse de toute l’entreprise.';
    if (this.scope === 'team') return 'Vue synthèse des indicateurs de votre équipe.';
    if (this.scope === 'personal') return 'Vos informations, vos congés et votre activité récente.';
    return 'Vue synthèse des indicateurs clés.';
  }

  get totalEmployeesLabel(): string {
    if (this.scope === 'team') return 'Membres de l’équipe';
    if (this.scope === 'personal') return 'Mon profil';
    return 'Effectif total';
  }

  get pendingLeavesLabel(): string {
    if (this.scope === 'team') return 'Congés en attente';
    if (this.scope === 'personal') return 'Mes congés en attente';
    return 'Congés en attente';
  }

  get departmentsLabel(): string {
    if (this.scope === 'team') return 'Départements couverts';
    if (this.scope === 'personal') return 'Département';
    return 'Départements';
  }

  get canShowChart(): boolean {
    return this.scope === 'global' || this.scope === 'team';
  }

  get isPersonalDashboard(): boolean {
    return this.scope === 'personal';
  }

  get profileAvatar(): string {
    if (this.profile?.photoUrl?.trim()) return this.profile.photoUrl;
    if (this.profile?.email) {
      return `https://i.pravatar.cc/150?u=${encodeURIComponent(this.profile.email)}`;
    }
    return 'https://i.pravatar.cc/150?u=employee';
  }

  get trendPercentage(): number {
    if (this.employeeTrend.length < 2) return 0;

    const previous = this.employeeTrend[this.employeeTrend.length - 2];
    const current = this.employeeTrend[this.employeeTrend.length - 1];

    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return Math.round(((current - previous) / previous) * 100);
  }

  get trendLabel(): string {
    if (this.trendPercentage > 0) return `+${this.trendPercentage}%`;
    if (this.trendPercentage < 0) return `${this.trendPercentage}%`;
    return '0%';
  }

  get trendDirection(): 'up' | 'down' | 'stable' {
    if (this.trendPercentage > 0) return 'up';
    if (this.trendPercentage < 0) return 'down';
    return 'stable';
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