import { Injectable, EventEmitter, Inject } from '@angular/core';
import {LOCAL_STORAGE, WebStorageService} from 'angular-webstorage-service';
import { Observable, of, throwError } from 'rxjs';

export class Param {
  path: string;
  type: string;
  value: any;
  opts: object;

  valueChange = new EventEmitter();

  constructor(path: string, type: string, value: any, opts: object) {
    this.path = path;
    this.type = type;
    this.value = value;
    this.opts = opts || {};
  }

  set(value: any): void {
    if (this.value !== value) {
      this.value = value;
      this.valueChange.emit(this.value);
    }
  }
}

export class Params {
  params: Param[] = [];
  removers = {};

  valueChange = new EventEmitter();
  schemaChange = new EventEmitter();

  add(param: Param) {
    const listener = value => {
      this.valueChange.emit({path: param.path, value});
    };

    const subscription = param.valueChange.subscribe(listener);
    const remover = () => subscription.unsubscribe();

    this.params.push(param);
    this.removers[param.path] = remover;

    this.schemaChange.emit();
  }

  remove(param: Param) {
    const idx = this.params.indexOf(param);

    if (idx < 0) {
      return;
    }

    this.params.splice(idx, 1);

    if (this.removers[param.path]) {
      const func = this.removers[param.path];
      func();
      delete this.removers[param.path];
    }

    this.schemaChange.emit();
  }

  get(path: string): Param {
    return this.params.find(p => p.path === path);
  }

  getValues(): object {
    const result = {};
    this.params.forEach(p => result[p.path] = p.value);
    return result;
  }
}

export class Client {
  host: string;
  port: number;
  oscClient: any = undefined;
  syncParams: Params = new Params();
  lastSchemaData: [] = undefined;

  newValue = new EventEmitter();
  newSchema = new EventEmitter();

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

  sendValue(path: string, value: any): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (this.oscClient) {
        // this.oscClient.send()
        resolve(true);
        return;
      }

      reject(new Error('OSC not implemented yet'));
    });
  }

  getSyncParams(): Params {
    return this.syncParams;
  }
}

export class Schema {
  data: {path: string, type: string, value?: any}[] = [];

  constructor(data: any) {
    this.data = data || [];
  }

  applyTo(params: Params): void {
    // console.log(this.data);

    this.data.forEach(item => {
      // already exists?
      if (params.get(item.path)) {
        return;
      }


      const p = new Param(item.path, item.type, item.value, {});
      params.add(p);
    });
  }
}

export function createSyncParams(client: Client, schemaData?: []): {params: Params, destroy: () => void} {
  const params = new Params();

  // TODO; also apply schema updates?
  const data = schemaData || client.lastSchemaData || [];

  const schema = new Schema(schemaData);
  schema.applyTo(params);

  const subscr = client.newValue.subscribe((info) => {
    const { path, value } = info;
    const param = params.get(path);
    if (param) {
      param.set(value);
      return;
    }
    console.warn('param not found:',path);
  });

  const destroy = () => {
    console.log('unsubbing!');
    subscr.unsubscribe();
  };

  return { params, destroy };
}

@Injectable({
  providedIn: 'root'
})

export class RemoteParamsService {
  clients: Client[] = []; // will contain <sessionId>:<remote_params_client> pairs
  onConnect = new EventEmitter();
  onDisconnect = new EventEmitter();
  localValues = {};

  constructor(
    @Inject(LOCAL_STORAGE) private storage: WebStorageService
  ) {
    this._load();
  }

  listenForAnnouncements(port) {
  }

  connect(host: string, port: number) {
    const sessionId = `${host}:${port}`;

    if (this._getClient(sessionId)) {
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
    const c = this._getClient(sessionId); // this.clients[sessionId];

    if (c === undefined) {
      console.warn(`Could not find client for id: ${sessionId}`);
      return;
    }

    c.disconnect();
    // delete this.clients[sessionId];
    this.clients.splice(this.clients.findIndex(cli => cli.getId() === sessionId), 1);
    this.onConnect.emit(c);

    this._save();
  }

  getClients(): Observable<Client[]> {
    // return of(Object.values(this.clients));
    return of(Object.values(this.clients));
  }

  getClient(sessionId: string): Observable<Client> {
    return new Observable<Client>((observer) => {
      this.getClients().subscribe(clients => {
          const foundClient = clients.find(client => client.getId() === sessionId);
          if (foundClient) {
            observer.next(foundClient);
          } else {
            observer.error(`Could not find client with sessionId: ${sessionId}`);
          }
      });
    });
  }

  _getClient(sessionId: string): Client {
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

  getLocalValue(sessionId: string, path: string): any {
    if (this.localValues[sessionId] === undefined) {
      return undefined;
    }

    return this.localValues[sessionId][path];
  }

  setLocalValue(sessionId: string, path: string, value: any): void {
    if (this.localValues[sessionId] === undefined) {
      this.localValues[sessionId] = {}
    }
    this.localValues[sessionId][path] = value;
  }
}
