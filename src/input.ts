import * as core from '@actions/core';

export default class Input {
  readonly url = core.getInput('url', { required: true });
  readonly saveErrors = this.toBoolean(core.getInput('saveErrors'));
  readonly saveOutlinks = this.toBoolean(core.getInput('saveOutlinks'));
  readonly saveScreenshot = this.toBoolean(core.getInput('saveScreenshot'));

  constructor() {
    this.validate();
  }

  validate(): void {
    if (this.url === '') {
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
