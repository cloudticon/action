import { globalTerraform } from "../utils/compileAndRequireCtFile";
import { Argument } from "terraform-generator/dist/arguments";

type Output<T> = {
  get<K extends keyof T>(key: K): Argument;
};

export const getValues = <T>(): Output<T> => ({
  get: getValue as any,
});

export const getValue = (name: string) =>
  globalTerraform.getVarAsArgument(name);
