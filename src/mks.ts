import { Socket } from 'net';
import { GcodeMap } from "./gcodeMap";
import {type} from "os";

interface Options {
  address: string;
  port?: number;
  polling?: boolean;
  pollingTimeout?: number;
}

export enum State {
  Idle = 'IDLE',
  Printing = 'PRINTING',
  Pause = 'PAUSE',
}

export class Mks {
  private socket: Socket;
  private connected = false;
  private pollingInterval?: number;

  state: State = State.Idle;
  printTime?: string;
  percentage?: number;
  filename?: string;
  extruderTemp: number = 0;
  bedTemp: number = 0;

  constructor(private options: Options) {
    this.socket = new Socket();

    options.port = options.port ?? 8080;

    options.polling = options.polling ?? false;
    options.pollingTimeout = options.pollingTimeout ?? 2000;

    if (options.polling) {
      this.startPolling();
    }
  }

  async connect() {
    return new Promise<void>((resolve => {
      this.socket.connect(this.options.port!, this.options.address, () => {
        this.connected = true;
        this.subscribe();
        resolve();
      });
    }));
  }

  disconnect() {
    this.socket.destroy();
    this.connected = false;
  }

  startPolling() {
    this.poll();
    this.pollingInterval = setInterval(this.poll.bind(this), this.options.pollingTimeout) as unknown as number;
    this.options.polling = true;
  }

  stopPolling() {
    clearInterval(this.pollingInterval);
    this.options.polling = false;
  }

  async sendCommand(command: string | string[]) {
    if (!this.connected) {
      await this.connect();
    }

    let resolve: () => void;
    let reject: (err: Error) => void;

    const response = new Promise<void>(((res, rej) => { reject = rej; resolve = res; }));

    command = typeof command === 'string' ? [command] : command;

    this.socket.write(`${command.join('\r\n')}\r\n`, (err) => {
      if (err) {
        return reject(err);
      }

      resolve();
    });

    return response;
  }

  private subscribe() {
    this.socket
      .on('data', this.parseResponse.bind(this))
      .on('error', this.errorHandler.bind(this))
      .on('end', this.disconnect.bind(this));
  }

  private parseResponse(data: Buffer) {
    let response = data.toString().trim();

    if (response === 'ok') {
      return;
    }

    // checking that is temperature data
    if (/(?=.*T:)(?=.*B:)(?=.*T0:)/.test(response)) {
      response = `M105 ${response}`;
    }

    const [command, value] = response.split(/ (.*)/).slice(0, -1);

    console.log(response, response === 'ok', typeof response);

    GcodeMap[command](this, value);
  }

  private poll() {
    const pollingCommand = Object.keys(GcodeMap);

    void this.sendCommand(pollingCommand);
  }

  private errorHandler(err: any) {
    console.log(err)
    // TODO
  }
}
