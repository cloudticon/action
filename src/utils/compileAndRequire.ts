import { CompilerOptions, createProgram } from "typescript";
import { Input } from "../types";

export const compileAndRequire = (
  fileName: string,
  options: CompilerOptions
): Record<string, Input<string>> => {
  let program = createProgram([`${fileName}.ts`], options);
  let emitResult = program.emit();
  return require(`${fileName}.js`);
};
