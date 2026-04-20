import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Employee,
  EmployeeService,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  UserRole,
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
  accountInfoMessage = '';

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
    createAccount: true,
    role: 'EMPLOYEE' as UserRole,
    managerId: null as number | null,
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
          .map((employee) => employee.department?.name)
          .filter((name): name is string => !!name),
      ),
    );

    return unique.sort((a, b) => a.localeCompare(b));
  }

  get managerOptions(): Employee[] {
  return this.employees
    .filter((employee) => {
      const role = employee.user?.role;

      return (
        employee.id !== this.editingId &&
        (role === 'MANAGER' || role === 'HR_ADMIN')
      );
    })
    .slice()
    .sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`,
      ),
    );
}

  shouldShowManagerField(): boolean {
    return !this.form.createAccount || this.form.role === 'EMPLOYEE';
  }

  onRoleChange(): void {
    if (!this.shouldShowManagerField()) {
      this.form.managerId = null;
    }
  }

  onCreateAccountChange(): void {
    if (!this.shouldShowManagerField()) {
      this.form.managerId = null;
    }
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private compare(a: string | number, b: string | number): number {
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    return String(a).localeCompare(String(b));
  }

  private getSortValue(employee: Employee, column: SortColumn): string | number {
    switch (column) {
      case 'id':
        return employee.id;
      case 'name':
        return this.normalize(`${employee.firstName} ${employee.lastName}`);
      case 'email':
        return this.normalize(employee.email);
      case 'department':
        return this.normalize(employee.department?.name ?? '');
      case 'position':
        return this.normalize(employee.position);
      case 'status':
        return employee.status;
    }
  }

  get filteredEmployees(): Employee[] {
    const q = this.search.trim().toLowerCase();

    return this.employees.filter((employee) => {
      const departmentName = employee.department?.name ?? '';

      const matchesSearch =
        !q ||
        `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(q) ||
        employee.email.toLowerCase().includes(q) ||
        departmentName.toLowerCase().includes(q) ||
        employee.position.toLowerCase().includes(q);

      const matchesDepartment =
        this.departmentFilter === 'All' ||
        departmentName === this.departmentFilter;

      const matchesStatus =
        this.statusFilter === 'All' || employee.status === this.statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }

  get sortedEmployees(): Employee[] {
    const list = [...this.filteredEmployees];
    const direction = this.sortDirection === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      const valueA = this.getSortValue(a, this.sortColumn);
      const valueB = this.getSortValue(b, this.sortColumn);
      return this.compare(valueA, valueB) * direction;
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
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    return this.sortedEmployees.slice(this.startIndex, this.endIndex);
  }

  setSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.currentPage = 1;
  }

  sortIcon(column: SortColumn): string {
    if (this.sortColumn !== column) {
      return '↕';
    }

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
    const current = this.currentPage;

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    const finalStart = Math.max(1, end - 4);

    return Array.from(
      { length: end - finalStart + 1 },
      (_, i) => finalStart + i,
    );
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
    if (this.paginatedEmployees.length === 0) {
      return false;
    }

    return this.paginatedEmployees.every((employee) =>
      this.selectedIds.has(employee.id),
    );
  }

  toggleSelectAllPage(): void {
    if (this.isAllPageSelected) {
      this.paginatedEmployees.forEach((employee) =>
        this.selectedIds.delete(employee.id),
      );
    } else {
      this.paginatedEmployees.forEach((employee) =>
        this.selectedIds.add(employee.id),
      );
    }
  }

  clearSelection(): void {
    this.selectedIds.clear();
  }

  bulkSetActive(): void {
    return;
  }

  bulkSetInactive(): void {
    return;
  }

  openBulkDelete(): void {
    if (this.selectedCount === 0) {
      return;
    }

    this.showBulkDelete = true;
  }

  closeBulkDelete(): void {
    this.showBulkDelete = false;
  }

  confirmBulkDelete(): void {
    const ids = [...this.selectedIds];

    if (ids.length === 0) {
      return;
    }

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
    this.accountInfoMessage = '';
    this.errorMessage = '';

    this.form = {
      firstName: '',
      lastName: '',
      email: '',
      department: '',
      position: '',
      status: 'Active',
      photoUrl: '',
      createAccount: true,
      role: 'EMPLOYEE',
      managerId: null,
    };

    this.showModal = true;
  }

  openEdit(employee: Employee): void {
    this.modalMode = 'edit';
    this.editingId = employee.id;
    this.accountInfoMessage = '';
    this.errorMessage = '';

    this.form = {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      department: employee.department?.name ?? '',
      position: employee.position,
      status: employee.status,
      photoUrl: employee.photoUrl || '',
      createAccount: false,
      role: 'EMPLOYEE',
      managerId: employee.manager?.id ?? null,
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

    if (!this.shouldShowManagerField()) {
      this.form.managerId = null;
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
        createAccount: this.form.createAccount,
        role: this.form.createAccount ? this.form.role : undefined,
        managerId: this.form.managerId ?? undefined,
      };

      this.employeeService.addEmployee(payload).subscribe({
        next: (response) => {
          this.fetchEmployees();
          this.currentPage = 1;

          if (response.accountCreated && response.temporaryPassword) {
            this.accountInfoMessage = `Compte créé avec succès. Mot de passe temporaire : ${response.temporaryPassword}`;
          } else {
            this.accountInfoMessage = 'Employé créé sans compte utilisateur.';
          }
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.message ?? 'Impossible de créer l’employé.';
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
        managerId: this.form.managerId ?? undefined,
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

    if (!file) {
      return;
    }

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
    if (!this.deleteTarget) {
      return;
    }

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