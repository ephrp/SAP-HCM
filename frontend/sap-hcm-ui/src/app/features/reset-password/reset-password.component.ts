import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent {
  token = '';
  newPassword = '';
  confirmPassword = '';

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.token) {
      this.errorMessage = 'Lien invalide.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage = 'Minimum 8 caractères.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isLoading = true;

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Mot de passe réinitialisé !';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Lien expiré ou invalide.';
      },
    });
  }
}