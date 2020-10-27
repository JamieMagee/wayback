import { setFailed } from '@actions/core';
import Input from './input';
import WayBack from './wayback';

export default async function run(): Promise<void> {
  try {
    const input = new Input();
    const wayback = new WayBack(input.url);

    await wayback.save();
  } catch (error) {
    setFailed((error as Error).message);
  }
}
