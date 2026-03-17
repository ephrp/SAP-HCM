import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR_ADMIN';

export interface AuthUser {
  email: string;
  role: UserRole;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storageKey = 'peopleflow_auth_user';
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  login(email: string, password: string, role: UserRole): boolean {
    if (!email.trim() || !password.trim()) return false;
    if (!this.isBrowser) return false;

    const user: AuthUser = {
      email,
      role,
      name:
        role === 'HR_ADMIN'
          ? 'HR Admin'
          : role === 'MANAGER'
          ? 'Team Manager'
          : 'Employee User',
    };

    localStorage.setItem(this.storageKey, JSON.stringify(user));
    return true;
  }

  logout(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.storageKey);
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser) return false;
    return !!localStorage.getItem(this.storageKey);
  }

  getUser(): AuthUser | null {
    if (!this.isBrowser) return null;

    const raw = localStorage.getItem(this.storageKey);
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
}