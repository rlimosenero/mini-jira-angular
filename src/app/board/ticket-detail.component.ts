import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { COLUMNS, PRIORITY_META, POINT_OPTIONS, TicketComment } from '../shared/models';
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
  close    = output<void>();

  columns      = COLUMNS;
  priorityMeta = PRIORITY_META;
  priorityKeys = Object.keys(PRIORITY_META) as (keyof typeof PRIORITY_META)[];
  pointOptions = POINT_OPTIONS;

  draftTicketId = signal<string | null>(null);
  draftTitle = signal('');
  draftDescription = signal('');
  newComment = signal('');
  commentsLoading = signal(false);

  ticket = computed(() => {
    const id = this.ticketId();
    return id ? this.store.tickets().find((t) => t.id === id) ?? null : null;
  });

  titleDirty = computed(() => this.ticket()?.title !== this.draftTitle());
  descriptionDirty = computed(() => this.ticket()?.description !== this.draftDescription());

  sprintsForTicket = computed(() => {
    const t = this.ticket();
    return t ? this.store.sprints().filter((s) => s.projectId === t.projectId) : [];
  });

  comments = computed<TicketComment[]>(() => {
    const id = this.ticketId();
    return id ? this.store.commentsFor(id) : [];
  });

  constructor() {
    // Whenever the panel opens for a different ticket, set local edit drafts.
    effect(() => {
      const t = this.ticket();
      if (!t) {
        this.draftTicketId.set(null);
        this.draftTitle.set('');
        this.draftDescription.set('');
        return;
      }

      if (this.draftTicketId() !== t.id) {
        this.draftTicketId.set(t.id);
        this.draftTitle.set(t.title);
        this.draftDescription.set(t.description);
        this.newComment.set('');
      }
    });

    // Whenever the panel opens for a different ticket, fetch its comments.
    effect(() => {
      const id = this.ticketId();
      if (!id) return;

      this.commentsLoading.set(true);
      void this.store.loadComments(id).finally(() => this.commentsLoading.set(false));
    });
  }

  saveTitle(): void {
    const t = this.ticket();
    if (!t) return;

    const title = this.draftTitle().trim();
    if (!title) {
      this.draftTitle.set(t.title);
      return;
    }

    if (title !== t.title) this.store.updateTicket(t.id, { title });
    this.draftTitle.set(title);
  }

  saveDescription(): void {
    const t = this.ticket();
    if (!t) return;

    const description = this.draftDescription();
    if (description !== t.description) this.store.updateTicket(t.id, { description });
  }

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

  submitComment(): void {
    const t = this.ticket();
    if (!t) return;

    this.store.addComment(t.id, this.newComment());
    this.newComment.set('');
  }

  /**
   * Format an ISO datetime string into a short, readable date + time.
   * e.g. '2026-07-07T14:23:00' → 'Jul 7, 2026, 2:23 PM'
   */
  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
      hour:  'numeric',
      minute: '2-digit',
    });
  }
}
