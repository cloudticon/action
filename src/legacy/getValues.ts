import { globalTerraform } from "../utils/compileAndRequire";

export const getValues = () => ({
  get: getValue,
});

export const getValue = (name: string) =>
  globalTerraform.getVarAsArgument(name);
