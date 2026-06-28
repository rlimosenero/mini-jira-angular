import { Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { COLUMNS, PRIORITY_META } from '../shared/models';
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

  ticket = computed(() => {
    const id = this.ticketId();
    return id ? this.store.tickets().find((t) => t.id === id) ?? null : null;
  });

  deleteAndClose(): void {
    const t = this.ticket();
    if (t) this.store.deleteTicket(t.id);
    this.close.emit();
  }
}
