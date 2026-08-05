import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TicketStoreService } from './board/ticket-store.service';
import { AuthService } from './core/auth.service';
import { BoardComponent } from './board/board.component';
import { TicketDetailComponent } from './board/ticket-detail.component';
import { TeamPanelComponent } from './team/team-panel.component';
import { VelocityPanelComponent } from './velocity/velocity-panel.component';
import { LoginComponent } from './login/login.component';
import { IconComponent } from './shared/icon.component';
import { RegisterComponent } from './login/register.component';
import { ExportPanelComponent } from './export/export-panel.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, BoardComponent, TicketDetailComponent, TeamPanelComponent, VelocityPanelComponent, LoginComponent, IconComponent, RegisterComponent, ExportPanelComponent],
  templateUrl: './app.component.html',
  styles: [`:host { display: block; }`],
})
export class AppComponent {
  store = inject(TicketStoreService);
  auth  = inject(AuthService);

  showRegister      = signal(false);
  activeProjectId   = signal<string>('all');
  activeSprintId    = signal<string>('all');
  activeResourceId  = signal<string | null>(null); // used by admin/PM chip clicks
  loginError        = signal<string | null>(null);
  loginLoading      = signal(false);
  query             = signal('');
  activeTicketId    = signal<string | null>(null);
  showTeamPanel     = signal(false);
  showVelocityPanel = signal(false);
  showExportPanel   = signal(false);
  showProjectForm   = signal(false);
  newProjectName    = '';

  // ─── Developer resource resolution ────────────────────────────────────────
  /**
   * For a DEVELOPER: find the Resource whose name matches their username
   * (case-insensitive). This is the "self" resource used to lock the board.
   */
  developerResource = computed(() => {
    if (!this.auth.isDeveloper()) return null;
    const username = this.auth.currentUser()?.username?.toLowerCase() ?? '';
    return this.store.resources().find(
      (r) => r.name.toLowerCase() === username
    ) ?? null;
  });

  /**
   * The resource ID actually applied to board filtering:
   * - DEVELOPER → always their own resource id (locked)
   * - ADMIN / PM → whatever chip they clicked (or null = all)
   */
  effectiveResourceId = computed<string | null>(() => {
    if (this.auth.isDeveloper()) {
      return this.developerResource()?.id ?? null;
    }
    return this.activeResourceId();
  });

  // ─── Project visibility ────────────────────────────────────────────────────
  /**
   * DEVELOPER: only projects they have at least one ticket in.
   * ADMIN/PM + resource chip selected: only projects that resource is involved in.
   * ADMIN/PM + no chip: all projects.
   */
  visibleProjects = computed(() => {
    const all        = this.store.projects();
    const resourceId = this.effectiveResourceId();
    if (!resourceId) return all;

    const involved = new Set(
      this.store.tickets()
        .filter((t) => t.resourceId === resourceId)
        .map((t) => t.projectId)
    );
    return all.filter((p) => involved.has(p.id));
  });

  // ─── Board ticket filter ───────────────────────────────────────────────────
  filteredTickets = computed(() => {
    const projectId  = this.activeProjectId();
    const sprintId   = this.activeSprintId();
    const resourceId = this.effectiveResourceId();
    const q          = this.query().trim().toLowerCase();

    return this.store.tickets().filter((t) => {
      if (projectId !== 'all' && t.projectId !== projectId) return false;
      if (sprintId === 'none' && t.sprintId)                 return false;
      if (sprintId !== 'all' && sprintId !== 'none' && t.sprintId !== sprintId) return false;
      if (resourceId && t.resourceId !== resourceId)          return false;
      if (!q) return true;
      const res = this.store.resourceById(t.resourceId);
      return (
        t.title.toLowerCase().includes(q) ||
        this.store.ticketKey(t).toLowerCase().includes(q) ||
        (res?.name ?? '').toLowerCase().includes(q)
      );
    });
  });

  projectSprints = computed(() => this.store.visibleSprints(this.activeProjectId()));

  // ─── Actions ───────────────────────────────────────────────────────────────
  selectProject(id: string): void {
    this.activeProjectId.set(id);
    this.activeSprintId.set('all');
  }

  /**
   * Admin/PM: selecting a resource chip resets the project tab to 'all'
   * so visibleProjects re-narrows correctly.
   */
  selectResource(id: string | null): void {
    this.activeResourceId.set(id);
    this.activeProjectId.set('all');
    this.activeSprintId.set('all');
  }

  addProject(): void {
    const p = this.store.addProject(this.newProjectName);
    if (p) {
      this.activeProjectId.set(p.id);
      this.newProjectName = '';
      this.showProjectForm.set(false);
    }
  }

  async handleRegister(payload: { username: string; password: string }): Promise<void> {
    const success = await this.auth.register(payload.username, payload.password);
    if (!success) this.loginError.set('Registration failed');
  }

  async handleLogin(payload: { username: string; password: string }): Promise<void> {
    this.loginLoading.set(true);
    this.loginError.set(null);
    const success = await this.auth.login(payload.username, payload.password);
    this.loginLoading.set(false);
    if (!success) this.loginError.set('Invalid username or password.');
  }
}
