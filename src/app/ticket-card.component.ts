import { Component, input, output } from '@angular/core';
import { Ticket, Resource, PRIORITY_META } from './models';
import { colorFor, initials } from './utils';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-ticket-card',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="mj-card mj-stub rounded-lg p-3 cursor-pointer bg-white border" style="border-color: var(--mj-line)" (click)="open.emit(ticket().id)">
      <div class="flex items-center justify-between">
        <span class="mj-mono text-xs font-semibold" style="color: var(--mj-ink-soft)">{{ ticketKey() }}</span>
        <app-icon name="grip" [size]="14" style="color: var(--mj-line)" />
      </div>
      @if (projectLabel()) {
        <span class="mj-mono text-[10px]" style="color: var(--mj-ink-soft)">{{ projectLabel() }}</span>
      }
      <div class="mj-perf"></div>
      <p class="mj-sans text-sm font-medium leading-snug mb-2">{{ ticket().title }}</p>
      <div class="flex items-center justify-between">
        <span class="mj-mono mj-stamp" [style.color]="priorityColor()">{{ priorityLabel() }}</span>
        @if (resource()) {
          <span
            [title]="resource()!.name"
            class="mj-mono text-[10px] font-semibold w-6 h-6 rounded-full flex items-center justify-center text-white"
            [style.background]="avatarColor()"
          >
            {{ avatarInitials() }}
          </span>
        } @else {
          <span class="text-[10px]" style="color: var(--mj-line)">unassigned</span>
        }
      </div>
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
export class TicketCardComponent {
  ticket = input.required<Ticket>();
  resource = input<Resource | undefined>(undefined);
  projectLabel = input<string | undefined>(undefined);
  ticketKey = input.required<string>();

  open = output<string>();

  priorityLabel(): string {
    return PRIORITY_META[this.ticket().priority].label;
  }
  priorityColor(): string {
    return PRIORITY_META[this.ticket().priority].color;
  }
  avatarColor(): string {
    return colorFor(this.resource()?.name);
  }
  avatarInitials(): string {
    return initials(this.resource()?.name);
  }
}
