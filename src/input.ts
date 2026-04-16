import fs from 'node:fs';
import path from 'node:path';
import * as core from '@actions/core';

export default class Input {
  readonly url: string[];
  readonly saveErrors = core.getBooleanInput('saveErrors', {
    trimWhitespace: true,
  });
  readonly saveOutlinks = core.getBooleanInput('saveOutlinks', {
    trimWhitespace: true,
  });
  readonly saveScreenshot = core.getBooleanInput('saveScreenshot', {
    trimWhitespace: true,
  });
  readonly skipFirstArchive = core.getBooleanInput('skipFirstArchive', {
    trimWhitespace: true,
  });
  readonly ifNotArchivedWithin = core.getInput('ifNotArchivedWithin', {
    trimWhitespace: true,
  });

  constructor() {
    const urls = core.getMultilineInput('url', {
      required: false,
      trimWhitespace: true,
    });

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
}
