import { Service, ServiceInput } from "../Service";
import { DotEnv } from "../DotEnv";
import {
  BuildableJsDockerfileBuilder,
  DockerfileBuilder,
  JsDockerfileBuilder,
} from "../Dockerfile";
import { isDockerFileExist } from "../utils/isDockerFileExist";
import { LocalFile } from "../LocalFile";
import { context } from "../context";

export type AstroInput = ServiceInput & {
  name: string;
  size?: any;
  buildEnvExtends?: string[];
  buildEnv?: Record<string, string>;
  resources?: any;
  dockerfile?: string;
  context?: string;
  enableSentry?: boolean;
};

export class Astro extends Service {
  public dotEnv?: DotEnv;
  public service: Service;
  public sentry?: any;

  public static createDockerFile() {
    return new DockerfileBuilder()
      .appendBuilder(
        new JsDockerfileBuilder()
          .from("node:16-alpine", "builder")
          .workdir("/app")
          .copy(".", ".")
          .runInstall(false)
          .runBuild()
      )
      .appendBuilder(
        new DockerfileBuilder()
          .from("nginx:stable-alpine")
          .copy("/app/dist", "/usr/share/nginx/html", "builder")
          .copy("./nginx.conf", "/etc/nginx/nginx.conf")
          .cmd(`nginx -g "daemon off;"`)
      )
      .toTf(`${context.workingDir}/Dockerfile`);
  }

  constructor({
    name,
    size = "sm",
    buildEnv,
    buildEnvExtends = [],
    dockerfile = isDockerFileExist() ? "Dockerfile" : Astro.createDockerFile(),
    enableSentry = true,
    ...input
  }: AstroInput) {
    let dotEnv: DotEnv;
    if (buildEnv) {
      dotEnv = new DotEnv({
        name: name,
        env: buildEnv,
        extends: buildEnvExtends,
      });
    }

    const config = new LocalFile({
      filename: `${context.workingDir}/nginx.conf`,
      name: `${name}-config`,
      content: `
events {
  worker_connections  4096;  ## Default: 1024
}
http {
  include    mime.types;
  sendfile on;
  server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html index.htm;

    location /assets {
      access_log off;
      gzip_static on;
      gzip_comp_level 5;
      expires 1M;
      add_header Cache-Control public;
    }

    location / {
      try_files $uri $uri/ /index.html =404;
    }
  }
}`,
    });
    super({
      name,
      port: 80,
      isDefaultService: true,
      build: {
        dockerfile,
        context: ".",
        dependsOn: dotEnv
          ? [dotEnv.resource, config.resource]
          : [config.resource],
      },
      ...input,
    });

    this.dotEnv = dotEnv;
  }
}
