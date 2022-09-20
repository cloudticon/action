import { LocalFile } from "./LocalFile";
import { Input } from "./types";
import * as fs from "fs";
import * as path from "path";
import { context } from "./context";
import { heredoc } from "terraform-generator";

export type DotEnvInput = {
  name: string;
  env: Record<string, Input<string>>;
  extends?: string[];
};
export class DotEnv extends LocalFile {
  constructor({ name, env, extends: envExtends }: DotEnvInput) {
    env = DotEnv.buildEnv(env, envExtends);
    const content = Object.entries(env)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");
    super({
      name,
      filename: `${context.workingDir}/.env`,
      content: heredoc(content),
    });
  }

  private static parse(dotEnvPath: string) {
    const parsed: Record<string, string> = {};
    const content = fs.readFileSync(
      path.resolve(context.workingDir, dotEnvPath),
      "utf8"
    );
    const values = content
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => !!p)
      .map((p) => p.split("="));
    for (let [key, value] of values) {
      parsed[key] = value;
    }
    return parsed;
  }

  private static buildEnv(
    env: Record<string, Input<string>>,
    envExtends: string[] = []
  ) {
    const _env: Record<string, string> = {};
    const parsed = envExtends.map((p) => DotEnv.parse(p));
    parsed.forEach((e) => {
      Object.keys(e).forEach((k) => {
        _env[k] = e[k];
      });
    });
    return {
      ..._env,
      ...env,
    };
  }
}
