import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private authService: AuthService) {}

  submit(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.email.trim()) {
      this.errorMessage = 'Veuillez saisir votre email.';
      return;
    }

    this.isLoading = true;

    this.authService.forgotPassword(this.email.trim()).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage =
          'Si cet email existe, un lien de réinitialisation a été envoyé.';
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Impossible de traiter la demande.';
      },
    });
  }
}