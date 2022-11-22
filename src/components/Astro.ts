import { Service, ServiceInput } from "../Service";
import { DotEnv } from "../DotEnv";
import { BuildableJsDockerfileBuilder } from "../Dockerfile";
import { isDockerFileExist } from "../utils/isDockerFileExist";

export type ReactInput = ServiceInput & {
  name: string;
  size?: any;
  buildEnvExtends?: string[];
  buildEnv?: Record<string, string>;
  resources?: any;
  dockerfile?: string;
  context?: string;
  enableSentry?: boolean;
};

export class React extends Service {
  public dotEnv?: DotEnv;
  public service: Service;
  public sentry?: any;

  public static createDockerFile() {
    return new (class extends BuildableJsDockerfileBuilder {
      beforeBuild(builder) {
        builder.run("mkdir -p /app/public");
      }
      release(builder) {
        builder
          .from("registry.cloudticon.com/cloudticon/nginx:latest")
          .copy("/app/build", "/usr/share/nginx/html", "builder")
          .cmd(`nginx -g "daemon off;"`);
      }
    })().build();
  }

  constructor({
    name,
    size = "sm",
    buildEnv,
    buildEnvExtends = [],
    dockerfile = isDockerFileExist() ? "Dockerfile" : React.createDockerFile(),
    context = ".",
    enableSentry = true,
    ...input
  }: ReactInput) {
    let dotEnv: DotEnv;
    if (buildEnv) {
      dotEnv = new DotEnv({
        name: name,
        env: buildEnv,
        extends: buildEnvExtends,
      });
    }

    super({
      name,
      port: 80,
      isDefaultService: true,
      build: {
        dockerfile,
        context,
        dependsOn: dotEnv ? [dotEnv.resource] : [],
      },
      ...input,
    });

    this.dotEnv = dotEnv;
  }
}

const nginxConfig = `
server {
  listen 80;
  location / {
    root /usr/share/nginx/html;
    index index.html index.htm;
    try_files $uri $uri/ /index.html =404;
  }
}`;
