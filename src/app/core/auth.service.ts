import { Injectable, signal, effect, inject } from '@angular/core';
import { TicketApiService } from './ticket-api.service';

const LS_KEY = 'mini-jira-current-user';

function load(): string | null {
  try {
    return window.localStorage.getItem(LS_KEY);
  } catch {
    return null;
  }
}

function save(value: string | null): void {
  try {
    if (value) window.localStorage.setItem(LS_KEY, value);
    else window.localStorage.removeItem(LS_KEY);
  } catch {
    // ignore persistence failure silently
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(TicketApiService);

  /** Username of the signed-in user, or null if signed out. Persisted across reloads. */
  readonly currentUser = signal<string | null>(load());

  constructor() {
    effect(() => save(this.currentUser()));
  }

  /** Checks credentials against the API. Resolves to true on success, false on bad credentials or a network error. */
  async login(username: string, password: string): Promise<boolean> {
    try {
      const users = await this.api.login(username, password);
      const matched = users.length > 0;
      if (matched) this.currentUser.set(username);
      return matched;
    } catch {
      return false;
    }
  }

  logout(): void {
    this.currentUser.set(null);
  }
}
