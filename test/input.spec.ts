import * as _core from '@actions/core';
import Input from '../src/input';
import { getName, mocked } from './utils';

const core = mocked(_core);

describe(getName(__filename), () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works for multiple urls', () => {
    core.getMultilineInput.mockReturnValue(['example.com', 'example.com']);
    core.getInput
      .mockReturnValueOnce('true')
      .mockReturnValueOnce('false')
      .mockReturnValueOnce('true');
    const input = new Input();

    expect(core.getMultilineInput.mock.calls).toMatchSnapshot();
    expect(core.getInput.mock.calls).toMatchSnapshot();
    expect(input).toMatchSnapshot();
  });

  it('works for a single url', () => {
    core.getMultilineInput.mockReturnValue(['example.com']);
    core.getInput
      .mockReturnValueOnce('true')
      .mockReturnValueOnce('false')
      .mockReturnValueOnce('true');
    const input = new Input();

    expect(core.getMultilineInput.mock.calls).toMatchSnapshot();
    expect(core.getInput.mock.calls).toMatchSnapshot();
    expect(input).toMatchSnapshot();
  });

  it('throws', () => {
    core.getInput
      .mockReturnValueOnce('example.com')
      .mockReturnValueOnce('notaboolean');

    expect(() => {
      new Input();
    }).toThrow();
  });
});
