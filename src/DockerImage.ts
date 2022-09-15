import { tfg } from "./tfg";
import { Resource } from "terraform-generator/dist/blocks";
import { Attribute, map, Provisioner } from "terraform-generator";
import * as path from "path";
import { Input } from "./types";

export type DockerImageParams = {
  name: string;
  image: Input<string>;
  tag?: string;
  context?: string;
  dockerfile?: string;
  build?: boolean;
};

export class DockerImage {
  public imageResource: Resource;
  public buildResource: Resource;

  constructor({
    name,
    image,
    context = ".",
    dockerfile = "Dockerfile",
    build = false,
  }: DockerImageParams) {
    this.buildResource = tfg.resource("null_resource", `${name}-build`, {
      triggers: build
        ? map({
            time: Date.now(),
          })
        : undefined,
    });
    if (build) {
      const scriptPath = path.resolve("scripts/build-and-push-docker-image.sh");
      this.buildResource.setProvisioners([
        new Provisioner("local-exec", {
          command: `${scriptPath} ${context} ${image}`,
        }),
      ]);
    }
    this.imageResource = tfg.resource("docker_image", name, {
      name: image,
      depends_on: [`null_resource.${name}-build`],
    });
  }

  get name() {
    return this.imageResource.attr("name");
  }

  addBuildDependsOn(id: Attribute) {
    this.buildResource.setArgument("depends_on", [id]);
  }
}
