import { Injectable, Inject } from '@angular/core';
// import {LOCAL_STORAGE, WebStorageService} from 'angular-webstorage-service';

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

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor(
    // @Inject(LOCAL_STORAGE) private storage: WebStorageService
  ) { }

  storageId(sessionId: string): string {
    return `session_settings-${sessionId}`;
  }

  getSessionSettings(sessionId: string): SessionSettings {
    // return this.storage.get(this.storageId(sessionId)) as SessionSettings;
    return {} as SessionSettings;
  }

  setSessionSettings(sessionId: string, settings: SessionSettings): void {
    console.log(`setSessionSettings for ${sessionId}: ${settings}`);
    if (settings === null) {
      // this.storage.remove(this.storageId(sessionId));
    } else {
      // this.storage.set(this.storageId(sessionId), settings);
    }
  }

  setGlobalSettings(settings: GlobalSettings): void {
    if (settings === null) {
      // this.storageId.remove('global');
    } else {
      // this.storage.set('global', settings);
    }
  }

  getGlobalSettings(): GlobalSettings {
    // return (this.storage.get('global') || {}) as GlobalSettings;
    return {} as GlobalSettings;
  }
}
