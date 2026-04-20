import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  submit(): void {
    this.error = '';

    if (!this.email.trim() || !this.password.trim()) {
      this.error = 'Veuillez remplir tous les champs.';
      return;
    }

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    this.authService.login(this.email.trim(), this.password.trim()).subscribe({
      next: () => {
        this.isSubmitting = false;

        if (this.authService.needsPasswordChange()) {
          this.router.navigate(['/change-password']);
          return;
        }

        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error =
          err?.error?.message === 'Invalid credentials'
            ? 'Email ou mot de passe incorrect.'
            : 'Connexion impossible.';
      },
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) return;

    if (this.authService.needsPasswordChange()) {
      this.router.navigate(['/change-password']);
      return;
    }

    this.router.navigate(['/dashboard']);
  }
}