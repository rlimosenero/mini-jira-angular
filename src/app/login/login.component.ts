import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
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
