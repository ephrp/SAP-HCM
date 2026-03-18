import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
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
export class LeavesComponent {
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

  constructor(
    private leaveService: LeaveService,
    public authService: AuthService
  ) {
    this.leaves = this.leaveService.getLeaves();

    // préremplir automatiquement si employé
    const user = this.authService.getUser();
    if (user && this.authService.isEmployee()) {
      this.form.employeeName = user.name;
      this.form.email = user.email;
    }
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

    return this.leaves.filter((leave) => leave.email === userEmail);
  }

  get filteredLeaves(): LeaveRequest[] {
    const q = this.search.trim().toLowerCase();

    return this.visibleLeaves.filter((leave) => {
      const matchSearch =
        !q ||
        leave.employeeName.toLowerCase().includes(q) ||
        leave.email.toLowerCase().includes(q);

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

    this.leaveService.approveLeave(leave.id);
    this.leaves = this.leaveService.getLeaves();
    this.showToastMessage('Leave request approved.', 'success');
  }

  reject(leave: LeaveRequest): void {
    if (!this.canManageLeaves) return;

    this.leaveService.rejectLeave(leave.id);
    this.leaves = this.leaveService.getLeaves();
    this.showToastMessage('Leave request rejected.', 'error');
  }

  statusLabel(status: LeaveStatus): string {
    return status;
  }

  openModal(): void {
    const user = this.authService.getUser();

    if (user && this.authService.isEmployee()) {
      this.form.employeeName = user.name;
      this.form.email = user.email;
    }

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

    const nextId =
      this.leaves.length > 0
        ? Math.max(...this.leaves.map((leave) => leave.id)) + 1
        : 1;

    const newLeave: LeaveRequest = {
      id: nextId,
      employeeName: this.form.employeeName.trim(),
      email: this.form.email.trim(),
      department: 'Unknown',
      type: this.form.type,
      startDate: this.form.startDate,
      endDate: this.form.endDate,
      days,
      status: 'Pending',
      createdAt: this.getToday(),
      note: this.form.note.trim(),
    };

    this.leaveService.addLeave(newLeave);
    this.leaves = this.leaveService.getLeaves();

    this.currentPage = 1;
    this.resetForm();

    const user = this.authService.getUser();
    if (user && this.authService.isEmployee()) {
      this.form.employeeName = user.name;
      this.form.email = user.email;
    }

    this.closeModal();
    this.showToastMessage('Leave request created successfully.', 'success');
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

  private resetForm(): void {
    this.form = {
      employeeName: '',
      email: '',
      type: 'Annual',
      startDate: '',
      endDate: '',
      note: '',
    };
  }

  private getToday(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
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