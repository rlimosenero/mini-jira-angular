import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TicketStoreService } from './board/ticket-store.service';
import { AuthService } from './core/auth.service';
import { BoardComponent } from './board/board.component';
import { TicketDetailComponent } from './board/ticket-detail.component';
import { TeamPanelComponent } from './team/team-panel.component';
import { LoginComponent } from './login/login.component';
import { IconComponent } from './shared/icon.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, BoardComponent, TicketDetailComponent, TeamPanelComponent, LoginComponent, IconComponent],
  templateUrl: './app.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class AppComponent {
  store = inject(TicketStoreService);
  auth = inject(AuthService);

  activeProjectId = signal<string>('all');
  activeResourceId = signal<string | null>(null);
  loginError = signal<string | null>(null);
  loginLoading = signal(false);
  query = signal('');
  activeTicketId = signal<string | null>(null);
  showTeamPanel = signal(false);
  showProjectForm = signal(false);
  newProjectName = '';

  filteredTickets = computed(() => {
    const projectId = this.activeProjectId();
    const resourceId = this.activeResourceId();
    const q = this.query().trim().toLowerCase();
    return this.store.tickets().filter((t) => {
      if (projectId !== 'all' && t.projectId !== projectId) return false;
      if (resourceId && t.resourceId !== resourceId) return false;
      if (!q) return true;
      const res = this.store.resourceById(t.resourceId);
      return (
        t.title.toLowerCase().includes(q) ||
        this.store.ticketKey(t).toLowerCase().includes(q) ||
        (res?.name ?? '').toLowerCase().includes(q)
      );
    });
  });

  addProject(): void {
    const p = this.store.addProject(this.newProjectName);
    if (p) {
      this.activeProjectId.set(p.id);
      this.newProjectName = '';
      this.showProjectForm.set(false);
    }
  }

  handleLogin(payload: { username: string; password: string }): void {
    this.loginLoading.set(true);
    this.loginError.set(null);
    this.auth.login(payload.username, payload.password).subscribe((success) => {
      this.loginLoading.set(false);
      if (!success) this.loginError.set('Invalid username or password.');
    });
  }
}
