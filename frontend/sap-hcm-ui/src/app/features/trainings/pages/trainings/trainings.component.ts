import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Training,
  TrainingLevel,
  TrainingService,
  TrainingStatus,
} from '../../../../core/services/training.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-trainings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trainings.component.html',
  styleUrls: ['./trainings.component.scss'],
})
export class TrainingsComponent {
  search = '';
  statusFilter: 'All' | TrainingStatus = 'All';
  levelFilter: 'All' | TrainingLevel = 'All';

  currentPage = 1;
  pageSize = 5;
  pageSizeOptions = [5, 10, 20];

  showModal = false;

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

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: ToastType = 'success';
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  trainings: Training[] = [];

  constructor(private trainingService: TrainingService) {
    this.trainings = this.trainingService.getTrainings();
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
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  createTraining(): void {
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

    const nextId =
      this.trainings.length > 0
        ? Math.max(...this.trainings.map((t) => t.id)) + 1
        : 1;

    const newTraining: Training = {
      id: nextId,
      title: this.form.title.trim(),
      category: this.form.category.trim(),
      provider: this.form.provider.trim(),
      durationHours: this.form.durationHours,
      level: this.form.level,
      status: this.form.status,
      startDate: this.form.startDate,
    };

    this.trainingService.addTraining(newTraining);
    this.trainings = this.trainingService.getTrainings();

    this.currentPage = 1;
    this.resetForm();
    this.closeModal();
    this.showToastMessage('Training created successfully.', 'success');
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