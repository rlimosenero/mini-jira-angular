import { Injectable } from '@angular/core';

export interface AppConfig {
  apiBaseUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config: AppConfig = {
    apiBaseUrl: 'http://localhost:8080/api/v1',
  };

  async load(): Promise<void> {
    const candidates = [
      new URL('./app-config.json', window.location.href).toString(),
      new URL('/app-config.json', window.location.origin).toString(),
      new URL('./assets/app-config.json', window.location.href).toString(),
      new URL('/assets/app-config.json', window.location.origin).toString(),
    ];

    for (const url of candidates) {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        console.log('[AppConfig] trying:', url, 'status:', response.status);
        if (!response.ok) continue;

        const loaded = (await response.json()) as Partial<AppConfig>;
        this.config = {
          ...this.config,
          ...loaded,
        };

        console.log('[AppConfig] loaded from:', url);
        console.log('[AppConfig] apiBaseUrl:', this.config.apiBaseUrl);
        return;
      } catch (err) {
        console.warn('[AppConfig] failed to load config from:', url, err);
      }
    }

    console.warn('[AppConfig] using fallback apiBaseUrl:', this.config.apiBaseUrl);
  }

  get apiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }
}
