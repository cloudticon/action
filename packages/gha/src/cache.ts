import { Terraform } from "../../core/src/terraform/Terraform";
import * as cache from "@actions/cache";
import { context } from "../../core/src/context";

const terraformCacheKey = `ct-terraform-${context.project}-${context.repository}-${context.branch}`;
const dockerCacheKey = `ct-docker-${context.project}-${context.repository}-${context.branch}`;

export const restoreCache = async (scopes: Terraform[]) => {
  await Promise.all([
    // cache.restoreCache(["/tmp/docker-cache"], dockerCacheKey),
    cache.restoreCache(scopesPaths(scopes), terraformCacheKey),
  ]);
};

export const saveCache = async (scopes: Terraform[]) => {
  await Promise.all([
    // cache.saveCache(["/tmp/docker-cache"], dockerCacheKey),
    cache.saveCache(scopesPaths(scopes), terraformCacheKey),
  ]);
};

const scopesPaths = (scopes: Terraform[]) => {
  const terraformPaths: string[] = [];
  for (let scope of scopes) {
    terraformPaths.push(...scope.getMetadataPath());
  }
  return terraformPaths;
};
