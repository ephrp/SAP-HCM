import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CreateTrainingPayload,
  Training,
  TrainingLevel,
  TrainingService,
  TrainingStatus,
  UpdateTrainingPayload,
} from '../../../../core/services/training.service';
import { AuthService } from '../../../../core/services/auth.service';

type ToastType = 'success' | 'error';
type ModalMode = 'create' | 'edit';

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

  currentPage = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10, 20];

  showModal = false;
  modalMode: ModalMode = 'create';
  editingTrainingId: number | null = null;
  isSubmitting = false;

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

  showToast = false;
  toastMessage = '';
  toastType: ToastType = 'success';
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  trainings: Training[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private trainingService: TrainingService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTrainings();
  }

  get canManageTrainings(): boolean {
    return this.authService.isHrAdmin();
  }

  get filteredTrainings(): Training[] {
    const q = this.search.trim().toLowerCase();

    return this.trainings.filter((t) => {
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.provider.toLowerCase().includes(q);

      const matchesStatus =
        this.statusFilter === 'All' || t.status === this.statusFilter;

      const matchesLevel =
        this.levelFilter === 'All' || t.level === this.levelFilter;

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

  resetFilters(): void {
    this.search = '';
    this.statusFilter = 'All';
    this.levelFilter = 'All';
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
        'error'
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
          this.showToastMessage('Impossible de créer la formation.', 'error');
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
            this.showToastMessage('Impossible de modifier la formation.', 'error');
            this.isSubmitting = false;
          },
        });
    }
  }

  deleteTraining(training: Training): void {
    if (!this.canManageTrainings) return;

    const confirmed = window.confirm(
      `Supprimer la formation "${training.title}" ?`
    );
    if (!confirmed) return;

    this.trainingService.deleteTraining(training.id).subscribe({
      next: () => {
        this.loadTrainings();
        this.showToastMessage('Training deleted successfully.', 'success');
      },
      error: (err) => {
        console.error('Delete training error:', err);
        this.showToastMessage('Impossible de supprimer la formation.', 'error');
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