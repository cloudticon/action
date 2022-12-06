import createDebug from "debug";
const debug = createDebug("debouncer");

export class Debouncer {
  timeout: any;
  promises: Promise<any>[] = [];

  constructor(protected time: number, protected callback: () => any) {}

  add(promise: Promise<any>) {
    debug("add promise");
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.run();
    }, this.time);
    this.promises.push(promise);
  }

  async run() {
    debug("run callback");
    await Promise.all(this.promises);
    this.promises = [];
    return this.callback();
  }
}
