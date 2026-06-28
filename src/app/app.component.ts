import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TicketStoreService } from './ticket-store.service';
import { BoardComponent } from './board.component';
import { TicketDetailComponent } from './ticket-detail.component';
import { TeamPanelComponent } from './team-panel.component';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, BoardComponent, TicketDetailComponent, TeamPanelComponent, IconComponent],
  template: `
    <div class="min-h-screen mj-sans" style="background: var(--mj-bg); color: var(--mj-ink)">
      <!-- Header -->
      <header class="border-b px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4" style="border-color: var(--mj-line)">
        <div class="flex items-center gap-2">
          <app-icon name="ticket" [size]="20" style="color: var(--mj-amber)" />
          <h1 class="mj-mono text-lg font-semibold tracking-tight">MINI-JIRA</h1>
        </div>
        <div class="flex-1"></div>
        <div class="relative w-full sm:w-56">
          <app-icon name="search" [size]="14" class="absolute left-2.5 top-1/2 -translate-y-1/2" style="color: var(--mj-ink-soft)" />
          <input
            [ngModel]="query()"
            (ngModelChange)="query.set($event)"
            placeholder="Search tickets, key, person"
            class="mj-sans w-full text-sm pl-8 pr-3 py-2 rounded-md outline-none border"
            style="background: var(--mj-card); border-color: var(--mj-line)"
          />
        </div>
        <button
          (click)="showTeamPanel.set(true)"
          class="mj-sans text-sm flex items-center gap-1.5 px-3 py-2 rounded-md border"
          style="background: var(--mj-card); border-color: var(--mj-line)"
        >
          <app-icon name="users" [size]="15" />
          Team
        </button>
      </header>

      <!-- Project tabs -->
      <div class="px-4 sm:px-6 pt-3 flex items-center gap-2 flex-wrap">
        <app-icon name="folder" [size]="15" style="color: var(--mj-ink-soft)" />
        <button
          (click)="activeProjectId.set('all')"
          class="mj-mono mj-chip text-xs font-semibold px-3 py-1.5 rounded-full border"
          [style.background]="activeProjectId() === 'all' ? 'var(--mj-ink)' : 'var(--mj-card)'"
          [style.color]="activeProjectId() === 'all' ? '#fff' : 'var(--mj-ink-soft)'"
          style="border-color: var(--mj-line)"
        >
          ALL PROJECTS
        </button>
        @for (p of store.projects(); track p.id) {
          <button
            (click)="activeProjectId.set(p.id)"
            class="mj-mono mj-chip text-xs font-semibold px-3 py-1.5 rounded-full border"
            [style.background]="activeProjectId() === p.id ? 'var(--mj-ink)' : 'var(--mj-card)'"
            [style.color]="activeProjectId() === p.id ? '#fff' : 'var(--mj-ink-soft)'"
            style="border-color: var(--mj-line)"
          >
            {{ p.key }} · {{ p.name }}
          </button>
        }

        @if (showProjectForm()) {
          <div class="flex items-center gap-1.5">
            <input
              autofocus
              [(ngModel)]="newProjectName"
              (keydown.enter)="addProject()"
              (keydown.escape)="showProjectForm.set(false)"
              placeholder="Project name"
              class="mj-sans text-xs px-2 py-1.5 rounded-md outline-none border"
              style="border-color: var(--mj-line)"
            />
            <button (click)="addProject()" class="mj-mono text-xs px-2 py-1.5 rounded-md text-white" style="background: var(--mj-ink)">Add</button>
            <button (click)="showProjectForm.set(false)" aria-label="Cancel">
              <app-icon name="x" [size]="14" style="color: var(--mj-ink-soft)" />
            </button>
          </div>
        } @else {
          <button
            (click)="showProjectForm.set(true)"
            class="mj-mono text-xs flex items-center gap-1 px-3 py-1.5 rounded-full"
            style="color: var(--mj-ink-soft); border: 1px dashed var(--mj-line)"
          >
            <app-icon name="plus" [size]="12" />
            PROJECT
          </button>
        }
      </div>

      <div class="px-4 sm:px-6 pt-3 flex items-center gap-2 flex-wrap">
        <app-icon name="users" [size]="15" style="color: var(--mj-ink-soft)" />
        <button
          (click)="activeResourceId.set(null)"
          class="mj-mono mj-chip text-xs font-semibold px-3 py-1.5 rounded-full border"
          [style.background]="activeResourceId() === null ? 'var(--mj-ink)' : 'var(--mj-card)'"
          [style.color]="activeResourceId() === null ? '#fff' : 'var(--mj-ink-soft)'"
          style="border-color: var(--mj-line)"
        >
          ALL TEAM
        </button>
        @for (r of store.resources(); track r.id) {
          <button
            (click)="activeResourceId.set(r.id)"
            class="mj-mono mj-chip text-xs font-semibold px-3 py-1.5 rounded-full border"
            [style.background]="activeResourceId() === r.id ? 'var(--mj-ink)' : 'var(--mj-card)'"
            [style.color]="activeResourceId() === r.id ? '#fff' : 'var(--mj-ink-soft)'"
            style="border-color: var(--mj-line)"
          >
            {{ r.name }}
          </button>
        }
      </div>
      <!-- End All Projects -->

      <app-board
        [tickets]="filteredTickets()"
        [showProjectLabel]="activeProjectId() === 'all'"
        [activeProjectId]="activeProjectId()"
        (openTicket)="activeTicketId.set($event)"
      />

      <app-ticket-detail [ticketId]="activeTicketId()" (close)="activeTicketId.set(null)" />

      @if (showTeamPanel()) {
        <app-team-panel (close)="showTeamPanel.set(false)" />
      }
    </div>
  `,
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

  activeProjectId = signal<string>('all');
  activeResourceId = signal<string | null>(null);
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
}
