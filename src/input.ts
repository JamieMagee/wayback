import fs from 'node:fs';
import path from 'node:path';

export default class Input {
  readonly url: string[];
  readonly saveErrors = this.toBoolean(
    this.getInput('saveErrors', { trimWhitespace: true })
  );
  readonly saveOutlinks = this.toBoolean(
    this.getInput('saveOutlinks', { trimWhitespace: true })
  );
  readonly saveScreenshot = this.toBoolean(
    this.getInput('saveScreenshot', { trimWhitespace: true })
  );
  readonly skipFirstArchive = this.toBoolean(
    this.getInput('skipFirstArchive', { trimWhitespace: true }) || 'false'
  );
  readonly ifNotArchivedWithin = this.getInput('ifNotArchivedWithin', {
    trimWhitespace: true,
  });
  readonly delayBetweenRequests;

  constructor() {
    const urls = this.getMultilineInput('url', {
      required: false,
      trimWhitespace: true,
    });

    const delayInput = this.getInput('delayBetweenRequests', { trimWhitespace: true });
    this.delayBetweenRequests = delayInput ? Number(delayInput) : null;

    this.url = urls.length > 0 ? urls : this.detectFromCname();
    this.validate();
  }

  validate(): void {
    if (this.url.length === 0) {
      throw new Error(
        'No URL provided and no CNAME file found. Either set the url input or ensure a CNAME file exists in the repository.'
      );
    }
  }

  private detectFromCname(): string[] {
    try {
      const workspace = process.env['GITHUB_WORKSPACE'] ?? process.cwd();
      const cnamePath = path.join(workspace, 'CNAME');
      const content = fs.readFileSync(cnamePath, 'utf8');
      const firstNonEmptyLine = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line !== '');

      if (firstNonEmptyLine) {
        return [firstNonEmptyLine];
      }
    } catch {
      // Ignore filesystem errors; validate() will produce a clear error
      // message if no URL is available from any source.
    }
    return [];
  }

  private getInput(
    name: string,
    options?: { trimWhitespace?: boolean }
  ): string {
    const value =
      process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    return options?.trimWhitespace ? value.trim() : value;
  }

  private getMultilineInput(
    name: string,
    options?: { required?: boolean; trimWhitespace?: boolean }
  ): string[] {
    const value = this.getInput(name, options);
    if (!value && options?.required) {
      throw new Error(`Input required and not supplied: ${name}`);
    }

    const lines = value.split('\n').filter((line) => line !== '');

    return options?.trimWhitespace ? lines.map((line) => line.trim()) : lines;
  }

  private toBoolean(input: string): boolean {
    switch (input.toLowerCase()) {
      case 'true':
        return true;
      case 'false':
        return false;
      default:
        throw new Error(
          `Invalid boolean input: ${input}. Expected 'true' or 'false'.`
        );
    }
  }
}
