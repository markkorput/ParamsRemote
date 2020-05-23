import { Injectable, Inject, InjectionToken } from '@angular/core';
import { LOCAL_STORAGE, StorageService, isStorageAvailable } from 'ngx-webstorage-service';

export const SettingsServiceInjectionToken =
    new InjectionToken<StorageService>('PARAMS_REMOTE_SETTINGS_SERVICE');

export interface GlobalSettings {
  clientIds?: string[];
}

export interface SessionSettings {
  liveUpdates?: boolean;
  persistView?: boolean;
  collapsedPaths?: string[];
  restoreValuesEnabled?: boolean;
  restoreValues?: object;
  style?: string;
}

// const sessionStorageAvailable = isStorageAvailable(sessionStorage);
// console.log(`Session storage available: ${sessionStorageAvailable}`);
// TODO: show warning when not available
const localStorageAvailable = isStorageAvailable(localStorage);
console.log(`Local storage available: ${localStorageAvailable}`);

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor(
    // @Inject(LOCAL_STORAGE) private storage: WebStorageService
    @Inject(LOCAL_STORAGE) private storage: StorageService
  ) { }

  storageId(sessionId: string): string {
    return `session_settings-${sessionId}`;
  }

  getSessionSettings(sessionId: string): SessionSettings {
    return this.storage.get(this.storageId(sessionId)) as SessionSettings;
  }

  setSessionSettings(sessionId: string, settings: SessionSettings): void {
    console.log(`setSessionSettings for ${sessionId}: ${settings}`);
    if (settings === null) {
      this.storage.remove(this.storageId(sessionId));
    } else {
      this.storage.set(this.storageId(sessionId), settings);
    }
  }

  setGlobalSettings(settings: GlobalSettings): void {
    if (settings === null) {
      this.storage.remove('global');
    } else {
      this.storage.set('global', settings);
    }
  }

  getGlobalSettings(): GlobalSettings {
    return (this.storage.get('global') || {}) as GlobalSettings;
  }
}
