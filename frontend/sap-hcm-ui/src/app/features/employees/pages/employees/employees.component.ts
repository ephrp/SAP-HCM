import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Employee,
  EmployeeService,
  CreateEmployeePayload,
  UpdateEmployeePayload,
} from '../../../../core/services/employee.service';

type StatusFilter = 'All' | 'Active' | 'Inactive';
type ModalMode = 'create' | 'edit';
type SortColumn = 'id' | 'name' | 'email' | 'department' | 'position' | 'status';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss'],
})
export class Employees implements OnInit {
  employees: Employee[] = [];
  isLoading = false;
  errorMessage = '';

  search = '';
  departmentFilter = 'All';
  statusFilter: StatusFilter = 'All';

  showModal = false;
  modalMode: ModalMode = 'create';
  editingId: number | null = null;

  form = {
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    position: '',
    status: 'Active' as 'Active' | 'Inactive',
    photoUrl: '',
  };

  showDelete = false;
  deleteTarget: Employee | null = null;

  currentPage = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10, 20];

  sortColumn: SortColumn = 'id';
  sortDirection: SortDirection = 'asc';

  selectedIds = new Set<number>();
  showBulkDelete = false;

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.fetchEmployees();
  }

  fetchEmployees(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.employeeService.getEmployees().subscribe({
      next: (employees) => {
        this.employees = employees;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les employés.';
        this.isLoading = false;
      },
    });
  }

  getAvatar(employee: Employee): string {
    return (
      employee.photoUrl ||
      `https://i.pravatar.cc/150?u=${encodeURIComponent(employee.email)}`
    );
  }

  get departments(): string[] {
    const unique = Array.from(
      new Set(
        this.employees
          .map((e) => e.department?.name)
          .filter((name): name is string => !!name)
      )
    );

    return unique.sort((a, b) => a.localeCompare(b));
  }

  private normalize(s: string): string {
    return s.trim().toLowerCase();
  }

  private compare(a: string | number, b: string | number): number {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  }

  private getSortValue(e: Employee, col: SortColumn): string | number {
    switch (col) {
      case 'id':
        return e.id;
      case 'name':
        return this.normalize(`${e.firstName} ${e.lastName}`);
      case 'email':
        return this.normalize(e.email);
      case 'department':
        return this.normalize(e.department?.name ?? '');
      case 'position':
        return this.normalize(e.position);
      case 'status':
        return e.status;
    }
  }

  get filteredEmployees(): Employee[] {
    const q = this.search.trim().toLowerCase();

    return this.employees.filter((e) => {
      const departmentName = e.department?.name ?? '';

      const matchesSearch =
        !q ||
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        departmentName.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q);

      const matchesDept =
        this.departmentFilter === 'All' || departmentName === this.departmentFilter;

      const matchesStatus =
        this.statusFilter === 'All' || e.status === this.statusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }

  get sortedEmployees(): Employee[] {
    const list = [...this.filteredEmployees];
    const dir = this.sortDirection === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      const va = this.getSortValue(a, this.sortColumn);
      const vb = this.getSortValue(b, this.sortColumn);
      return this.compare(va, vb) * dir;
    });

    return list;
  }

  get totalItems(): number {
    return this.sortedEmployees.length;
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

  get paginatedEmployees(): Employee[] {
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    return this.sortedEmployees.slice(this.startIndex, this.endIndex);
  }

  setSort(col: SortColumn): void {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
  }

  sortIcon(col: SortColumn): string {
    if (this.sortColumn !== col) return '↕';
    return this.sortDirection === 'asc' ? '↑' : '↓';
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

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.search = '';
    this.departmentFilter = 'All';
    this.statusFilter = 'All';
    this.currentPage = 1;
  }

  get pages(): number[] {
    const total = this.totalPages;
    const cur = this.currentPage;

    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

    const start = Math.max(1, cur - 2);
    const end = Math.min(total, start + 4);
    const finalStart = Math.max(1, end - 4);

    return Array.from({ length: end - finalStart + 1 }, (_, i) => finalStart + i);
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  toggleSelect(id: number): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  get isAllPageSelected(): boolean {
    if (this.paginatedEmployees.length === 0) return false;
    return this.paginatedEmployees.every((e) => this.selectedIds.has(e.id));
  }

  toggleSelectAllPage(): void {
    if (this.isAllPageSelected) {
      this.paginatedEmployees.forEach((e) => this.selectedIds.delete(e.id));
    } else {
      this.paginatedEmployees.forEach((e) => this.selectedIds.add(e.id));
    }
  }

  clearSelection(): void {
    this.selectedIds.clear();
  }

  // Pour l’instant, on garde bulk en local à faire plus tard côté backend
  bulkSetActive(): void {
    return;
  }

  bulkSetInactive(): void {
    return;
  }

  openBulkDelete(): void {
    if (this.selectedCount === 0) return;
    this.showBulkDelete = true;
  }

  closeBulkDelete(): void {
    this.showBulkDelete = false;
  }

  confirmBulkDelete(): void {
    const ids = [...this.selectedIds];
    if (ids.length === 0) return;

    let completed = 0;

    ids.forEach((id) => {
      this.employeeService.deleteEmployee(id).subscribe({
        next: () => {
          completed++;

          if (completed === ids.length) {
            this.fetchEmployees();
            this.clearSelection();
            this.currentPage = 1;
            this.closeBulkDelete();
          }
        },
        error: () => {
          this.errorMessage = 'Erreur pendant la suppression multiple.';
        },
      });
    });
  }

  openCreate(): void {
    this.modalMode = 'create';
    this.editingId = null;
    this.form = {
      firstName: '',
      lastName: '',
      email: '',
      department: '',
      position: '',
      status: 'Active',
      photoUrl: '',
    };
    this.showModal = true;
  }

  openEdit(employee: Employee): void {
    this.modalMode = 'edit';
    this.editingId = employee.id;
    this.form = {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      department: employee.department?.name ?? '',
      position: employee.position,
      status: employee.status,
      photoUrl: employee.photoUrl || '',
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveEmployee(): void {
    if (
      !this.form.firstName.trim() ||
      !this.form.lastName.trim() ||
      !this.form.email.trim()
    ) {
      alert('First name, Last name et Email sont obligatoires.');
      return;
    }

    const finalPhoto =
      this.form.photoUrl?.trim() ||
      `https://i.pravatar.cc/150?u=${encodeURIComponent(this.form.email)}`;

    if (this.modalMode === 'create') {
      const payload: CreateEmployeePayload = {
        firstName: this.form.firstName.trim(),
        lastName: this.form.lastName.trim(),
        email: this.form.email.trim(),
        position: this.form.position.trim(),
        departmentName: this.form.department.trim() || undefined,
        photoUrl: finalPhoto,
      };

      this.employeeService.addEmployee(payload).subscribe({
        next: () => {
          this.fetchEmployees();
          this.currentPage = 1;
          this.closeModal();
        },
        error: () => {
          this.errorMessage = 'Impossible de créer l’employé.';
        },
      });
    } else if (this.modalMode === 'edit' && this.editingId != null) {
      const payload: UpdateEmployeePayload = {
        firstName: this.form.firstName.trim(),
        lastName: this.form.lastName.trim(),
        email: this.form.email.trim(),
        position: this.form.position.trim(),
        departmentName: this.form.department.trim(),
        photoUrl: finalPhoto,
      };

      this.employeeService.updateEmployee(this.editingId, payload).subscribe({
        next: () => {
          this.fetchEmployees();
          this.currentPage = 1;
          this.closeModal();
        },
        error: () => {
          this.errorMessage = 'Impossible de modifier l’employé.';
        },
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.form.photoUrl = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  openDelete(employee: Employee): void {
    this.deleteTarget = employee;
    this.showDelete = true;
  }

  closeDelete(): void {
    this.showDelete = false;
    this.deleteTarget = null;
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;

    this.employeeService.deleteEmployee(this.deleteTarget.id).subscribe({
      next: () => {
        this.fetchEmployees();
        this.currentPage = 1;
        this.closeDelete();
      },
      error: () => {
        this.errorMessage = 'Impossible de supprimer l’employé.';
      },
    });
  }
}