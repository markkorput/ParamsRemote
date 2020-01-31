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

  add(param: Param, notify?: boolean) {
    const listener = value => {
      this.valueChange.emit({path: param.path, value});
    };

    const subscription = param.valueChange.subscribe(listener);
    const remover = () => subscription.unsubscribe();

    this.params.push(param);
    this.removers[param.path] = remover;

    if (notify || notify === undefined) {
      this.schemaChange.emit();
    }
  }

  addAll(params: Param[], notify?: boolean) {
    params.forEach(p => this.add(p, false));

    if ((notify || notify === undefined) && params.length > 0) {
      this.schemaChange.emit();
    }
  }

  remove(param: Param, notify?: boolean) {
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

    if (notify || notify === undefined) {
      this.schemaChange.emit();
    }
  }

  removeAll(params: Param[], notify?: boolean) {
    params.forEach(p => this.remove(p, false));

    if ((notify || notify === undefined) && params.length > 0) {
      this.schemaChange.emit();
    }
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

export class Schema {
  data: {path: string, type: string, value?: any}[] = [];

  constructor(data: {path: string, type: string, value?: any}[]) {
    this.data = data || [];
  }

  applyTo(params: Params): void {
    // remove any items already in params
    // that don't appear in this.data
    const adds = [];
    const removes = [];

    params.params.forEach((p) => {
      // any items already in params, before
      if (!this.data.find((item) => item.path === p.path)) {
        removes.push(p);
      }
    });

    // add all items in this.data that don't
    // already appear in params
    this.data.forEach(item => {
      // already exists?
      if (!params.get(item.path)) {
        const p = new Param(item.path, item.type, item.value, {});
        adds.push(p);
      }
    });

    params.removeAll(removes, false);
    params.addAll(adds, false);

    if (removes.length > 0 || adds.length > 0) {
      params.schemaChange.emit();
    }
  }
}

/**
 * OutInterface is a formalisation of all client-to-server
 * communications
 */
abstract class OutputInterface {
  abstract requestSchema(): void;
  abstract confirm(): void;
  abstract sendValue(path: string, value: any): void;
  abstract disconnect(): void;
}

class InputInterface {
  value: EventEmitter<[string, any]> = new EventEmitter<[string, any]>();
  schema: EventEmitter<[]> = new EventEmitter<[]>();
  connectConfirmation: EventEmitter<void> = new EventEmitter();
  disconnect: EventEmitter<void> = new EventEmitter();
}

export class Client {
  id: string = null;
  input: InputInterface = null;
  output: OutputInterface = null;
  params: Params = new Params();
  schema: Schema = null;

  syncParams: Params = new Params();
  lastSchemaData: [] = undefined;

  newValue = new EventEmitter();

  getId(): string {
    return this.id;
  }

  connect() {
  }

  disconnect() {
  }
}

class WebsocketsOutputInterface extends OutputInterface {
  static SCHEMA_REQUEST = `GET schema.json`;
  socket: WebSocket = null;

  constructor(socket?: WebSocket) {
    super();
    this.socket = socket;
  }

  requestSchema(): void {
    if (this.socket === null) {
      console.warn('no socket, can\'t request schema');
      return;
    }

    console.log(`Sending websocket schema request: ${WebsocketsOutputInterface.SCHEMA_REQUEST}`)
    this.socket.send(WebsocketsOutputInterface.SCHEMA_REQUEST);
  }

  confirm(): void {
    if (this.socket === null) {
      console.warn('no socket, can\'t confirm');
      return;
    }

    this.socket.send(`confirm`);
  }

  sendValue(path: string, value: any): void {
    if (this.socket === null) {
      console.warn(`no socket, can't send value: ${path} = ${value}`);
      return;
    }

    this.socket.send(`POST ${path}?value=${value}`);
  }

  disconnect(): void {
    if (this.socket === null) {
      console.warn('no socket, can\'t disconnect');
      return;
    }

    this.socket.send('disconnect');
  }
}

class WebsocketsInputInterface extends InputInterface {
  schemaPrefix = 'POST schema.json?schema=';

  constructor(socket?: WebSocket) {
    super();
    if (!socket) {
      return;
    }

    socket.addEventListener('message', (event) => this.onMessage(event.data));
  }

  onMessage(data: any): void {
    if (data.startsWith(this.schemaPrefix)) {
      const jsonText = data.substr(this.schemaPrefix.length);
      const jsonData = JSON.parse(jsonText);
      this.schema.emit(jsonData);
    }

    // POST <param-path>?value=<value>
    if (data.startsWith('POST ')) {
      const parts = data.substr('POST ').split('?value=');
      const path: string = parts[0];
      const value: any = parts[1];
      this.value.emit([path, value]);
    }
  }
}

//
// WebSockets
//

export class WebsocketsClient extends Client {
  static idprefix = 'wsock-';
  host: string = null;
  port: number = null;
  socket: WebSocket = null;

  static fromId(id: string): WebsocketsClient {
    if (!id || !id.startsWith(WebsocketsClient.idprefix)) {
      return null;
    }

    const parts = id.substr(WebsocketsClient.idprefix.length).split(':');

    if (parts.length !== 2) {
      return null;
    }

    return new WebsocketsClient(parts[0], parseInt(parts[1], 10));
  }

  constructor(host: string, port: number) {
    super();
    this.id = `${WebsocketsClient.idprefix}${host}:${port}`;
    this.host = host;
    this.port = port;
    this.setupInterfaces(null);
  }

  connect() {
    const url = `ws://${this.host}:${this.port}`;
    const s = new WebSocket(url);

    s.addEventListener('open', (event) => {
      console.log(`WebSocket connection to ${url} established`);
      this.socket = s;
      this.setupInterfaces(s);
      this.requestSchemaInformation();
    });

    s.onerror = (e) => this.disconnect();
    s.addEventListener('close', (evt) => this.disconnect());
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.setupInterfaces(null);
    }
  }

  setupInterfaces(socket: WebSocket): void {
    this.input = new WebsocketsInputInterface(socket); // dummy interface without socket
    this.output = new WebsocketsOutputInterface(socket); // dummy interface without socket

    if (!socket) {
      return;
    }

    this.input.schema.subscribe((schemaInfo: []) => {
      this.schema = new Schema(schemaInfo);
      this.schema.applyTo(this.params);
    });
  }

  requestSchemaInformation(maxAttempts?: number) {
    // request
    this.output.requestSchema();

    // schedule another request if multiple max attempts 
    if ((maxAttempts || 3) > 1) {
      setTimeout(() => {
        if (this.schema) {
          return;
        }

        this.requestSchemaInformation((maxAttempts || 3) - 1);
      }, 1000);
    }
  }
}

