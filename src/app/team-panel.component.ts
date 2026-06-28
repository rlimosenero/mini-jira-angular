import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TicketStoreService } from './ticket-store.service';
import { IconComponent } from './icon.component';
import { colorFor, initials } from './utils';

@Component({
  selector: 'app-team-panel',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-20 flex justify-end" (click)="close.emit()">
      <div class="flex-1" style="background: rgba(28,35,51,0.25)"></div>
      <div class="w-full sm:w-96 h-full overflow-y-auto p-5 bg-white border-l" style="border-color: var(--mj-line)" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h2 class="mj-mono text-sm font-semibold tracking-wide">TEAM &amp; WORKLOAD</h2>
          <button (click)="close.emit()" aria-label="Close">
            <app-icon name="x" [size]="18" style="color: var(--mj-ink-soft)" />
          </button>
        </div>

        <div class="flex flex-col gap-2 mb-5">
          @for (r of store.resources(); track r.id) {
            <div class="flex items-center gap-3 p-2 rounded-md border" style="border-color: var(--mj-line)">
              <span
                class="mj-mono text-[11px] font-semibold w-8 h-8 rounded-full flex items-center justify-center text-white"
                [style.background]="colorFor(r.name)"
              >
                {{ initials(r.name) }}
              </span>
              <div class="flex-1">
                <p class="mj-sans text-sm font-medium leading-tight">{{ r.name }}</p>
                <p class="mj-sans text-xs" style="color: var(--mj-ink-soft)">{{ r.role }}</p>
              </div>
              <span class="mj-mono text-xs px-2 py-0.5 rounded-full" style="background: var(--mj-bg); color: var(--mj-ink-soft)">
                {{ openCount(r.id) }} open
              </span>
              <button (click)="store.removeResource(r.id)" [attr.aria-label]="'Remove ' + r.name">
                <app-icon name="trash" [size]="14" style="color: var(--mj-ink-soft)" />
              </button>
            </div>
          } @empty {
            <p class="mj-sans text-sm" style="color: var(--mj-ink-soft)">No team members yet.</p>
          }
        </div>

        <label class="mj-mono text-[11px] font-semibold tracking-wide" style="color: var(--mj-ink-soft)">ADD TEAM MEMBER</label>
        <div class="flex flex-col gap-2 mt-1 mb-2">
          <input
            [(ngModel)]="newResourceName"
            placeholder="Name"
            class="mj-sans text-sm p-2 rounded-md outline-none border"
            style="background: var(--mj-bg); border-color: var(--mj-line)"
          />
          <input
            [(ngModel)]="newResourceRole"
            placeholder="Role (optional)"
            class="mj-sans text-sm p-2 rounded-md outline-none border"
            style="background: var(--mj-bg); border-color: var(--mj-line)"
          />
          <button (click)="addResource()" class="mj-sans text-sm px-3 py-2 rounded-md text-white" style="background: var(--mj-ink)">
            Add to team
          </button>
        </div>

        <div class="mj-perf my-5"></div>

        <h3 class="mj-mono text-xs font-semibold tracking-wide mb-2" style="color: var(--mj-ink-soft)">PROJECTS</h3>
        <div class="flex flex-col gap-2">
          @for (p of store.projects(); track p.id) {
            <div class="flex items-center gap-3 p-2 rounded-md border" style="border-color: var(--mj-line)">
              <span class="mj-mono text-xs font-semibold px-2 py-1 rounded" style="background: var(--mj-bg); color: var(--mj-ink-soft)">{{ p.key }}</span>
              <span class="mj-sans text-sm flex-1">{{ p.name }}</span>
              <span class="mj-mono text-xs" style="color: var(--mj-ink-soft)">{{ projectTicketCount(p.id) }} tickets</span>
              <button (click)="store.removeProject(p.id)" [attr.aria-label]="'Remove ' + p.name">
                <app-icon name="trash" [size]="14" style="color: var(--mj-ink-soft)" />
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class TeamPanelComponent {
  store = inject(TicketStoreService);
  close = output<void>();

  newResourceName = '';
  newResourceRole = '';

  colorFor = colorFor;
  initials = initials;

  openCount(resourceId: string): number {
    return this.store.tickets().filter((t) => t.resourceId === resourceId && t.status !== 'done').length;
  }

  projectTicketCount(projectId: string): number {
    return this.store.tickets().filter((t) => t.projectId === projectId).length;
  }

  addResource(): void {
    this.store.addResource(this.newResourceName, this.newResourceRole);
    this.newResourceName = '';
    this.newResourceRole = '';
  }
}
