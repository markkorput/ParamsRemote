import { Injectable, EventEmitter, Inject } from '@angular/core';
import {LOCAL_STORAGE, WebStorageService} from 'angular-webstorage-service';
import { Observable, of } from 'rxjs';

class Client {
  host: string;
  port: number;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
  }

  getId(): string {
    return `${this.host}:${this.port}`;
  }

  connect() {
    console.log(`TODO: remote_params.Client.connect to ${this.host}:${this.port}`);
  }

  disconnect() {
    console.log(`TODO: remote_params.Client.disconnect from ${this.host}:${this.port}`);
  }
}

@Injectable({
  providedIn: 'root'
})

export class RemoteParamsService {
  clients: Client[] = []; // will contain <sessionId>:<remote_params_client> pairs
  onConnect = new EventEmitter();
  onDisconnect = new EventEmitter();

  constructor(
    @Inject(LOCAL_STORAGE) private storage: WebStorageService
  ) {
    this._load();
  }

  listenForAnnouncements(port) {
  }

  connect(host: string, port: number) {
    const sessionId = `${host}:${port}`;

    if (this.getClient(sessionId)) {
      console.log(`Already found a session with id ${sessionId}`);
      return this.clients[sessionId];
    }

    const client = new Client(host, port);
    client.connect();

    // this.clients[sessionId] = client;
    this.clients.push(client);
    this.onConnect.emit(client);

    // write to storage
    this._save();
    return client;
  }

  disconnect(sessionId: string) {
    const c = this.getClient(sessionId); // this.clients[sessionId];

    if (c === undefined) {
      console.warn(`Could not find client for id: ${sessionId}`);
      return;
    }

    c.disconnect();
    // delete this.clients[sessionId];
    this.clients.splice(this.clients.findIndex(c => c.getId() === sessionId), 1);
    this.onConnect.emit(c);

    this._save();
  }

  getClients(): Observable<Client[]> {
    return of(Object.values(this.clients));
  }

  getClient(sessionId: string): Client {
    return this.clients.find(c => c.getId() === sessionId);
  }

  _save(): void {
    this.storage.set('clients', this.clients.map(c => ({host: c.host, port: c.port})));
  }

  _load(): number {
    let count = 0;

    (this.storage.get('clients') || []).forEach(c => {
      this.clients.push(new Client(c.host, c.port));
      count += 1;
    });

    return count;
  }
}
