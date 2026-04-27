import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AssignTrainingPayload,
  CreateTrainingPayload,
  EmployeeTrainingStatus,
  Training,
  TrainingAssignment,
  TrainingLevel,
  TrainingService,
  TrainingStatus,
  UpdateTrainingAssignmentPayload,
  UpdateTrainingPayload,
} from '../../../../core/services/training.service';
import { AuthService } from '../../../../core/services/auth.service';

type ToastType = 'success' | 'error';
type ModalMode = 'create' | 'edit';

type AssignableEmployee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
};

@Component({
  selector: 'app-trainings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trainings.component.html',
  styleUrls: ['./trainings.component.scss'],
})
export class TrainingsComponent implements OnInit {
  search = '';
  statusFilter: 'All' | TrainingStatus = 'All';
  levelFilter: 'All' | TrainingLevel = 'All';

  assignmentSearch = '';
  assignmentStatusFilter: 'All' | EmployeeTrainingStatus = 'All';

  currentPage = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10, 20];

  assignmentPage = 1;
  assignmentPageSize = 5;
  assignmentPageSizeOptions = [5, 10, 20];

  showModal = false;
  modalMode: ModalMode = 'create';
  editingTrainingId: number | null = null;
  isSubmitting = false;

  showAssignModal = false;
  isAssigning = false;

  form: {
    title: string;
    category: string;
    provider: string;
    durationHours: number | null;
    level: TrainingLevel;
    status: TrainingStatus;
    startDate: string;
  } = {
    title: '',
    category: '',
    provider: '',
    durationHours: null,
    level: 'Beginner',
    status: 'Planned',
    startDate: '',
  };

  assignForm: {
    employeeId: number | null;
    trainingId: number | null;
    dueDate: string;
  } = {
    employeeId: null,
    trainingId: null,
    dueDate: '',
  };

  showToast = false;
  toastMessage = '';
  toastType: ToastType = 'success';
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  trainings: Training[] = [];
  assignments: TrainingAssignment[] = [];
  employees: AssignableEmployee[] = [];

  isLoading = false;
  isLoadingAssignments = false;
  isLoadingEmployees = false;
  errorMessage = '';

  constructor(
    private trainingService: TrainingService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadTrainings();
    this.loadAssignments();

    if (this.canAssignTrainings) {
      this.loadAssignableEmployees();
    }
  }

  get isEmployee(): boolean {
    return this.authService.isEmployee();
  }

  get isManager(): boolean {
    return this.authService.isManager();
  }

  get canManageTrainings(): boolean {
    return this.authService.isHrAdmin() || this.authService.isManager();
  }

  get canAssignTrainings(): boolean {
    return this.authService.isHrAdmin() || this.authService.isManager();
  }

  get canViewAssignments(): boolean {
    return (
      this.authService.isHrAdmin() ||
      this.authService.isManager() ||
      this.authService.isEmployee()
    );
  }

  get canSeeCatalog(): boolean {
    return !this.authService.isEmployee();
  }

  get trainingSectionTitle(): string {
    if (this.authService.isHrAdmin()) return 'Training catalog';
    if (this.authService.isManager()) return 'Team training catalog';
    return 'My trainings';
  }

  get trainingSectionSubtitle(): string {
    if (this.authService.isHrAdmin()) {
      return 'Catalogue central des formations disponibles.';
    }

    if (this.authService.isManager()) {
      return 'Formations globales RH + formations créées pour votre équipe.';
    }

    return 'Formations disponibles.';
  }

  get assignModalTitle(): string {
    return this.authService.isManager()
      ? 'Assigner une formation à votre équipe'
      : 'Assign training';
  }

  get assignModalSubtitle(): string {
    return this.authService.isManager()
      ? 'Vous pouvez assigner une formation uniquement aux membres de votre équipe.'
      : 'Assigner une formation à un employé avec une échéance optionnelle.';
  }

  get filteredTrainings(): Training[] {
    const q = this.search.trim().toLowerCase();

    return this.trainings.filter((training) => {
      const matchesSearch =
        !q ||
        training.title.toLowerCase().includes(q) ||
        training.category.toLowerCase().includes(q) ||
        training.provider.toLowerCase().includes(q);

      const matchesStatus =
        this.statusFilter === 'All' || training.status === this.statusFilter;

      const matchesLevel =
        this.levelFilter === 'All' || training.level === this.levelFilter;

      return matchesSearch && matchesStatus && matchesLevel;
    });
  }

  get totalItems(): number {
    return this.filteredTrainings.length;
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

  get paginatedTrainings(): Training[] {
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    return this.filteredTrainings.slice(this.startIndex, this.endIndex);
  }

  get filteredAssignments(): TrainingAssignment[] {
    const q = this.assignmentSearch.trim().toLowerCase();

    return this.assignments.filter((assignment) => {
      const employeeName =
        `${assignment.employee.firstName} ${assignment.employee.lastName}`.toLowerCase();

      const matchesSearch =
        !q ||
        employeeName.includes(q) ||
        assignment.employee.email.toLowerCase().includes(q) ||
        assignment.training.title.toLowerCase().includes(q) ||
        assignment.training.category.toLowerCase().includes(q);

      const matchesStatus =
        this.assignmentStatusFilter === 'All' ||
        assignment.status === this.assignmentStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  get totalAssignments(): number {
    return this.filteredAssignments.length;
  }

  get totalAssignmentPages(): number {
    return Math.max(
      1,
      Math.ceil(this.totalAssignments / this.assignmentPageSize),
    );
  }

  get assignmentStartIndex(): number {
    return (this.assignmentPage - 1) * this.assignmentPageSize;
  }

  get assignmentEndIndex(): number {
    return Math.min(
      this.assignmentStartIndex + this.assignmentPageSize,
      this.totalAssignments,
    );
  }

  get paginatedAssignments(): TrainingAssignment[] {
    if (this.assignmentPage > this.totalAssignmentPages) {
      this.assignmentPage = this.totalAssignmentPages;
    }
    if (this.assignmentPage < 1) {
      this.assignmentPage = 1;
    }

    return this.filteredAssignments.slice(
      this.assignmentStartIndex,
      this.assignmentEndIndex,
    );
  }

  get activeEmployees(): AssignableEmployee[] {
    return this.employees.filter((employee) => employee.status === 'Active');
  }

  loadTrainings(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.trainingService.getTrainings().subscribe({
      next: (data) => {
        this.trainings = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Load trainings error:', err);
        this.errorMessage = 'Impossible de charger les formations.';
        this.isLoading = false;
      },
    });
  }

  loadAssignments(): void {
    if (!this.canViewAssignments) return;

    this.isLoadingAssignments = true;

    this.trainingService.getAssignments().subscribe({
      next: (data) => {
        this.assignments = data;
        this.isLoadingAssignments = false;
      },
      error: (err) => {
        console.error('Load assignments error:', err);
        this.isLoadingAssignments = false;
      },
    });
  }

  loadAssignableEmployees(): void {
    this.isLoadingEmployees = true;

    this.trainingService.getAssignableEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.isLoadingEmployees = false;
      },
      error: (err) => {
        console.error('Load assignable employees error:', err);
        this.isLoadingEmployees = false;
      },
    });
  }

  resetFilters(): void {
    this.search = '';
    this.statusFilter = 'All';
    this.levelFilter = 'All';
    this.currentPage = 1;
  }

  resetAssignmentFilters(): void {
    this.assignmentSearch = '';
    this.assignmentStatusFilter = 'All';
    this.assignmentPage = 1;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  onAssignmentPageSizeChange(): void {
    this.assignmentPage = 1;
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

  goToAssignmentPage(page: number): void {
    this.assignmentPage = Math.min(
      this.totalAssignmentPages,
      Math.max(1, page),
    );
  }

  nextAssignmentPage(): void {
    this.goToAssignmentPage(this.assignmentPage + 1);
  }

  prevAssignmentPage(): void {
    this.goToAssignmentPage(this.assignmentPage - 1);
  }

  openModal(): void {
    if (!this.canManageTrainings) return;

    this.modalMode = 'create';
    this.editingTrainingId = null;
    this.resetForm();
    this.showModal = true;
  }

  openEdit(training: Training): void {
    if (!this.canManageTrainings) return;

    this.modalMode = 'edit';
    this.editingTrainingId = training.id;
    this.form = {
      title: training.title,
      category: training.category,
      provider: training.provider,
      durationHours: training.durationHours,
      level: training.level,
      status: training.status,
      startDate: training.startDate,
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalMode = 'create';
    this.editingTrainingId = null;
    this.isSubmitting = false;
  }

  openAssignModal(): void {
    if (!this.canAssignTrainings) return;

    this.assignForm = {
      employeeId: null,
      trainingId: null,
      dueDate: '',
    };
    this.showAssignModal = true;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.isAssigning = false;
  }

  saveTraining(): void {
    if (!this.canManageTrainings) return;
    if (this.isSubmitting) return;

    if (
      !this.form.title.trim() ||
      !this.form.category.trim() ||
      !this.form.provider.trim() ||
      !this.form.startDate ||
      this.form.durationHours === null ||
      this.form.durationHours <= 0
    ) {
      this.showToastMessage(
        'Veuillez remplir correctement les champs obligatoires.',
        'error',
      );
      return;
    }

    this.isSubmitting = true;

    if (this.modalMode === 'create') {
      const payload: CreateTrainingPayload = {
        title: this.form.title.trim(),
        category: this.form.category.trim(),
        provider: this.form.provider.trim(),
        durationHours: this.form.durationHours,
        level: this.form.level,
        status: this.form.status,
        startDate: this.form.startDate,
      };

      this.trainingService.createTraining(payload).subscribe({
        next: () => {
          this.loadTrainings();
          this.currentPage = 1;
          this.resetForm();
          this.closeModal();
          this.showToastMessage('Training created successfully.', 'success');
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error('Create training error:', err);
          this.showToastMessage(
            'Impossible de créer la formation.',
            'error',
          );
          this.isSubmitting = false;
        },
      });

      return;
    }

    if (this.modalMode === 'edit' && this.editingTrainingId != null) {
      const payload: UpdateTrainingPayload = {
        title: this.form.title.trim(),
        category: this.form.category.trim(),
        provider: this.form.provider.trim(),
        durationHours: this.form.durationHours,
        level: this.form.level,
        status: this.form.status,
        startDate: this.form.startDate,
      };

      this.trainingService
        .updateTraining(this.editingTrainingId, payload)
        .subscribe({
          next: () => {
            this.loadTrainings();
            this.currentPage = 1;
            this.closeModal();
            this.showToastMessage('Training updated successfully.', 'success');
            this.isSubmitting = false;
          },
          error: (err) => {
            console.error('Update training error:', err);
            this.showToastMessage(
              'Impossible de modifier la formation.',
              'error',
            );
            this.isSubmitting = false;
          },
        });
    }
  }

  assignTraining(): void {
    if (!this.canAssignTrainings || this.isAssigning) return;

    if (!this.assignForm.employeeId || !this.assignForm.trainingId) {
      this.showToastMessage(
        'Veuillez choisir un employé et une formation.',
        'error',
      );
      return;
    }

    this.isAssigning = true;

    const payload: AssignTrainingPayload = {
      employeeId: this.assignForm.employeeId,
      trainingId: this.assignForm.trainingId,
      dueDate: this.assignForm.dueDate || undefined,
    };

    this.trainingService.assignTraining(payload).subscribe({
      next: () => {
        this.loadAssignments();
        this.closeAssignModal();
        this.showToastMessage('Formation assignée avec succès.', 'success');
        this.isAssigning = false;
      },
      error: (err) => {
        console.error('Assign training error:', err);
        this.showToastMessage(
          err?.error?.message ?? 'Impossible d’assigner la formation.',
          'error',
        );
        this.isAssigning = false;
      },
    });
  }

  increaseProgress(assignment: TrainingAssignment, step = 10): void {
    const nextProgress = Math.min(100, assignment.progress + step);
    this.updateAssignmentProgress(assignment, nextProgress);
  }

  markAsNotStarted(assignment: TrainingAssignment): void {
    const payload: UpdateTrainingAssignmentPayload = {
      status: 'NOT_STARTED',
      progress: 0,
    };

    this.trainingService.updateAssignment(assignment.id, payload).subscribe({
      next: () => {
        this.loadAssignments();
        this.showToastMessage('Assignment reset.', 'success');
      },
      error: (err) => {
        console.error('Reset assignment error:', err);
        this.showToastMessage(
          'Impossible de réinitialiser l’assignation.',
          'error',
        );
      },
    });
  }

  markAsCompleted(assignment: TrainingAssignment): void {
    const payload: UpdateTrainingAssignmentPayload = {
      status: 'COMPLETED',
      progress: 100,
    };

    this.trainingService.updateAssignment(assignment.id, payload).subscribe({
      next: () => {
        this.loadAssignments();
        this.showToastMessage('Formation marquée comme terminée.', 'success');
      },
      error: (err) => {
        console.error('Complete assignment error:', err);
        this.showToastMessage(
          'Impossible de terminer la formation.',
          'error',
        );
      },
    });
  }

  private updateAssignmentProgress(
    assignment: TrainingAssignment,
    progress: number,
  ): void {
    const payload: UpdateTrainingAssignmentPayload = { progress };

    this.trainingService.updateAssignment(assignment.id, payload).subscribe({
      next: () => {
        this.loadAssignments();
      },
      error: (err) => {
        console.error('Update assignment progress error:', err);
        this.showToastMessage(
          'Impossible de mettre à jour la progression.',
          'error',
        );
      },
    });
  }

  getAssignmentStatusLabel(status: EmployeeTrainingStatus): string {
    if (status === 'NOT_STARTED') return 'Not started';
    if (status === 'IN_PROGRESS') return 'In progress';
    return 'Completed';
  }

  deleteTraining(training: Training): void {
    if (!this.canManageTrainings) return;

    const confirmed = window.confirm(
      `Supprimer la formation "${training.title}" ?`,
    );
    if (!confirmed) return;

    this.trainingService.deleteTraining(training.id).subscribe({
      next: () => {
        this.loadTrainings();
        this.showToastMessage('Training deleted successfully.', 'success');
      },
      error: (err) => {
        console.error('Delete training error:', err);
        this.showToastMessage(
          'Impossible de supprimer la formation.',
          'error',
        );
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

  private resetForm(): void {
    this.form = {
      title: '',
      category: '',
      provider: '',
      durationHours: null,
      level: 'Beginner',
      status: 'Planned',
      startDate: '',
    };
  }
}