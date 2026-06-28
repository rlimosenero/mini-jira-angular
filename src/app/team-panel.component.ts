import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TicketStoreService } from './ticket-store.service';
import { IconComponent } from './icon.component';
import { colorFor, initials } from './utils';

@Component({
  selector: 'app-team-panel',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './team-panel.component.html',
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
