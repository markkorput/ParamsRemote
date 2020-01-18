import { Injectable } from '@angular/core';

class Client {
  host: string;
  port: number;

  constructor(host: string, port: number) {
    this.host = host;
    this.port = port;
  }

  connect() {
    console.log(`TODO: remote_params.Client.connect to ${this.host}:${this.port}`);
  }
}

@Injectable({
  providedIn: 'root'
})
export class RemoteParamsService {
  clients = {}; // will contain <sessionId>:<remote_params_client> pairs

  constructor() { }

  listenForAnnouncements(port) {
  }

  connect(host: string, port: number) {
    const sessionId = `${host}:${port}`;

    if (this.clients[sessionId]) {
      console.log(`Already found a session with id ${sessionId}`);
      return this.clients[sessionId];
    }

    const client = new Client(host, port);
    client.connect();

    this.clients[sessionId] = client;
    return client;
  }
}
