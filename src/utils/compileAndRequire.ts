import { CompilerOptions, createProgram } from "typescript";

export const compileAndRequire = (
  fileName: string,
  options: CompilerOptions
): void => {
  let program = createProgram([`${fileName}.ts`], options);
  let emitResult = program.emit();
  require(`${fileName}.js`);
};
