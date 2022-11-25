import { Input } from "../types";

export type GraphTiconInput = {
  name: string;
  authEnabled?: Input<boolean>;
  payEnabled?: Input<boolean>;
};

export class GraphTicon {}
