import { createProgram, ModuleKind, ScriptTarget } from "typescript";
import { Input } from "../types";
import { Terraform } from "../terraform/Terraform";
import { Service } from "../Service";
import { DockerImage } from "../DockerImage";

export let globalTerraform: Terraform;
export let services: Service[];
export let dockerImages: DockerImage[];

export const registerGlobalService = (service: Service) => {
  services.push(service);
};
export const registerGlobalDockerImage = (image: DockerImage) => {
  dockerImages.push(image);
};

type CompileAndRequireOutput = {
  outputs: Record<string, Input<string>>;
  services: Service[];
};
export const compileAndRequire = (
  fileName: string,
  tf: Terraform
): CompileAndRequireOutput => {
  globalTerraform = tf;
  services = [];
  dockerImages = [];

  createProgram([`${fileName}.ts`], {
    noEmitOnError: false,
    noImplicitAny: true,
    target: ScriptTarget.ES5,
    module: ModuleKind.CommonJS,
  }).emit();

  const outputs = require(`${fileName}.js`);

  return {
    outputs,
    services,
  };
};
