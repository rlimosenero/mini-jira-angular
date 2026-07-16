import {
  Injectable,
  effect,
  signal,
  computed,
  inject
} from '@angular/core';

import {
  AuthResponse
} from '../shared/models';

import { TicketApiService } from './ticket-api.service';

const LS_KEY = 'mini-jira-auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private api = inject(TicketApiService);

  readonly currentUser =
    signal<AuthResponse | null>(
      this.loadUser()
    );

  constructor() {
    effect(() => {
      const user = this.currentUser();

      if (user) {
        localStorage.setItem(
          LS_KEY,
          JSON.stringify(user)
        );

        localStorage.setItem(
          'jwt',
          user.token
        );
      } else {
        localStorage.removeItem(LS_KEY);
        localStorage.removeItem('jwt');
      }
    });
  }

  private loadUser(): AuthResponse | null {

    const value =
      localStorage.getItem(LS_KEY);

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  }

  async login(
    username: string,
    password: string
  ): Promise<boolean> {

    try {

      const response =
        await this.api.login(
          username,
          password
        );

      this.currentUser.set(response);

      return true;

    } catch {
      return false;
    }
  }

  async register(
    username: string,
    password: string
  ): Promise<boolean> {

    try {

      const response =
        await this.api.register(
          username,
          password
        );

      this.currentUser.set(response);

      return true;

    } catch {
      return false;
    }
  }

  logout(): void {
    this.currentUser.set(null);
  }

  readonly role = computed(
    () => this.currentUser()?.role
  );

  isAdmin(): boolean {
    return this.role() === 'ADMIN';
  }

  isProjectManager(): boolean {
    return this.role() === 'PROJECT_MANAGER';
  }

  isDeveloper(): boolean {
    return this.role() === 'DEVELOPER';
  }

  isViewer(): boolean {
    return this.role() === 'VIEWER';
  }

  canCreateTicket(): boolean {
    return [
      'ADMIN',
      'PROJECT_MANAGER',
      'DEVELOPER'
    ].includes(this.role() ?? '');
  }

  canEditTicket(): boolean {
    return [
      'ADMIN',
      'PROJECT_MANAGER',
      'DEVELOPER'
    ].includes(this.role() ?? '');
  }

  canDeleteTicket(): boolean {
    return [
      'ADMIN',
      'PROJECT_MANAGER'
    ].includes(this.role() ?? '');
  }

  canManageTeam(): boolean {
    return [
      'ADMIN',
      'PROJECT_MANAGER'
    ].includes(this.role() ?? '');
  }
}