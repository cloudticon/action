import * as fs from "fs";
import * as path from "path";
import { getJsPackageManagerType } from "./utils/getJsPackageManagerType";
import { getPackageJson } from "./utils/getPackageJson";
import { LocalFile } from "./LocalFile";
import { heredoc } from "terraform-generator";
import { context } from "./context";

export class DockerfileBuilder {
  private lines: string[] = [];

  from(image: string, name?: string) {
    let line = `FROM ${image}`;

    if (name) {
      line += ` AS ${name}`;
    }

    this.lines.push(line);
    return this;
  }

  run(command: string) {
    this.lines.push(`RUN ${command}`);
    return this;
  }

  cmd(command: string | string[]) {
    const _command =
      typeof command === "string" ? command : JSON.stringify(command);
    this.lines.push(`CMD ${_command}`);
    return this;
  }

  expose(port: number, protocol?: string) {
    let line = `EXPOSE ${port}`;

    if (protocol) {
      line += `/${protocol}`;
    }

    this.lines.push(line);
    return this;
  }

  env(key: string, value: string) {
    this.lines.push(`ENV ${key}=${value}`);
    return this;
  }

  add(src: string, dest: string) {
    this.lines.push(`ADD ${src} ${dest}`);
    return this;
  }

  copy(src: string, dest: string, from?: string) {
    let line = `COPY`;

    if (from) {
      line += ` --from=${from}`;
    }

    line += ` ${src} ${dest}`;

    this.lines.push(line);
    return this;
  }

  entrypoint(command: string | string[]) {
    this.lines.push(`ENTRYPOINT ${JSON.stringify(command)}`);
    return this;
  }

  workdir(path: string) {
    this.lines.push(`WORKDIR ${path}`);
    return this;
  }

  appendBuilder(builder: DockerfileBuilder) {
    this.lines.push(...builder.lines);
    return this;
  }

  toString() {
    return this.lines.join("\n");
  }

  save(_path = "/tmp") {
    const content = this.toString();

    console.log("\n\n\n-------------------");
    console.log(content);
    console.log("-------------------\n\n\n");
    const p = path.join(_path, "Dockerfile");
    fs.writeFileSync(p, content);
    return p;
  }

  toTf() {
    const resource = new LocalFile({
      name: `dockerfile-${Date.now()}`,
      filename: `${context.workingDir}/Dockerfile`,
      content: heredoc(this.toString()),
    });

    return resource.filename;
  }
}

export class JsDockerfileBuilder extends DockerfileBuilder {
  private readonly packageManager: "npm" | "yarn" | "pnpm";

  constructor() {
    super();
    this.packageManager = getJsPackageManagerType();
  }

  copyPackageAssets() {
    const files = [
      "./.npmrc*",
      "./package.json*",
      "./package-lock.json*",
      "./yarn.lock*",
      "./pnpm-lock.yaml*",
    ];

    return this.copy(files.join(" "), "./");
  }

  runInstall(production: boolean) {
    if (production) {
      switch (this.packageManager) {
        case "npm":
          this.run("npm install --production=true");
          break;
        case "pnpm":
          this.run("pnpm i --production --frozen-lockfile");
          break;
        case "yarn":
          this.run("yarn install --production=true --frozen-lockfile");
          break;
      }
    } else {
      switch (this.packageManager) {
        case "npm":
          this.run("npm install");
          break;
        case "pnpm":
          this.run("pnpm i --frozen-lockfile");
          break;
        case "yarn":
          this.run("yarn install --frozen-lockfile");
          break;
      }
    }
    return this;
  }

  runBuild() {
    const packageJson = getPackageJson();
    if (packageJson.scripts["build:cloudticon"]) {
      this.runScript("build:cloudticon");
    } else {
      this.runScript("build");
    }
    return this;
  }

  cmdStart() {
    const packageJson = getPackageJson();
    if (packageJson.scripts["start:cloudticon"]) {
      this.cmdScript("start:cloudticon");
    } else {
      this.cmdScript("start");
    }
    return this;
  }

  runScript(command: string) {
    switch (this.packageManager) {
      case "npm":
        this.run(`npm run ${command}`);
        break;
      case "pnpm":
        this.run(`pnpm ${command}`);
        break;
      case "yarn":
        this.run(`yarn ${command}`);
        break;
    }
    return this;
  }

  cmdScript(command: string) {
    switch (this.packageManager) {
      case "npm":
        this.cmd(`npm run ${command}`);
        break;
      case "pnpm":
        this.cmd(`pnpm ${command}`);
        break;
      case "yarn":
        this.cmd(`yarn ${command}`);
        break;
    }
    return this;
  }

  nodeEnv(env: string = "production") {
    return this.env("NODE_ENV", env);
  }
}

export class BuildableJsDockerfileBuilder {
  constructor(public baseImage = "cloudticon/node:16-alpine") {}

  base(builder: JsDockerfileBuilder) {
    builder.from(this.baseImage, "base").run("npm install husky -g"); // TODO;
  }

  beforeBuild(builder: JsDockerfileBuilder) {}

  afterBuild(builder: JsDockerfileBuilder) {}

  release(builder: JsDockerfileBuilder) {}

  build() {
    const base = new JsDockerfileBuilder();
    this.base(base);

    const dependencies = new JsDockerfileBuilder();
    dependencies
      .from("base", "dependencies")
      .workdir("/app")
      .env("HUSKY_SKIP_INSTALL", "true")
      .copyPackageAssets()
      .runInstall(true)
      .run(" cp -R node_modules prod_node_modules")
      .runInstall(false);

    const builder = new JsDockerfileBuilder();
    builder
      .from("base", "builder")
      .workdir("/app")
      .copy("/app/node_modules", "./node_modules", "dependencies")
      .copy(".", ".");

    this.beforeBuild(dependencies);
    builder.runBuild();
    this.afterBuild(dependencies);

    const release = new JsDockerfileBuilder();
    this.release(release);

    const dockerfileBuilder = new DockerfileBuilder();
    return dockerfileBuilder
      .appendBuilder(base)
      .appendBuilder(dependencies)
      .appendBuilder(builder)
      .appendBuilder(release)
      .toTf();
  }
}
