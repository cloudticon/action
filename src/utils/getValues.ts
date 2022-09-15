import { variables } from "../values";

export const getValues = () => ({
  get: getValue,
});

export const getValue = (name: string) => {
  if (!variables[name]) {
    throw new Error(`Value ${name} not found`);
  }
  return variables[name].asArgument();
};
