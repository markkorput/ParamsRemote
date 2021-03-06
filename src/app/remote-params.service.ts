import { Injectable, EventEmitter, Inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { SettingsService, GlobalSettings } from './settings.service';

export class Param {
  OPT_MIN = 'min';
  OPT_MAX = 'max';
  OPT_DEFAULT = 'default';

  path: string;
  type: string;
  value: any;
  opts: {};
  setter: (arg0: any) => any = undefined;

  valueChange = new EventEmitter();

  constructor(path: string, type: string, value: any, opts: object) {
    this.path = path;
    this.type = type;
    this.value = value;
    this.opts = opts || {};

    if (this.type === 'b') { // boolean
      this.setter = (v) => String(v).toLowerCase() !== 'false' && String(v).toLowerCase() !== '0';
    }
  }

  set(value: any): void {
    // console.log('set: ', this.type, value);
    const val = this.setter ? this.setter(value) : value;
    if (this.value !== val) {
      this.value = val;
      this.valueChange.emit(this.value);
    }
  }

  /// Return this.value, unless this.value === undefined, the it will
  /// fallback to this.opts['fallback'] or hard-coded
  // type-specific values repsectively.
  getValue(): any {
    return this._convertValue(this.value !== undefined
      ? this.value
      : this.opts[this.OPT_DEFAULT] !== undefined
        ? this.opts[this.OPT_DEFAULT]
        : this._getTypeDefaultValue(this.type), this.type);
  }

  _convertValue(val: any, typ: string): any {
    switch (typ) {
      case 's': return val.toString();
      case 'b': return ['false', '0'].indexOf(val.toString().toLowerCase()) === -1;
      case 'i': return parseInt(val, 10);
      case 'f': return parseFloat(val);
      case 'v': return parseInt(val, 10);
    }
  }

  _getTypeDefaultValue(typ: string): any {
    switch (typ) {
      case 's': return '';
      case 'b': return false;
      case 'i': return 0;
      case 'f': return 0.0;
      case 'v': return 0;
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

  getValues(opts: {}): object {
    opts = opts || {};

    const result = {};
    this.params.forEach(p => {
      if (p.type === 'v') return; 
      if (opts['skipImages'] === true && p.type === 'g') return;
      result[p.path] = p.value;
    });
    return result;
  }
}

export class Schema {
  data: {path: string, type: string, value?: any, opts?: {min?: any, max?: any}}[] = [];

  constructor(data?: {path: string, type: string, value?: any, opts?: {min?: any, max?: any}}[]) {
    this.data= data || [];
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
        const p = new Param(item.path, item.type, item.value, item.opts || {});
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

  sendValues(values: object): void {
    Object.keys(values).forEach(key => {
      this.sendValue(key, values[key]);
    });
  }
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

  getId(): string {
    return this.id;
  }

  connect(): void {
  }

  disconnect(): void {
  }

  /**
   * isConnected returns the current connection status.
   * @returns (boolean): True if it has an active connection
   * with a server. False otherwise.
   */
  isConnected(): boolean {
    return false; // child-class should overwrite
  }
}

//
// WebSockets
//

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

    // console.log(`Sending websocket schema request: ${WebsocketsOutputInterface.SCHEMA_REQUEST}`)
    this.socket.send(WebsocketsOutputInterface.SCHEMA_REQUEST);
  }

  confirm(): void {
    if (this.socket === null) {
      console.warn('no socket, can\'t confirm');
      return;
    }

    console.log(`Sending websocket confirm`);
    this.socket.send(`confirm`);
  }

  sendValue(path: string, value: any): void {
    // console.log('send value', value);
    if (this.socket === null) {
      console.warn(`no socket, can't send value: ${path} = ${value}`);
      return;
    }

    const msg = `POST ${path}?value=${value}`;
    // console.log(`Sending websocket value: ${msg}`);
    this.socket.send(msg);
  }

  disconnect(): void {
    if (this.socket === null) {
      console.warn('no socket, can\'t disconnect');
      return;
    }

    console.log(`Sending websocket disconnect`);
    this.socket.send('disconnect');
  }
}

class WebsocketsInputInterface extends InputInterface {
  static schemaPrefix = 'POST schema.json?schema=';

  constructor(socket?: WebSocket) {
    super();
    if (!socket) {
      return;
    }

    socket.addEventListener('message', (event) => this.onMessage(event.data));
  }

  onMessage(data: any): void {
    // console.log(`onMessage: ${data}`);

    if (data.startsWith(WebsocketsInputInterface.schemaPrefix)) {
      // console.log('Received schema data');
      // console.log(data);
      const jsonText = data.substr(WebsocketsInputInterface.schemaPrefix.length);
      const jsonData = JSON.parse(jsonText);
      this.schema.emit(jsonData);
    }

    // POST <param-path>?value=<value>
    if (data.startsWith('POST ') && data.indexOf('?value=') > -1) {
      // console.log('got  value: ', data);
      const parts = data.substr('POST '.length).split('?value=');
      const path: string = parts[0];
      const value: any = parts[1];
      this.value.emit([path, value]);
    }
  }
}

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

  /**
   * isConnected returns the current connection status.
   * @returns (boolean): True if it has an active socket
   * connection with a server. False otherwise.
   */
  isConnected(): boolean {
    return this.socket !== null;
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

    this.input.value.subscribe((idValuePair: [string, any]) => {
      const [paramId, value] = idValuePair;
      const param = this.params.get(paramId);
      if (!param) {
        console.warn(`Received value for unknown param: ${paramId} (value: ${value})`);
        return;
      }

      param.set(value);
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

class WebsocketFinder {
  host = '127.0.0.1';
  startPort: number;
  endPort: number;
  nextPort: number;
  onlyOnce: boolean;
  callback: (host: string, port: number) => void;
  iterateInterval: any = undefined;
  foundServers: {host: string, port: number}[] = [];

  constructor(callback?: (host: string, port: number) => void, opts?: {startPort?: number, endPort?: number, onlyOnce?: boolean}) {  
    this.callback = callback;
    this.startPort = opts['startPort'] || 8080;
    this.endPort = opts['endPort'] || 8090;
    this.onlyOnce = opts['onlyOnce'] === true;

    this.nextPort = this.startPort;
    this.start();
  }

  _iterate(): void {
    this.tryPort(this.nextPort, () => {
      if (this.callback) {
        this.callback(this.host, this.nextPort);
      }
    });

    this.nextPort += 1;
    if (this.nextPort > this.endPort) {
      this.nextPort = this.startPort;

      if (this.onlyOnce) {
        this.stop()
      }
    }
  }

  tryPort(port: number, onSuccess: () => void) {
    try {
      const socket = new WebSocket('ws://localhost:' + port.toString());
      socket.onerror = (evt: any) => { };

      socket.addEventListener('open', (event) => {
        // socket.send('Hello Server!');
        console.log('WebsocketBroadcastListener found open socket on port:', port);
      });

      socket.addEventListener('message', (event) => {
        // console.log('Message from server ', event.data);
        if (this.isWelcomeMessage(event.data)) {
          socket.send('stop');
          console.log('WebsocketBroadcastListener found server on port:', port);
          this.foundServers.push({host: this.host, port});
          onSuccess();
        }
      });

      setTimeout(socket.close, 500);
    } catch(e) {
      //
    }
  }

  isWelcomeMessage(msg: any): boolean {
    return msg.toLowerCase().indexOf('welcome') !== -1;
  }

  start(): void {
    this.stop();
    this.iterateInterval = setInterval(() => this._iterate(), 500);
  }

  stop(): void {
    if (this.iterateInterval) {
      clearInterval(this.iterateInterval);
      this.iterateInterval = undefined;
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

  /**
   * isConnected always returns true because the OSC is 
   * based on the UDP protocol which doesn't invole active
   * connections.
   * @returns (boolean): always true
   */
  isConnected(): boolean {
    return true;
  }
}


//
// Angular Service
//

@Injectable({
  providedIn: 'root'
})
export class RemoteParamsService {
  clients: Client[] = []; // will contain <sessionId>:<remote_params_client> pairs
  onConnect = new EventEmitter();
  onDisconnect = new EventEmitter();
  onWebsocketServerBroadcast = new EventEmitter();
  allowDuplicates = true;
  localValues = {};
  websocketFinder: WebsocketFinder;

  constructor(
    private settingsService: SettingsService,
  ) {
    this._load();
  }

  connect(client: Client) {
    const sessionId = client.getId();

    if (!this.allowDuplicates && this._getClient(sessionId)) {
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
    // this.storage.set('clients', this.clients
    //   // null if client is null
    //   .map(c => (c ? {id: c.getId()} : null))
    //   // filter out nulls
    //   .filter((c) => c));

    const oldsettings = this.settingsService.getGlobalSettings;

    const clientIds = this.clients
      // null if client is null
      .map(c => (c ? c.getId() : null))
      // filter out nulls
      .filter((c) => c);

    const newsettings = { ...oldsettings, ...{ clientIds } } ;
    this.settingsService.setGlobalSettings(newsettings as GlobalSettings);
  }

  _load(): number {
    let count = 0;

    (this.settingsService.getGlobalSettings().clientIds || []).forEach((cid: string) => {
      const client = WebsocketsClient.fromId(cid) || OscClient.fromId(cid);
      this.connect(client);
      count += 1;
    });

    return count;
  }

  findWebsockets(callback?: (host: string, port: number) => void, opts?: {}): void {
    // this.stopFindingWesockets();
    if (this.websocketFinder === undefined) {
      this.websocketFinder = new WebsocketFinder(callback, opts);
    } else {
      this.websocketFinder.start();
    }
  }

  stopFindingWesockets() {
    if (this.websocketFinder) {
      this.websocketFinder.stop();
    }
  }
}
