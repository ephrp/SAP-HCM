import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CreateLeavePayload,
  LeaveRequest,
  LeaveService,
  LeaveStatus,
  LeaveType,
} from '../../../../core/services/leave.service';
import { AuthService } from '../../../../core/services/auth.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leaves.component.html',
  styleUrls: ['./leaves.component.scss'],
})
export class LeavesComponent implements OnInit {
  search = '';
  statusFilter: 'All' | LeaveStatus = 'All';
  typeFilter: 'All' | LeaveType = 'All';

  currentPage = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10, 20];

  showModal = false;
  editingLeaveId: number | null = null;

  form = {
    employeeName: '',
    email: '',
    departmentName: '',
    type: 'Annual' as LeaveType,
    startDate: '',
    endDate: '',
    note: '',
  };

  showToast = false;
  toastMessage = '';
  toastType: ToastType = 'success';
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  leaves: LeaveRequest[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private leaveService: LeaveService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.prefillEmployeeForm();
    this.loadLeaves();
  }

  get canManageLeaves(): boolean {
    return this.authService.isManager() || this.authService.isHrAdmin();
  }

  get isEmployeeMode(): boolean {
    return this.authService.isEmployee();
  }

  get visibleLeaves(): LeaveRequest[] {
    if (this.canManageLeaves) return this.leaves;

    const userEmail = this.authService.getUser()?.email;
    if (!userEmail) return [];

    return this.leaves.filter((leave) => leave.employee.email === userEmail);
  }

  get filteredLeaves(): LeaveRequest[] {
    const q = this.search.trim().toLowerCase();

    return this.visibleLeaves.filter((leave) => {
      const fullName =
        `${leave.employee.firstName} ${leave.employee.lastName}`.toLowerCase();

      return (
        (!q ||
          fullName.includes(q) ||
          leave.employee.email.toLowerCase().includes(q)) &&
        (this.statusFilter === 'All' || leave.status === this.statusFilter) &&
        (this.typeFilter === 'All' || leave.type === this.typeFilter)
      );
    });
  }

  get totalItems(): number {
    return this.filteredLeaves.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.totalItems);
  }

  get paginatedLeaves(): LeaveRequest[] {
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    return this.filteredLeaves.slice(this.startIndex, this.endIndex);
  }

  get previewDays(): number {
    return this.calculateDays(this.form.startDate, this.form.endDate);
  }

  loadLeaves(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.leaveService.getLeaves().subscribe({
      next: (data) => {
        this.leaves = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les congés.';
        this.isLoading = false;
      },
    });
  }

  resetFilters(): void {
    this.search = '';
    this.statusFilter = 'All';
    this.typeFilter = 'All';
    this.currentPage = 1;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(this.totalPages, Math.max(1, page));
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  approve(leave: LeaveRequest): void {
    if (!this.canManageLeaves) return;

    this.leaveService.approveLeave(leave.id).subscribe({
      next: () => {
        this.loadLeaves();
        this.showToastMessage('Leave approved.', 'success');
      },
      error: () => {
        this.showToastMessage('Impossible d’approuver.', 'error');
      },
    });
  }

  reject(leave: LeaveRequest): void {
    if (!this.canManageLeaves) return;
  }

  deleteLeave(leave: LeaveRequest): void {
    if (this.canManageLeaves) return;
    if (leave.status !== 'Pending') return;

    if (!confirm('Supprimer cette demande ?')) return;

    this.leaveService.deleteLeave(leave.id).subscribe({
      next: () => {
        this.loadLeaves();
        this.showToastMessage('Demande supprimée.', 'success');
      },
      error: (err) => {
        this.showToastMessage(
          err?.error?.message ?? 'Erreur suppression',
          'error'
        );
      },
    });
  }

  openEdit(leave: LeaveRequest): void {
    if (leave.status !== 'Pending') return;

    this.editingLeaveId = leave.id;

    this.form = {
      employeeName: `${leave.employee.firstName} ${leave.employee.lastName}`,
      email: leave.employee.email,
      departmentName: leave.employee.department?.name || '',
      type: leave.type,
      startDate: leave.startDate,
      endDate: leave.endDate,
      note: leave.note || '',
    };

    this.showModal = true;
  }

  openModal(): void {
    this.resetForm();
    this.prefillEmployeeForm();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingLeaveId = null;
  }

  createRequest(): void {
    if (
      !this.form.employeeName.trim() ||
      !this.form.email.trim() ||
      !this.form.startDate ||
      !this.form.endDate
    ) {
      this.showToastMessage('Champs obligatoires manquants.', 'error');
      return;
    }

    const days = this.calculateDays(
      this.form.startDate,
      this.form.endDate
    );

    if (days <= 0) {
      this.showToastMessage('Dates invalides.', 'error');
      return;
    }

    const payload: CreateLeavePayload = {
      type: this.form.type,
      startDate: this.form.startDate,
      endDate: this.form.endDate,
      days,
      status: 'Pending',
      note: this.form.note.trim() || undefined,
    };

    if (this.editingLeaveId) {
      this.leaveService.updateLeave(this.editingLeaveId, {
        type: payload.type,
        startDate: payload.startDate,
        endDate: payload.endDate,
        days: payload.days,
        note: payload.note,
      }).subscribe({
        next: () => {
          this.loadLeaves();
          this.closeModal();
          this.resetForm();
          this.showToastMessage('Leave updated.', 'success');
        },
        error: () => {
          this.showToastMessage('Erreur modification.', 'error');
        },
      });

      return;
    }

    this.leaveService.createLeave(payload).subscribe({
      next: () => {
        this.loadLeaves();
        this.currentPage = 1;
        this.resetForm();
        this.prefillEmployeeForm();
        this.closeModal();
        this.showToastMessage('Leave created.', 'success');
      },
      error: () => {
        this.showToastMessage('Erreur création.', 'error');
      },
    });
  }

  dismissToast(): void {
    this.showToast = false;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  private showToastMessage(message: string, type: ToastType): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    if (this.toastTimeout) clearTimeout(this.toastTimeout);

    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  statusLabel(status: LeaveStatus): string {
    switch (status) {
      case 'Pending':
        return 'En attente';
      case 'Approved':
        return 'Approuvé';
      case 'Rejected':
        return 'Refusé';
      default:
        return status;
    }
  }

  private prefillEmployeeForm(): void {
    const user = this.authService.getUser();

    if (user && this.authService.isEmployee()) {
      const fullName =
        `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.name;

      this.form.employeeName = fullName;
      this.form.email = user.email;
      this.form.departmentName = user.departmentName ?? '';
    }
  }

  private resetForm(): void {
    this.form = {
      employeeName: '',
      email: '',
      departmentName: '',
      type: 'Annual',
      startDate: '',
      endDate: '',
      note: '',
    };
  }

  private calculateDays(startDate: string, endDate: string): number {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) return 0;

    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }
}