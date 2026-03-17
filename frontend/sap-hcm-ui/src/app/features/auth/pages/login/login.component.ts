import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UserRole } from '../../../../core/services/auth.service';

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
  role: UserRole = 'EMPLOYEE';
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  submit(): void {
    this.error = '';

    const success = this.authService.login(this.email, this.password, this.role);

    if (!success) {
      this.error = 'Veuillez remplir tous les champs.';
      return;
    }

    this.router.navigate(['/dashboard']);
  }
}