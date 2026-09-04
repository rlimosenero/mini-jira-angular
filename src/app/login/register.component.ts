import {
  Component,
  output,
  signal
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent {

  username = signal('');
  password = signal('');

  register = output<{
    username: string;
    password: string;
  }>();

  cancel = output<void>();

  submit() {

    this.register.emit({
      username: this.username(),
      password: this.password()
    });

  }
}