//
// OSC
//

class OscOutputInterface extends OutputInterface {
  host: string;
  port: number;

  constructor(host: string, port: number) {
    super();
    this.host = host;
    this.port = port;
  }

  requestSchema(): void {

  }

  confirm(): void {

  }

  sendValue(path: string, value: any): void {

  }

  disconnect(): void {

  }
}


class OscInputInterface extends InputInterface {
  port?: number;
  // oscServer: OscServer = null;

  constructor(source: number /*| OscServer*/) {
    super();
    if (typeof(source) === 'number') {
      this.port = source;
      // TODO: this.oscServer = new OscServeR(this.port)
    } /*else {
      this.oscServer = source;
    }*/

    // TODO: capture incoming message from the server
    // and process them to eventually emit some of our events.
  }
}

export class OscClient extends Client {
  static idprefix = 'osc-';

  static fromId(id: string): WebsocketsClient {
    if (!id || !id.startsWith(OscClient.idprefix)) {
      return null;
    }

    const parts = id.substr(OscClient.idprefix.length).split(':');

    if (parts.length !== 2) {
      return null;
    }

    return new WebsocketsClient(parts[0], parseInt(parts[1], 10));
  }

  constructor(host: string, port: number) {
    super();
    this.id = `${OscClient.idprefix}${host}:${port}`;
    this.output = new OscOutputInterface(host, port);
    // this.input = new OscInputInterface(port);
  }
}

// export function createSyncParams(client: Client, schemaData?: []): {params: Params, destroy: () => void} {
//   const params = new Params();

//   // TODO; also apply schema updates?
//   const data = schemaData || client.lastSchemaData || [];

//   const schema = new Schema(schemaData);
//   schema.applyTo(params);

//   const subscr = client.newValue.subscribe((info) => {
//     const { path, value } = info;
//     const param = params.get(path);
//     if (param) {
//       param.set(value);
//       return;
//     }
//     console.warn('param not found:', path);
//   });

//   const destroy = () => {
//     console.log('unsubbing!');
//     subscr.unsubscribe();
//   };

//   return { params, destroy };
// }

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

  connect(client: Client) {
    const sessionId = client.getId();

    if (this._getClient(sessionId)) {
      console.log(`Already found a session with id ${sessionId}`);
      return this.clients[sessionId];
    }

    client.connect();

    // this.clients[sessionId] = client;
    this.clients.push(client);
    this.onConnect.emit(client);

    // write to storage
    this._save();
    return client;
  }

  connectOsc(host: string, port: number) {
    return this.connect(new OscClient(host, port));
  }

  connectWebsockets(host: string, port: number) {
    return this.connect(new WebsocketsClient(host, port));
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
    return this.clients.find(c => c && c.getId() === sessionId);
  }

  _save(): void {
    this.storage.set('clients', this.clients
      // null if client is null
      .map(c => (c ? {id: c.getId()} : null))
      // filter out nulls
      .filter((c) => c));
  }

  _load(): number {
    let count = 0;

    (this.storage.get('clients') || []).forEach((c: {id: string}) => {
      const client = WebsocketsClient.fromId(c.id) || OscClient.fromId(c.id);
      // this.clients.push(client);
      this.connect(client);
      count += 1;
    });

    return count;
  }
}
