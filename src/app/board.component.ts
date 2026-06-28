import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { COLUMNS, Status, Ticket } from './models';
import { TicketStoreService } from './ticket-store.service';
import { TicketCardComponent } from './ticket-card.component';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [FormsModule, DragDropModule, TicketCardComponent, IconComponent],
  templateUrl: './board.component.html',
})
export class BoardComponent {
  store = inject(TicketStoreService);

  tickets = input.required<Ticket[]>();
  showProjectLabel = input<boolean>(false);
  activeProjectId = input.required<string>();

  openTicket = output<string>();

  columns = COLUMNS;
  columnIds = COLUMNS.map((c) => c.id);

  quickAddCol = signal<Status | null>(null);
  quickAddText = '';

  colTickets(status: Status): Ticket[] {
    return this.tickets().filter((t) => t.status === status);
  }

  onDrop(event: CdkDragDrop<Ticket[]>, status: Status): void {
    const ticket = event.item.data as Ticket;
    if (ticket.status !== status) {
      this.store.moveTicket(ticket.id, status);
    }
  }

  submitQuickAdd(status: Status): void {
    const projectId = this.activeProjectId() === 'all' ? this.store.projects()[0]?.id : this.activeProjectId();
    if (!projectId) return;
    this.store.addTicket(projectId, status, this.quickAddText);
    this.quickAddText = '';
    this.quickAddCol.set(null);
  }

  cancelQuickAdd(): void {
    this.quickAddText = '';
    this.quickAddCol.set(null);
  }
}
