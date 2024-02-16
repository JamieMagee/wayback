import * as core from '@actions/core';

export default class Input {
  readonly url = core.getMultilineInput('url', {
    required: true,
    trimWhitespace: true,
  });
  readonly saveErrors = this.toBoolean(
    core.getInput('saveErrors', { trimWhitespace: true })
  );
  readonly saveOutlinks = this.toBoolean(
    core.getInput('saveOutlinks', { trimWhitespace: true })
  );
  readonly saveScreenshot = this.toBoolean(
    core.getInput('saveScreenshot', { trimWhitespace: true })
  );

  constructor() {
    this.validate();
  }

  validate(): void {
    if (this.url.length === 0) {
      throw new Error('input.url must not be empty');
    }
  }

  private toBoolean(input: string): boolean {
    switch (input.toLowerCase()) {
      case 'true':
        return true;
      case 'false':
        return false;
      default:
        throw new Error();
    }
  }
}
