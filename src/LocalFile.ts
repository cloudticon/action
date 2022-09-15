import { Input } from "./types";
import { Resource } from "terraform-generator/dist/blocks";
import { globalTerraform } from "./utils/compileAndRequireCtFile";

export type LocalFileInput = {
  name: string;
  filename: Input<string>;
  content: Input<string>;
};

export class LocalFile {
  public resource: Resource;

  get id() {
    return this.resource.id;
  }

  get filename() {
    return this.resource.getArgument("filename");
  }

  constructor(input: LocalFileInput) {
    this.resource = globalTerraform.resource("local_file", input.name, {
      filename: input.filename,
      content: input.content,
    });
  }
}
