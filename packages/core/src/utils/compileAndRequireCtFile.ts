import { createProgram, ModuleKind, ScriptTarget } from "typescript";
import { Input } from "../types";
import { Terraform } from "../terraform/Terraform";
import { Service } from "../components/Service";
import { DockerImage } from "../DockerImage";
import { context } from "../context/index";

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
export const compileAndRequireCtFile = async (
  tf: Terraform
): Promise<CompileAndRequireOutput> => {
  globalTerraform = tf;
  services = [];
  dockerImages = [];
  const fileName = `${context.workingDir}/ct`;

  createProgram([`${fileName}.ts`], {
    noEmitOnError: false,
    noImplicitAny: true,
    target: ScriptTarget.ES5,
    module: ModuleKind.CommonJS,
  }).emit();

  // await io.mv(`${fileName}.js`, "/tmp/ct.js")
  console.log(fileName);
  const outputs = require(`${fileName}.js`);

  return {
    outputs,
    services,
  };
};
