import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { AppConfigService } from './app/core/app-config.service';

const appConfigService = new AppConfigService();

appConfigService.load()
  .then(() => bootstrapApplication(AppComponent, {
    ...appConfig,
    providers: [
      ...(appConfig.providers ?? []),
      { provide: AppConfigService, useValue: appConfigService },
    ],
  }))
  .catch((err) => console.error(err));
