import { Component, inject, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TicketStoreService } from '../board/ticket-store.service';
import { AuthService } from '../core/auth.service';
import { IconComponent } from '../shared/icon.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-export-panel',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './export-panel.component.html',
})
export class ExportPanelComponent {
  store = inject(TicketStoreService);
  auth  = inject(AuthService);
  close = output<void>();

  // ── Form state ────────────────────────────────────────────────────────────
  selectedResourceId = signal<string>('');
  selectedProjectId  = signal<string>('');   // '' = all projects
  fromDate           = signal<string>('');   // ISO date string yyyy-MM-dd
  toDate             = signal<string>('');

  // ── UI state ──────────────────────────────────────────────────────────────
  loading = signal(false);
  error   = signal<string | null>(null);
  success = signal(false);

  // Computed lookups moved out of the template to avoid parser limitations
  selectedResource = computed(() =>
    this.store.resources().find(r => r.id === this.selectedResourceId())
  );

  selectedProject = computed(() =>
    this.store.projects().find(p => p.id === this.selectedProjectId())
  );

  async download(): Promise<void> {
    if (!this.selectedResourceId()) {
      this.error.set('Please select a developer.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    try {
      const params = new URLSearchParams({ resourceId: this.selectedResourceId() });
      if (this.selectedProjectId()) params.set('projectId', this.selectedProjectId());
      if (this.fromDate())          params.set('from', this.fromDate());
      if (this.toDate())            params.set('to',   this.toDate());

      const url   = `${environment.apiBaseUrl}/export/report?${params}`;
      const token = this.auth.getToken();

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        this.error.set(`Export failed (${res.status}). Check your filters and try again.`);
        return;
      }

      const blob     = await res.blob();
      const resource = this.store.resources().find(r => r.id === this.selectedResourceId());
      const name     = resource?.name.replace(/\s+/g, '-').toLowerCase() ?? this.selectedResourceId();
      const filename = `report-${name}${this.fromDate() ? '-' + this.fromDate() : ''}.xlsx`;

      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);

      this.success.set(true);
      setTimeout(() => this.success.set(false), 3000);

    } catch {
      this.error.set('Network error. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  reset(): void {
    this.selectedResourceId.set('');
    this.selectedProjectId.set('');
    this.fromDate.set('');
    this.toDate.set('');
    this.error.set(null);
    this.success.set(false);
  }
}
