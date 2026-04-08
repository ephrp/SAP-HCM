import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LeaveRequest,
  LeaveService,
  LeaveStatus,
  LeaveType,
} from '../../../../core/services/leave.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './approvals.component.html',
  styleUrls: ['./approvals.component.scss'],
})
export class ApprovalsComponent implements OnInit {
  search = '';
  statusFilter: 'All' | LeaveStatus = 'Pending';
  typeFilter: 'All' | LeaveType = 'All';

  currentPage = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10, 20];

  showToast = false;
  toastMessage = '';
  toastType: ToastType = 'success';
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  approvals: LeaveRequest[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private leaveService: LeaveService) {}

  ngOnInit(): void {
    this.loadApprovals();
  }

  loadApprovals(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.leaveService.getLeaves().subscribe({
      next: (data) => {
        this.approvals = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Load approvals error:', err);
        this.errorMessage = 'Impossible de charger les validations.';
        this.isLoading = false;
      },
    });
  }

  get filteredApprovals(): LeaveRequest[] {
    const q = this.search.trim().toLowerCase();

    return this.approvals.filter((item) => {
      const fullName =
        `${item.employee.firstName} ${item.employee.lastName}`.toLowerCase();

      const departmentName = item.employee.department?.name ?? '';

      const matchSearch =
        !q ||
        fullName.includes(q) ||
        item.employee.email.toLowerCase().includes(q) ||
        departmentName.toLowerCase().includes(q);

      const matchStatus =
        this.statusFilter === 'All' || item.status === this.statusFilter;

      const matchType =
        this.typeFilter === 'All' || item.type === this.typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }

  get totalItems(): number {
    return this.filteredApprovals.length;
  }

  get pendingCount(): number {
    return this.approvals.filter((a) => a.status === 'Pending').length;
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

  get paginatedApprovals(): LeaveRequest[] {
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    return this.filteredApprovals.slice(this.startIndex, this.endIndex);
  }

  resetFilters(): void {
    this.search = '';
    this.statusFilter = 'Pending';
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

  approve(item: LeaveRequest): void {
    this.leaveService.approveLeave(item.id).subscribe({
      next: () => {
        this.loadApprovals();
        this.showToastMessage('Request approved.', 'success');
      },
      error: (err) => {
        console.error('Approve request error:', err);
        this.showToastMessage('Impossible d’approuver la demande.', 'error');
      },
    });
  }

  reject(item: LeaveRequest): void {
    this.leaveService.rejectLeave(item.id).subscribe({
      next: () => {
        this.loadApprovals();
        this.showToastMessage('Request rejected.', 'error');
      },
      error: (err) => {
        console.error('Reject request error:', err);
        this.showToastMessage('Impossible de rejeter la demande.', 'error');
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
    }, 2600);
  }
}