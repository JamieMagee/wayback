import * as core from '@actions/core';

export function setOutput(name: string, value: string): void {
  core.setOutput(name, value);
}
