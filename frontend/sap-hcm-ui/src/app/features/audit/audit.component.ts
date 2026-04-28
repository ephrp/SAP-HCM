import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditLog, AuditService } from '../../core/services/audit.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.scss',
})
export class AuditComponent implements OnInit {
  logs: AuditLog[] = [];
  isLoading = false;
  errorMessage = '';

  searchTerm = '';
  selectedAction = 'ALL';

  constructor(private auditService: AuditService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.auditService.getLogs().subscribe({
      next: (logs) => {
        this.logs = logs;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Audit logs error:', err);
        this.errorMessage = 'Impossible de charger les logs.';
        this.isLoading = false;
      },
    });
  }

  get actions(): string[] {
    return ['ALL', ...new Set(this.logs.map((log) => log.action))];
  }

  get leaveCount(): number {
    return this.logs.filter((log) => log.action.includes('LEAVE')).length;
  }

  get trainingCount(): number {
    return this.logs.filter((log) => log.action.includes('TRAINING')).length;
  }

  get accountCount(): number {
    return this.logs.filter((log) => log.action.includes('ACCOUNT')).length;
  }

  get filteredLogs(): AuditLog[] {
    const term = this.searchTerm.toLowerCase().trim();

    return this.logs.filter((log) => {
      const matchesAction =
        this.selectedAction === 'ALL' || log.action === this.selectedAction;

      const matchesSearch =
        !term ||
        log.message.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        (log.actorEmail ?? '').toLowerCase().includes(term) ||
        log.targetType.toLowerCase().includes(term);

      return matchesAction && matchesSearch;
    });
  }

  getActionLabel(action: string): string {
    return action.replaceAll('_', ' ');
  }

  getActionClass(action: string): string {
    if (action.includes('APPROVED')) return 'badge badge--success';
    if (action.includes('REJECTED')) return 'badge badge--danger';
    if (action.includes('CREATED')) return 'badge badge--info';
    if (action.includes('ASSIGNED')) return 'badge badge--warning';
    return 'badge';
  }

  getActionIcon(action: string): string {
    if (action.includes('LEAVE')) return '🌴';
    if (action.includes('TRAINING')) return '🎓';
    if (action.includes('EMPLOYEE')) return '👤';
    if (action.includes('ACCOUNT')) return '🔐';
    return '🧾';
  }
}