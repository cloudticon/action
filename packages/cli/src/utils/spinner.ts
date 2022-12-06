import { createSpinner, Spinner } from "nanospinner";
import { WriteStream } from "tty";

const mockSpinner: Spinner = {
  clear(): Spinner {
    return undefined;
  },
  error(opts?: { text?: string; mark?: string }): Spinner {
    return undefined;
  },
  reset(): Spinner {
    return undefined;
  },
  spin(): Spinner {
    return undefined;
  },
  start(opts?: { text?: string; color?: string }): Spinner {
    return undefined;
  },
  stop(opts?: { text?: string; mark?: string; color?: string }): Spinner {
    return undefined;
  },
  success(opts?: { text?: string; mark?: string }): Spinner {
    return undefined;
  },
  update(opts?: any): Spinner {
    return undefined;
  },
  warn(opts?: { text?: string; mark?: string }): Spinner {
    return undefined;
  },
};
export const spinner = process.env.DEBUG ? mockSpinner : createSpinner();
