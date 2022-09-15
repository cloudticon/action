import { globalTerraform } from "../utils/compileAndRequireCtFile";

export const getValues = () => ({
  get: getValue,
});

export const getValue = (name: string) =>
  globalTerraform.getVarAsArgument(name);
