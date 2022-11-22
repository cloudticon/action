import { Service, ServiceInput } from "../Service";
import { DotEnv } from "../DotEnv";
import { BuildableJsDockerfileBuilder } from "../Dockerfile";
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
    return new (class extends BuildableJsDockerfileBuilder {
      beforeBuild(builder) {
        builder.run("mkdir -p /app/public");
      }
      release(builder) {
        builder
          .from("registry.cloudticon.com/cloudticon/nginx:latest")
          .copy("/app/dist", "/usr/share/nginx/html", "builder")
          .copy("./nginx.conf", "/etc/nginx/nginx.conf")
          .cmd(`nginx -g "daemon off;"`);
      }
    })().build();
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
server {
  listen 80;
  gzip on;
  gzip_types      text/plain application/xml;
  gzip_proxied    no-cache no-store private expired auth;
  gzip_min_length 1000;
  location /assets {
    access_log off;
    expires 30d;
    add_header Cache-Control public;

    ## No need to bleed constant updates. Send the all shebang in one
    ## fell swoop.
    tcp_nodelay off;

    ## Set the OS file cache.
    open_file_cache max=3000 inactive=120s;
    open_file_cache_valid 45s;
    open_file_cache_min_uses 2;
    open_file_cache_errors off;
  }
  location / {
    root /usr/share/nginx/html;
    index index.html index.htm;
    try_files $uri $uri/ /index.html =404;
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
