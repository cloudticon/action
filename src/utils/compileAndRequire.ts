import {
  CompilerOptions,
  createProgram,
  ModuleKind,
  ScriptTarget,
} from "typescript";
import { Input } from "../types";

export const compileAndRequire = (
  fileName: string
): Record<string, Input<string>> => {
  let program = createProgram([`${fileName}.ts`], {
    noEmitOnError: false,
    noImplicitAny: true,
    target: ScriptTarget.ES5,
    module: ModuleKind.CommonJS,
  });
  let emitResult = program.emit();
  return require(`${fileName}.js`);
};
