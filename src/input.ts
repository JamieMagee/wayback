import * as core from '@actions/core';

export default class Input {
  readonly url = core.getInput('url', { required: true });

  constructor() {
    this.validate();
  }

  validate(): void {
    if (this.url === '') {
      throw new Error('input.url must not be empty');
    }
  }
}
