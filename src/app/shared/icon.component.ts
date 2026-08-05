import { Component, input } from '@angular/core';

export type IconName =
  | 'plus'
  | 'x'
  | 'search'
  | 'trash'
  | 'grip'
  | 'ticket'
  | 'users'
  | 'folder'
  | 'trending-up'
  | 'download'
  | 'check';

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.component.html',
})
export class IconComponent {
  name = input.required<IconName>();
  size = input<number>(16);
}
