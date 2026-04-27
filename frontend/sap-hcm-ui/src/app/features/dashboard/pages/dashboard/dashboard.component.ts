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

  // =========================
  // GLOBAL STATE
  // =========================
  scope: DashboardScope = 'unknown';

  stats = {
    totalEmployees: 0,
    pendingLeaves: 0,
    trainingHours: 0,
    departments: 0,
  };

  profile: any = null;
  leaveSummary: any = null;
  leaveHistory: any[] = [];

  // 🔥 FORMATIONS
  trainingSummary: {
    total: number;
    inProgress: number;
    completed: number;
  } | null = null;

  trainingList: Array<{
    id: number;
    title: string;
    progress: number;
    status: string;
    dueDate?: string;
  }> = [];

  // UI
  isLoading = false;
  errorMessage = '';
  showVideo = false;

  // Chart
  employeeTrend: number[] = [];
  chartMonths: string[] = [];

  // =========================
  // INIT
  // =========================
  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.refreshDashboard();
  }

  // =========================
  // LOAD DASHBOARD
  // =========================
  refreshDashboard(): void {
    if (!this.isBrowser) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService.getStats().subscribe({
      next: (res) => {
        this.scope = res.scope;

        this.stats = res.stats;
        this.profile = res.profile;
        this.leaveSummary = res.leaveSummary;
        this.leaveHistory = res.leaveHistory;

        // 🔥 FORMATIONS
        this.trainingSummary = res.trainingSummary;
        this.trainingList = res.trainingList;

        this.chartMonths = res.chartMonths;
        this.employeeTrend = res.employeeTrend;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Dashboard error:', err);

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

        this.trainingSummary = null;
        this.trainingList = [];

        this.chartMonths = [];
        this.employeeTrend = [];

        this.errorMessage = 'Erreur de chargement du dashboard';
        this.isLoading = false;
      },
    });
  }

  // =========================
  // GETTERS
  // =========================

  get isPersonalDashboard(): boolean {
    return this.scope === 'personal';
  }

  get canShowChart(): boolean {
    return this.scope === 'global' || this.scope === 'team';
  }

  get dashboardTitle(): string {
    if (this.scope === 'global') return 'Dashboard RH global';
    if (this.scope === 'team') return 'Dashboard manager';
    if (this.scope === 'personal') return 'Mon espace personnel';
    return 'Dashboard RH';
  }

  get dashboardSubtitle(): string {
    if (this.scope === 'global') return 'Vue globale de l’entreprise';
    if (this.scope === 'team') return 'Vue de votre équipe';
    if (this.scope === 'personal') return 'Vos informations personnelles';
    return '';
  }

  get totalEmployeesLabel(): string {
    if (this.scope === 'team') return 'Équipe';
    if (this.scope === 'personal') return 'Mon profil';
    return 'Employés';
  }

  get pendingLeavesLabel(): string {
    if (this.scope === 'team') return 'Congés équipe';
    if (this.scope === 'personal') return 'Mes congés';
    return 'Congés';
  }

  get departmentsLabel(): string {
    if (this.scope === 'team') return 'Départements';
    if (this.scope === 'personal') return 'Département';
    return 'Départements';
  }

  get profileAvatar(): string {
    if (this.profile?.photoUrl) return this.profile.photoUrl;
    return 'https://i.pravatar.cc/150';
  }

  // =========================
  // CHART
  // =========================

  get trendPercentage(): number {
    if (this.employeeTrend.length < 2) return 0;

    const prev = this.employeeTrend[this.employeeTrend.length - 2];
    const curr = this.employeeTrend[this.employeeTrend.length - 1];

    if (prev === 0) return curr > 0 ? 100 : 0;

    return Math.round(((curr - prev) / prev) * 100);
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
      .map((v, i) => {
        const x = baseX + i * stepX;
        const y = 180 - (v / max) * 120;
        return `${x} ${y}`;
      })
      .join(' L ');
  }

  getFillPath(): string {
    return `M ${this.getChartPoints()} L 570 180 L 70 180 Z`;
  }

  getDots() {
    const baseX = 70;
    const stepX = 100;
    const max = Math.max(...this.employeeTrend, 1);

    return this.employeeTrend.map((v, i) => {
      return {
        x: baseX + i * stepX,
        y: 180 - (v / max) * 120,
        value: v,
      };
    });
  }

  // =========================
  // VIDEO
  // =========================

  openVideo(): void {
    this.showVideo = true;
  }

  closeVideo(): void {
    this.showVideo = false;
  }
}