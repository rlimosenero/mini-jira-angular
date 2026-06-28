import { Component, input, output } from '@angular/core';
import { Ticket, Resource, PRIORITY_META } from '../shared/models';
import { colorFor, initials } from '../shared/utils';
import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-ticket-card',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './ticket-card.component.html',
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
