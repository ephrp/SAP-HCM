import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // 🔹 Redirection initiale
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },

  // 🔹 LOGIN (hors shell)
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },

  // 🔹 CHANGE PASSWORD (hors shell aussi 🔥)
  {
    path: 'change-password',
    loadComponent: () =>
      import('./features/auth/pages/change-password/change-password.component').then(
        (m) => m.ChangePasswordComponent
      ),
  },

  // 🔹 APP (avec shell)
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/shell/shell.component').then(
        (m) => m.ShellComponent
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'employees',
        canActivate: [roleGuard(['HR_ADMIN'])],
        loadComponent: () =>
          import('./features/employees/pages/employees/employees.component').then(
            (m) => m.Employees
          ),
      },
      {
        path: 'leaves',
        loadComponent: () =>
          import('./features/leaves/pages/leaves/leaves.component').then(
            (m) => m.LeavesComponent
          ),
      },
      {
        path: 'trainings',
        loadComponent: () =>
          import('./features/trainings/pages/trainings/trainings.component').then(
            (m) => m.TrainingsComponent
          ),
      },
      {
        path: 'approvals',
        canActivate: [roleGuard(['MANAGER', 'HR_ADMIN'])],
        loadComponent: () =>
          import('./features/approvals/pages/approvals/approvals.component').then(
            (m) => m.ApprovalsComponent
          ),
      },

      { path: '**', redirectTo: 'dashboard' },
    ],
  },

  // 🔹 fallback global
  {
    path: '**',
    redirectTo: 'login',
  },
];