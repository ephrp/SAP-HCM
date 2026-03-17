import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
type LeaveType = 'Annual' | 'Sick' | 'Unpaid' | 'Remote';
type ToastType = 'success' | 'error';

interface ApprovalItem {
  id: number;
  employeeName: string;
  email: string;
  department: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  status: LeaveStatus;
  createdAt: string;
  note?: string;
}

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './approvals.component.html',
  styleUrls: ['./approvals.component.scss'],
})
export class ApprovalsComponent {
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

  approvals: ApprovalItem[] = [
    {
      id: 301,
      employeeName: 'Jean Dupont',
      email: 'jean.dupont@company.com',
      department: 'IT',
      type: 'Annual',
      startDate: '2026-03-10',
      endDate: '2026-03-14',
      days: 5,
      status: 'Pending',
      createdAt: '2026-02-10',
      note: 'Vacances famille',
    },
    {
      id: 302,
      employeeName: 'Amina Diallo',
      email: 'amina.diallo@company.com',
      department: 'HR',
      type: 'Sick',
      startDate: '2026-03-05',
      endDate: '2026-03-06',
      days: 2,
      status: 'Pending',
      createdAt: '2026-02-18',
      note: 'Repos médical',
    },
    {
      id: 303,
      employeeName: 'Paul Martin',
      email: 'paul.martin@company.com',
      department: 'Finance',
      type: 'Unpaid',
      startDate: '2026-03-01',
      endDate: '2026-03-03',
      days: 3,
      status: 'Approved',
      createdAt: '2026-02-09',
      note: 'Motif personnel',
    },
  ];

  get filteredApprovals(): ApprovalItem[] {
    const q = this.search.trim().toLowerCase();

    return this.approvals.filter((item) => {
      const matchSearch =
        !q ||
        item.employeeName.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q);

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

  get paginatedApprovals(): ApprovalItem[] {
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

  approve(item: ApprovalItem): void {
    this.approvals = this.approvals.map((a) =>
      a.id === item.id ? { ...a, status: 'Approved' } : a
    );
    this.showToastMessage('Request approved.', 'success');
  }

  reject(item: ApprovalItem): void {
    this.approvals = this.approvals.map((a) =>
      a.id === item.id ? { ...a, status: 'Rejected' } : a
    );
    this.showToastMessage('Request rejected.', 'error');
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