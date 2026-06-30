import { Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TicketStoreService } from '../board/ticket-store.service';
import { IconComponent } from '../shared/icon.component';

interface VelocityRow {
  sprintId: string;
  name: string;
  startDate: string;
  endDate: string;
  completed: number;
  committed: number;
}

@Component({
  selector: 'app-velocity-panel',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './velocity-panel.component.html',
})
export class VelocityPanelComponent {
  store = inject(TicketStoreService);

  activeProjectId = input.required<string>();
  close = output<void>();

  velocityData = computed<VelocityRow[]>(() => {
    const projectId = this.activeProjectId();
    const sprints = this.store
      .sprints()
      .filter((s) => projectId === 'all' || s.projectId === projectId)
      .slice()
      .sort((a, b) => a.startDate.localeCompare(b.startDate));

    return sprints.map((s) => {
      const sprintTickets = this.store.tickets().filter((t) => t.sprintId === s.id);
      const completed = sprintTickets
        .filter((t) => t.status === 'done')
        .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
      const committed = sprintTickets.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
      return { sprintId: s.id, name: s.name, startDate: s.startDate, endDate: s.endDate, completed, committed };
    });
  });

  maxPoints = computed(() => Math.max(1, ...this.velocityData().map((d) => Math.max(d.committed, d.completed))));

  avgVelocity = computed(() => {
    const data = this.velocityData();
    if (data.length === 0) return 0;
    const total = data.reduce((sum, d) => sum + d.completed, 0);
    return Math.round((total / data.length) * 10) / 10;
  });

  barHeight(value: number): number {
    return Math.max(4, (value / this.maxPoints()) * 130);
  }

  projectSprints = computed(() =>
    this.activeProjectId() === 'all'
      ? this.store.sprints()
      : this.store.sprints().filter((s) => s.projectId === this.activeProjectId())
  );

  updateSprintName(id: string, name: string): void {
    this.store.updateSprint(id, { name });
  }

  updateSprintStart(id: string, startDate: string): void {
    this.store.updateSprint(id, { startDate });
  }

  updateSprintEnd(id: string, endDate: string): void {
    this.store.updateSprint(id, { endDate });
  }
}
