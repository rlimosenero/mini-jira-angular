import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, Resource, Ticket, User } from '../shared/models';

const API = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class TicketApiService {
  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<User[]> {
    // json-server treats query params as exact-match filters, so this returns
    // a matching user (or an empty array if the credentials don't match).
    return this.http.get<User[]>(`${API}/users`, { params: { username, password } });
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${API}/projects`);
  }

  getResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${API}/resources`);
  }

  getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${API}/tickets`);
  }

  addTicket(ticket: Ticket): Observable<Ticket> {
    return this.http.post<Ticket>(`${API}/tickets`, ticket);
  }

  updateTicket(id: string, patch: Partial<Ticket>): Observable<Ticket> {
    return this.http.patch<Ticket>(`${API}/tickets/${id}`, patch);
  }

  deleteTicket(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/tickets/${id}`);
  }

  addProject(project: Project): Observable<Project> {
    return this.http.post<Project>(`${API}/projects`, project);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/projects/${id}`);
  }

  addResource(resource: Resource): Observable<Resource> {
    return this.http.post<Resource>(`${API}/resources`, resource);
  }

  deleteResource(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/resources/${id}`);
  }
}
