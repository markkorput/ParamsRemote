import { Injectable, Inject } from '@angular/core';
import {LOCAL_STORAGE, WebStorageService} from 'angular-webstorage-service';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor(
    @Inject(LOCAL_STORAGE) private storage: WebStorageService
  ) {
  }

  storageId(sessionId: string): string {
    return `session_settings-${sessionId}`;
  }

  getSessionSettings(sessionId: string): object {
    return this.storage.get(this.storageId(sessionId));
  }

  setSessionSettings(sessionId: string, settings: object): void {
    console.log(`setSessionSettings for ${sessionId}`);
    if (settings === null) {
      this.storage.remove(this.storageId(sessionId));
    } else {
      this.storage.set(this.storageId(sessionId), settings);
    }
  }
}
