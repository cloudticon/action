import { Resource } from "terraform-generator/dist/blocks";
import { Attribute, map, Provisioner } from "terraform-generator";
import * as path from "path";
import { Input } from "./types";
import { globalTerraform } from "./utils/compileAndRequireCtFile";
import { context } from "./context";

export type DockerImageParams = {
  name: string;
  image: Input<string>;
  tag?: string;
  ctx?: string;
  dockerfile?: string;
  build?: boolean;
};

export class DockerImage {
  public buildResource: Resource;
  public image: Input<string>;

  constructor({
    name,
    image,
    ctx = `${context.workingDir}/.`,
    dockerfile = "Dockerfile",
    build = false,
  }: DockerImageParams) {
    this.image = image;
    this.buildResource = globalTerraform.resource(
      "null_resource",
      `${name}-build`,
      {
        triggers: build
          ? map({
              time: Date.now(),
            })
          : undefined,
      }
    );
    if (build) {
      const scriptPath = path.resolve("scripts/build-and-push-docker-image.sh");
      this.buildResource.setProvisioners([
        new Provisioner("local-exec", {
          command: `${scriptPath} ${ctx} ${image}`,
        }),
      ]);
    }
  }

  addBuildDependsOn(resource: Resource) {
    this.buildResource.setArgument("depends_on", [resource]);
  }
}
