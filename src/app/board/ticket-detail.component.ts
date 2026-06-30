import { Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { COLUMNS, PRIORITY_META, POINT_OPTIONS } from '../shared/models';
import { TicketStoreService } from './ticket-store.service';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './ticket-detail.component.html',
})
export class TicketDetailComponent {
  store = inject(TicketStoreService);

  ticketId = input<string | null>(null);
  close = output<void>();

  columns = COLUMNS;
  priorityMeta = PRIORITY_META;
  priorityKeys = Object.keys(PRIORITY_META) as (keyof typeof PRIORITY_META)[];
  pointOptions = POINT_OPTIONS;

  ticket = computed(() => {
    const id = this.ticketId();
    return id ? this.store.tickets().find((t) => t.id === id) ?? null : null;
  });

  sprintsForTicket = computed(() => {
    const t = this.ticket();
    if (!t) return [];
    return this.store.sprints().filter((s) => s.projectId === t.projectId);
  });

  updateStoryPoints(value: string | number | null): void {
    const t = this.ticket();
    if (!t) return;
    this.store.updateTicket(t.id, { storyPoints: value ? Number(value) : null });
  }

  deleteAndClose(): void {
    const t = this.ticket();
    if (t) this.store.deleteTicket(t.id);
    this.close.emit();
  }
}
