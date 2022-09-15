import { Input } from "./types";
import { tfg } from "./tfg";
import { Resource } from "terraform-generator/dist/blocks";

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
    this.resource = tfg.resource("local_file", input.name, {
      filename: input.filename,
      content: input.content,
    });
  }
}
