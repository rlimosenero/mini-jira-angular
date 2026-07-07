import { Injectable } from '@angular/core';
import { Project, Resource, Sprint, Ticket, User } from '../shared/models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TicketApiService {
  private async request<T>(input: string | URL, init: RequestInit = {}): Promise<T> {
    const response = await fetch(input, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const text = await response.text();
    return text ? (JSON.parse(text) as T) : (undefined as T);
  }

  async login(username: string, password: string): Promise<User[]> {
    const url = new URL(`${environment.apiBaseUrl}/users`);
    url.searchParams.set('username', username);
    url.searchParams.set('password', password);

    // json-server treats query params as exact-match filters, so this returns
    // a matching user (or an empty array if the credentials don't match).
    return this.request<User[]>(url.toString());
  }

  getProjects(): Promise<Project[]> {
    return this.request<Project[]>(`${environment.apiBaseUrl}/projects`);
  }

  getResources(): Promise<Resource[]> {
    return this.request<Resource[]>(`${environment.apiBaseUrl}/resources`);
  }

  getTickets(): Promise<Ticket[]> {
    return this.request<Ticket[]>(`${environment.apiBaseUrl}/tickets`);
  }

  addTicket(ticket: Ticket): Promise<Ticket> {
    return this.request<Ticket>(`${environment.apiBaseUrl}/tickets`, {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
  }

  updateTicket(id: string, patch: Partial<Ticket>): Promise<Ticket> {
    return this.request<Ticket>(`${environment.apiBaseUrl}/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  deleteTicket(id: string): Promise<void> {
    return this.request<void>(`${environment.apiBaseUrl}/tickets/${id}`, {
      method: 'DELETE',
    });
  }

  addProject(project: Project): Promise<Project> {
    return this.request<Project>(`${environment.apiBaseUrl}/projects`, {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  deleteProject(id: string): Promise<void> {
    return this.request<void>(`${environment.apiBaseUrl}/projects/${id}`, {
      method: 'DELETE',
    });
  }

  addResource(resource: Resource): Promise<Resource> {
    return this.request<Resource>(`${environment.apiBaseUrl}/resources`, {
      method: 'POST',
      body: JSON.stringify(resource),
    });
  }

  deleteResource(id: string): Promise<void> {
    return this.request<void>(`${environment.apiBaseUrl}/resources/${id}`, {
      method: 'DELETE',
    });
  }

  getSprints(): Promise<Sprint[]> {
    return this.request<Sprint[]>(`${environment.apiBaseUrl}/sprints`);
  }

  addSprint(sprint: Sprint): Promise<Sprint> {
    return this.request<Sprint>(`${environment.apiBaseUrl}/sprints`, {
      method: 'POST',
      body: JSON.stringify(sprint),
    });
  }

  updateSprint(id: string, patch: Partial<Sprint>): Promise<Sprint> {
    return this.request<Sprint>(`${environment.apiBaseUrl}/sprints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
  }

  deleteSprint(id: string): Promise<void> {
    return this.request<void>(`${environment.apiBaseUrl}/sprints/${id}`, {
      method: 'DELETE',
    });
  }
}
