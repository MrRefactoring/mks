import type { Mks } from "./mks";
import {State} from "./mks";

type Function = (mks: Mks, value: string) => void;

export const GcodeMap: Record<string, Function> = {
  M27: (mks: Mks, value: string) => { mks.percentage = +value },
  M105: (mks: Mks, value: string) => {
    console.log(value.match(/T:\d+/)?.[0].trim().slice(2));
    mks.extruderTemp = +(value.match(/T:\d+/)?.[0].trim().slice(2) || 0);
    mks.bedTemp = +(value.match(/B:\d+/)?.[0].trim().slice(2) || 0);
  },
  M996: (mks: Mks, value: string) => { mks.printTime = value },
  M997: (mks: Mks, value: string) => { mks.state = value as State },
  M994: (mks: Mks, value: string) => { mks.filename = value },
}
