export default class Input {
  readonly url = this.getMultilineInput('url', {
    required: true,
    trimWhitespace: true,
  });
  readonly saveErrors = this.toBoolean(
    this.getInput('saveErrors', { trimWhitespace: true })
  );
  readonly saveOutlinks = this.toBoolean(
    this.getInput('saveOutlinks', { trimWhitespace: true })
  );
  readonly saveScreenshot = this.toBoolean(
    this.getInput('saveScreenshot', { trimWhitespace: true })
  );

  constructor() {
    this.validate();
  }

  validate(): void {
    if (this.url.length === 0) {
      throw new Error('input.url must not be empty');
    }
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
