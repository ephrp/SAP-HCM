import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  status: 'Active' | 'Inactive';
  photoUrl?: string;
}

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
export class Employees {
  employees: Employee[] = [
    {
      id: 1,
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@company.com',
      department: 'IT',
      position: 'Software Engineer',
      status: 'Active',
      photoUrl: 'https://i.pravatar.cc/150?img=12',
    },
    {
      id: 2,
      firstName: 'Marie',
      lastName: 'Roy',
      email: 'marie.roy@company.com',
      department: 'HR',
      position: 'HR Manager',
      status: 'Active',
      photoUrl: 'https://i.pravatar.cc/150?img=32',
    },
    {
      id: 3,
      firstName: 'Paul',
      lastName: 'Martin',
      email: 'paul.martin@company.com',
      department: 'Finance',
      position: 'Accountant',
      status: 'Inactive',
      photoUrl: 'https://i.pravatar.cc/150?img=56',
    },
  ];

  // Filters
  search = '';
  departmentFilter = 'All';
  statusFilter: StatusFilter = 'All';

  // Modal create/edit
  showModal = false;
  modalMode: ModalMode = 'create';
  editingId: number | null = null;

  form: Omit<Employee, 'id'> = {
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    position: '',
    status: 'Active',
    photoUrl: '',
  };

  // Delete confirm (single)
  showDelete = false;
  deleteTarget: Employee | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10, 20];

  // Sorting
  sortColumn: SortColumn = 'id';
  sortDirection: SortDirection = 'asc';

  // ✅ Multi-select
  selectedIds = new Set<number>();
  showBulkDelete = false;

  // Helpers
  getAvatar(employee: Employee): string {
    return (
      employee.photoUrl ||
      `https://i.pravatar.cc/150?u=${encodeURIComponent(employee.email)}`
    );
  }

  get departments(): string[] {
    const unique = Array.from(new Set(this.employees.map((e) => e.department)));
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
        return this.normalize(e.department);
      case 'position':
        return this.normalize(e.position);
      case 'status':
        return e.status;
    }
  }

  get filteredEmployees(): Employee[] {
    const q = this.search.trim().toLowerCase();
    return this.employees.filter((e) => {
      const matchesSearch =
        !q ||
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q);

      const matchesDept =
        this.departmentFilter === 'All' || e.department === this.departmentFilter;

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

  // Sorting UI
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

  // Pagination
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

  // ✅ Multi-select logic
  get selectedCount(): number {
    return this.selectedIds.size;
  }

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  toggleSelect(id: number): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
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

  bulkSetActive(): void {
    if (this.selectedCount === 0) return;
    this.employees = this.employees.map((e) =>
      this.selectedIds.has(e.id) ? { ...e, status: 'Active' } : e
    );
    this.clearSelection();
  }

  bulkSetInactive(): void {
    if (this.selectedCount === 0) return;
    this.employees = this.employees.map((e) =>
      this.selectedIds.has(e.id) ? { ...e, status: 'Inactive' } : e
    );
    this.clearSelection();
  }

  openBulkDelete(): void {
    if (this.selectedCount === 0) return;
    this.showBulkDelete = true;
  }

  closeBulkDelete(): void {
    this.showBulkDelete = false;
  }

  confirmBulkDelete(): void {
    this.employees = this.employees.filter((e) => !this.selectedIds.has(e.id));
    this.clearSelection();
    this.currentPage = 1;
    this.closeBulkDelete();
  }

  // ------- Modal create/edit -------
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
      department: employee.department,
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
    if (!this.form.firstName.trim() || !this.form.lastName.trim() || !this.form.email.trim()) {
      alert('First name, Last name et Email sont obligatoires.');
      return;
    }

    const finalPhoto =
      this.form.photoUrl?.trim() ||
      `https://i.pravatar.cc/150?u=${encodeURIComponent(this.form.email)}`;

    if (this.modalMode === 'create') {
      const nextId =
        this.employees.length > 0
          ? Math.max(...this.employees.map((e) => e.id)) + 1
          : 1;

      const newEmp: Employee = { id: nextId, ...this.form, photoUrl: finalPhoto };
      this.employees = [newEmp, ...this.employees];
    } else if (this.modalMode === 'edit' && this.editingId != null) {
      this.employees = this.employees.map((e) =>
        e.id === this.editingId ? { ...e, ...this.form, photoUrl: finalPhoto } : e
      );
    }

    this.currentPage = 1;
    this.closeModal();
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

  // ------- Single delete -------
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
    this.employees = this.employees.filter((e) => e.id !== this.deleteTarget!.id);
    this.currentPage = 1;
    this.closeDelete();
  }
}
