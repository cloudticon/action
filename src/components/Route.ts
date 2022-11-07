import { Service } from "../Service";
import { Input } from "../types";

class Host {
  constructor(public name: string) {}

  forwardToService(service: Service) {}

  rewritePath(path: Input<string>) {}
}

export class IngressBuilder {
  hosts: string[];

  constructor(public name: string) {}

  addHost() {}
}
