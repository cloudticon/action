import { variables } from "../values";

export const getValues = () => ({
  get: (name: string) => variables[name].asArgument(),
});

export const getValue = (name: string) => variables[name].asArgument();
