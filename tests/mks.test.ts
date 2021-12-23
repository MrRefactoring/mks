import test from 'ava';
import { Mks } from '../src';

test('Double `disconnect` shouldn\'t throw error', t => {
  const mks = new Mks({ address: '' });

  try {
    mks.disconnect();
    mks.disconnect();

    t.pass();
  } catch (e: any) {
    t.fail(e.toString());
  }
});
