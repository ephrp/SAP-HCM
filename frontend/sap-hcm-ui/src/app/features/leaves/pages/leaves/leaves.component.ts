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

  get visibleLeaves(): LeaveRequest[] {
    if (this.canManageLeaves) {
      return this.leaves;
    }

    const userEmail = this.authService.getUser()?.email;
    if (!userEmail) return [];

    return this.leaves.filter((leave) => leave.employee.email === userEmail);
  }

  get filteredLeaves(): LeaveRequest[] {
    const q = this.search.trim().toLowerCase();

    return this.visibleLeaves.filter((leave) => {
      const fullName =
        `${leave.employee.firstName} ${leave.employee.lastName}`.toLowerCase();

      const matchSearch =
        !q ||
        fullName.includes(q) ||
        leave.employee.email.toLowerCase().includes(q);

      const matchStatus =
        this.statusFilter === 'All' || leave.status === this.statusFilter;

      const matchType =
        this.typeFilter === 'All' || leave.type === this.typeFilter;

      return matchSearch && matchStatus && matchType;
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
      error: (err) => {
        console.error('Load leaves error:', err);
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
        this.showToastMessage('Leave request approved.', 'success');
      },
      error: (err) => {
        console.error('Approve leave error:', err);
        this.showToastMessage('Impossible d’approuver la demande.', 'error');
      },
    });
  }

  reject(leave: LeaveRequest): void {
    if (!this.canManageLeaves) return;

    this.leaveService.rejectLeave(leave.id).subscribe({
      next: () => {
        this.loadLeaves();
        this.showToastMessage('Leave request rejected.', 'error');
      },
      error: (err) => {
        console.error('Reject leave error:', err);
        this.showToastMessage('Impossible de rejeter la demande.', 'error');
      },
    });
  }

  statusLabel(status: LeaveStatus): string {
    return status;
  }

  openModal(): void {
    this.prefillEmployeeForm();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  createRequest(): void {
    if (
      !this.form.employeeName.trim() ||
      !this.form.email.trim() ||
      !this.form.startDate ||
      !this.form.endDate
    ) {
      this.showToastMessage('Veuillez remplir les champs obligatoires.', 'error');
      return;
    }

    const days = this.calculateDays(this.form.startDate, this.form.endDate);

    if (days <= 0) {
      this.showToastMessage('Les dates sont invalides.', 'error');
      return;
    }

    const payload: CreateLeavePayload = {
      employeeName: this.form.employeeName.trim(),
      email: this.form.email.trim(),
      departmentName: this.form.departmentName.trim() || undefined,
      type: this.form.type,
      startDate: this.form.startDate,
      endDate: this.form.endDate,
      days,
      status: 'Pending',
      note: this.form.note.trim() || undefined,
    };

    this.leaveService.createLeave(payload).subscribe({
      next: () => {
        this.loadLeaves();
        this.currentPage = 1;
        this.resetForm();
        this.prefillEmployeeForm();
        this.closeModal();
        this.showToastMessage('Leave request created successfully.', 'success');
      },
      error: (err) => {
        console.error('Create leave error:', err);
        this.showToastMessage('Impossible de créer la demande.', 'error');
      },
    });
  }

  dismissToast(): void {
    this.showToast = false;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
      this.toastTimeout = null;
    }
  }

  private showToastMessage(message: string, type: ToastType): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    if (this.toastTimeout) clearTimeout(this.toastTimeout);

    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
    }, 2800);
  }

  private prefillEmployeeForm(): void {
    const user = this.authService.getUser();

    if (user && this.authService.isEmployee()) {
      this.form.employeeName = user.name;
      this.form.email = user.email;
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

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    if (end < start) return 0;

    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }
}