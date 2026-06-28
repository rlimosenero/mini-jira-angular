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
  template: `
    <main class="px-4 sm:px-6 py-5 overflow-x-auto">
      <div class="flex gap-4 min-w-max" cdkDropListGroup>
        @for (col of columns; track col.id) {
          <div class="w-72 sm:w-80 rounded-lg p-3" style="background: #E6EAF0">
            <div class="flex items-center justify-between mb-3 px-1">
              <span class="mj-mono text-xs font-semibold tracking-wider" style="color: var(--mj-ink-soft)">{{ col.label }}</span>
              <span class="mj-mono text-xs" style="color: var(--mj-ink-soft)">{{ colTickets(col.id).length }}</span>
            </div>

            <div
              class="flex flex-col gap-3 min-h-[8px]"
              cdkDropList
              [id]="col.id"
              [cdkDropListData]="colTickets(col.id)"
              [cdkDropListConnectedTo]="columnIds"
              (cdkDropListDropped)="onDrop($event, col.id)"
            >
              @for (t of colTickets(col.id); track t.id) {
                <app-ticket-card
                  cdkDrag
                  [cdkDragData]="t"
                  [ticket]="t"
                  [ticketKey]="store.ticketKey(t)"
                  [resource]="store.resourceById(t.resourceId)"
                  [projectLabel]="showProjectLabel() ? store.projectById(t.projectId)?.name : undefined"
                  (open)="openTicket.emit($event)"
                />
              }

              @if (quickAddCol() === col.id) {
                <div class="rounded-lg p-2 bg-white border" style="border-color: var(--mj-line)">
                  <input
                    autofocus
                    [(ngModel)]="quickAddText"
                    (keydown.enter)="submitQuickAdd(col.id)"
                    (keydown.escape)="cancelQuickAdd()"
                    placeholder="Ticket title, then Enter"
                    class="mj-sans w-full text-sm outline-none mb-2"
                  />
                  <div class="flex gap-2">
                    <button (click)="submitQuickAdd(col.id)" class="mj-sans text-xs px-2 py-1 rounded text-white" style="background: var(--mj-ink)">
                      Add ticket
                    </button>
                    <button (click)="cancelQuickAdd()" class="mj-sans text-xs px-2 py-1 rounded" style="color: var(--mj-ink-soft)">
                      Cancel
                    </button>
                  </div>
                </div>
              } @else {
                <button
                  (click)="quickAddCol.set(col.id)"
                  class="mj-sans text-xs flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-white/60"
                  style="color: var(--mj-ink-soft)"
                >
                  <app-icon name="plus" [size]="14" />
                  New ticket
                </button>
              }
            </div>
          </div>
        }
      </div>
    </main>
  `,
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
