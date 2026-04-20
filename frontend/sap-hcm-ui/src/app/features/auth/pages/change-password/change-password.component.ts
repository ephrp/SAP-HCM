import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }

    .login {
      min-height: 100vh;
      width: 100%;
      background: linear-gradient(135deg, #0f0f1a, #1a1a2e);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
    }

    .login__card {
      width: 100%;
      max-width: 520px;
      background: #ffffff;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      animation: fadeIn 0.4s ease;
      box-sizing: border-box;
    }

    .login__brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }

    .dot {
      width: 10px;
      height: 10px;
      background: #7c3aed;
      border-radius: 50%;
    }

    .brand {
      font-weight: 600;
      font-size: 18px;
      color: #111827;
    }

    .tag {
      background: #f1f1f1;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 12px;
      color: #777;
    }

    .login__header {
      margin-bottom: 25px;
    }

    .login__header h1 {
      font-size: 24px;
      margin: 0 0 8px 0;
      color: #111827;
    }

    .login__header p {
      color: #666;
      font-size: 14px;
      margin: 0;
      line-height: 1.5;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field__label {
      font-size: 13px;
      color: #555;
      font-weight: 500;
    }

    .field__control {
      width: 100%;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid #ddd;
      transition: all 0.2s ease;
      font-size: 14px;
      box-sizing: border-box;
      outline: none;
    }

    .field__control:focus {
      border-color: #7c3aed;
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
    }

    .btn {
      padding: 12px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .btn--primary {
      background: #7c3aed;
      color: white;
    }

    .btn--primary:hover {
      background: #6d28d9;
    }

    .btn--primary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .error {
      color: #dc2626;
      font-size: 13px;
      margin: -4px 0 0 0;
    }

    .success {
      color: #16a34a;
      font-size: 13px;
      margin: -4px 0 0 0;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(15px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
})
export class ChangePasswordComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  error = '';
  success = '';
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  submit(): void {
    this.error = '';
    this.success = '';

    if (
      !this.currentPassword.trim() ||
      !this.newPassword.trim() ||
      !this.confirmPassword.trim()
    ) {
      this.error = 'Veuillez remplir tous les champs.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.error = 'Le nouveau mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'La confirmation du mot de passe ne correspond pas.';
      return;
    }

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    this.authService.changePassword(
      this.currentPassword.trim(),
      this.newPassword.trim()
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.authService.markPasswordChanged();
        this.success = 'Mot de passe modifié avec succès.';

        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 800);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error =
          err?.error?.message === 'Current password is incorrect'
            ? 'Le mot de passe actuel est incorrect.'
            : 'Impossible de modifier le mot de passe.';
      },
    });
  }
}