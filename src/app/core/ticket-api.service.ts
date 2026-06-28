import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, Resource, Ticket, User } from '../shared/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TicketApiService {
  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<User[]> {
    // json-server treats query params as exact-match filters, so this returns
    // a matching user (or an empty array if the credentials don't match).
    return this.http.get<User[]>(`${environment.apiBaseUrl}/users`, { params: { username, password } });
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${environment.apiBaseUrl}/projects`);
  }

  getResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${environment.apiBaseUrl}/resources`);
  }

  getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${environment.apiBaseUrl}/tickets`);
  }

  addTicket(ticket: Ticket): Observable<Ticket> {
    return this.http.post<Ticket>(`${environment.apiBaseUrl}/tickets`, ticket);
  }

  updateTicket(id: string, patch: Partial<Ticket>): Observable<Ticket> {
    return this.http.patch<Ticket>(`${environment.apiBaseUrl}/tickets/${id}`, patch);
  }

  deleteTicket(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/tickets/${id}`);
  }

  addProject(project: Project): Observable<Project> {
    return this.http.post<Project>(`${environment.apiBaseUrl}/projects`, project);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/projects/${id}`);
  }

  addResource(resource: Resource): Observable<Resource> {
    return this.http.post<Resource>(`${environment.apiBaseUrl}/resources`, resource);
  }

  deleteResource(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/resources/${id}`);
  }
}
