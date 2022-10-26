import * as fs from "fs";
import * as path from "path";

import { DockerfileBuilder } from "../Dockerfile";
import { LocalFile } from "./LocalFile";
import { Service, ServiceInput } from "./Service";
import { Input } from "../types";
import { context } from "../context";

export type NginxCacheInput = Omit<ServiceInput, "build" | "image"> & {
  proxyTo: Input<string>;
  statics?: string[];
  ttl?: Input<number>;
};

export class NginxCache extends Service {
  constructor({
    name,
    proxyTo,
    ttl = 31536000,
    statics = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "ico",
      "css",
      "js",
      "svg",
      "otf",
      "webp",
    ],
    ...input
  }: NginxCacheInput) {
    const nginxPath = `${context.workingDir}/nginx-${name}`;
    fs.mkdirSync(nginxPath);

    const dockerfile = new DockerfileBuilder()
      .from("nginx:stable")
      .copy("./nginx.conf", "/etc/nginx/nginx.conf")
      .toTf(path.join(nginxPath, "Dockerfile"));

    const config = new LocalFile({
      name: `${name}-nginx-config`,
      filename: path.join(nginxPath, "nginx.conf"),
      content: NginxCache.generateConfig(proxyTo, statics, ttl),
    });

    super({
      ...input,
      name,
      port: 80,
      build: { dockerfile, context: nginxPath, dependsOn: [config.resource] },
    });
  }

  private static generateConfig(
    proxyTo: Input<string>,
    statics: string[],
    ttl: Input<number>
  ): string {
    return `
events {}
http {
    proxy_cache_path /etc/nginx/cache levels=1:2 keys_zone=default_cache:10m max_size=2g
                     inactive=120m use_temp_path=off;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    proxy_cache_valid 200 302 304 60m;

    server {
        listen 80;

        location / {
             proxy_pass http://${proxyTo};
        }

        location ~* \\.(${statics.join("|")})$ {
            proxy_cache default_cache;
            proxy_buffering on;
            proxy_ignore_headers Expires;
            proxy_ignore_headers X-Accel-Expires;
            proxy_ignore_headers Cache-Control;
            proxy_ignore_headers Set-Cookie;

            proxy_hide_header X-Accel-Expires;
            proxy_hide_header Expires;
            proxy_hide_header Cache-Control;
            proxy_hide_header Pragma;

            add_header X-Proxy-Cache $upstream_cache_status;
            add_header Cache-Control max-age=${ttl};

            proxy_pass http://${proxyTo};
        }

      access_log off;
      error_log /var/log/nginx/error.log error;
    }
}`;
  }
}
