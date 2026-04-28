import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuditLog {
  id: number;
  action: string;
  actorEmail: string;
  targetType: string;
  targetId: number;
  message: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private apiUrl = 'http://localhost:3000/audit-logs';

  constructor(private http: HttpClient) {}

  getLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(this.apiUrl);
  }
}