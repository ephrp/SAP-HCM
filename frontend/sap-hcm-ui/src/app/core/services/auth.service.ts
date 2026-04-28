import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR_ADMIN';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  employeeId: number | null;
  firstName: string | null;
  lastName: string | null;
  departmentName: string | null;
  mustChangePassword: boolean;
  name: string;
}

interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    role: UserRole;
    employeeId: number | null;
    firstName: string | null;
    lastName: string | null;
    departmentName: string | null;
    mustChangePassword: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly userStorageKey = 'peopleflow_auth_user';
  private readonly tokenStorageKey = 'peopleflow_auth_token';
  private readonly isBrowser: boolean;
  private readonly apiUrl = 'http://localhost:3000/auth';

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private http: HttpClient
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          if (!this.isBrowser) return;

          const fullName = this.buildDisplayName(
            response.user.firstName,
            response.user.lastName,
            response.user.role
          );

          const user: AuthUser = {
            id: response.user.id,
            email: response.user.email,
            role: response.user.role,
            employeeId: response.user.employeeId,
            firstName: response.user.firstName,
            lastName: response.user.lastName,
            departmentName: response.user.departmentName,
            mustChangePassword: response.user.mustChangePassword,
            name: fullName,
          };

          localStorage.setItem(this.tokenStorageKey, response.access_token);
          localStorage.setItem(this.userStorageKey, JSON.stringify(user));
        })
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/change-password`, {
      currentPassword,
      newPassword,
    });
  }

  markPasswordChanged(): void {
    const user = this.getUser();
    if (!user || !this.isBrowser) return;

    const updatedUser: AuthUser = {
      ...user,
      mustChangePassword: false,
    };

    localStorage.setItem(this.userStorageKey, JSON.stringify(updatedUser));
  }

  logout(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.tokenStorageKey);
    localStorage.removeItem(this.userStorageKey);
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser) return false;
    return !!localStorage.getItem(this.tokenStorageKey);
  }

  needsPasswordChange(): boolean {
    return this.getUser()?.mustChangePassword ?? false;
  }

  resetPassword(token: string, newPassword: string) {
  return this.http.post('http://localhost:3000/auth/reset-password', {
    token,
    newPassword,
  });
}

forgotPassword(email: string) {
  return this.http.post('http://localhost:3000/auth/forgot-password', {
    email,
  });
}

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.tokenStorageKey);
  }

  getUser(): AuthUser | null {
    if (!this.isBrowser) return null;

    const raw = localStorage.getItem(this.userStorageKey);
    return raw ? JSON.parse(raw) : null;
  }

  getRole(): UserRole | null {
    return this.getUser()?.role ?? null;
  }

  isEmployee(): boolean {
    return this.getRole() === 'EMPLOYEE';
  }

  isManager(): boolean {
    return this.getRole() === 'MANAGER';
  }

  isHrAdmin(): boolean {
    return this.getRole() === 'HR_ADMIN';
  }

  private buildDisplayName(
    firstName: string | null,
    lastName: string | null,
    role: UserRole
  ): string {
    const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();

    if (fullName) return fullName;
    if (role === 'HR_ADMIN') return 'HR Admin';
    if (role === 'MANAGER') return 'Team Manager';
    return 'Employee User';
  }
}