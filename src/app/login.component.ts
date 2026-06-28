import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[var(--mj-bg)] px-4">
      <div class="w-full max-w-sm rounded-3xl border bg-white p-6 shadow-sm" style="border-color: var(--mj-line)">
        <div class="mb-8 text-center">
          <h1 class="mj-mono text-2xl font-semibold">MINI-JIRA</h1>
          <p class="mj-sans text-sm text-[var(--mj-ink-soft)] mt-2">Sign in to continue to your board.</p>
        </div>

        <label class="mj-mono text-[11px] font-semibold tracking-wide" style="color: var(--mj-ink-soft)">USERNAME</label>
        <input
          [(ngModel)]="username"
          placeholder="Enter username"
          class="mj-sans w-full text-sm mt-1 mb-4 p-3 rounded-xl border outline-none"
          style="background: var(--mj-bg); border-color: var(--mj-line)"
        />

        <label class="mj-mono text-[11px] font-semibold tracking-wide" style="color: var(--mj-ink-soft)">PASSWORD</label>
        <input
          type="password"
          [(ngModel)]="password"
          (keydown.enter)="submit()"
          placeholder="Enter password"
          class="mj-sans w-full text-sm mt-1 mb-4 p-3 rounded-xl border outline-none"
          style="background: var(--mj-bg); border-color: var(--mj-line)"
        />

        @if (displayError()) {
          <div class="mj-sans text-sm text-red-600 mb-4">{{ displayError() }}</div>
        }

        <button
          (click)="submit()"
          [disabled]="loading()"
          class="mj-sans w-full rounded-xl px-3 py-3 text-sm font-semibold text-white disabled:opacity-60"
          style="background: var(--mj-ink)"
        >
          {{ loading() ? 'Signing in…' : 'Sign in' }}
        </button>
      </div>
    </div>
  `,
})
export class LoginComponent {
  /** Error coming back from the API (e.g. invalid credentials), set by the parent. */
  serverError = input<string | null>(null);
  /** Whether a login request is currently in flight. */
  loading = input<boolean>(false);

  username = signal('');
  password = signal('');
  localError = signal('');
  login = output<{ username: string; password: string }>();

  displayError = computed(() => this.localError() || this.serverError());

  submit(): void {
    const name = this.username().trim();
    const pwd = this.password().trim();

    if (!name || !pwd) {
      this.localError.set('Please enter both a username and password.');
      return;
    }

    this.localError.set('');
    this.login.emit({ username: name, password: pwd });
  }
}
