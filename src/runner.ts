import Input from './input';
import WayBack from './wayback';

export default async function run(): Promise<void> {
  try {
    const input = new Input();
    const wayback = new WayBack(input);

    for (const url of input.url) {
      await wayback.save(url);
    }
  } catch (error) {
    // Equivalent to core.setFailed() - output error and exit with code 1
    console.log(`::error::${(error as Error).message}`);
    process.exit(1);
  }
}
