import { Container, ContainerInput } from "./";
import { Input } from "../../../types";
import { File } from "../resources";
import * as fs from "fs";
import * as path from "path";
import { DockerfileBuilder } from "../../../core/Dockerfile";

export type NginxCacheInput = Omit<ContainerInput, "build" | "image"> &
  Input<{
    proxyTo: string;
    statics?: string[];
    ttl?: number;
  }>;

export class NginxCache extends Container {
  constructor({
    name,
    proxyTo,
    ttl = 31536000,
    statics = ["jpg", "jpeg", "png", "gif", "ico", "css", "js", "svg", "otf"],
    ...input
  }: NginxCacheInput) {
    const context = fs.mkdtempSync("/tmp");

    const dockerfile = new DockerfileBuilder()
      .from("nginx:stable")
      .copy("./nginx.conf", "/etc/nginx/nginx.conf")
      .save(context);

    const config = new File(`${name}-nginx-config`, {
      path: path.join(context, "nginx.conf"),
      content: NginxCache.generateConfig(proxyTo, statics, ttl),
    });

    super({
      ...input,
      name,
      port: 80,
      build: { dockerfile, context, dependsOn: [config] },
    });
  }

  private static generateConfig(
    proxyTo: string,
    statics: string[],
    ttl: number
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
             proxy_pass ${proxyTo};
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

            proxy_pass ${proxyTo};
        }

      access_log off;
      error_log /var/log/nginx/error.log error;
    }
}`;
  }
}
