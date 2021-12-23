import { Mks } from './src';
import {markAsUntransferable} from "worker_threads";

const mks = new Mks({ address: '192.168.1.76', polling: true });

setTimeout(() => console.log(mks), 3000);
