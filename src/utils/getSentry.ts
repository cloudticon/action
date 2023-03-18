import { getCtCreds } from "./setupCreds";
import { globalTerraform } from "./compileAndRequireCtFile";
import { Data, map } from "terraform-generator";
import { context } from "../context";

let data: Data;
export const getSentry = () => {
  return {
    dns: "",
  };
  const { sentry } = getCtCreds();
  if (sentry) {
    if (!data) {
      data = globalTerraform.data(
        "terraform_remote_state",
        `${context.project}-${context.repository}`,
        {
          backend: "s3",
          config: map({
            bucket: "cloudticon",
            key: `waw/${context.project}-${context.repository}`,
            region: "eu-central-1",
          }),
        }
      );
    }

    return {
      ...sentry,
      dns: data.attr("outputs").attr("sentry_dsn"),
      project: data.attr("outputs").attr("sentry_project_name"),
    };
  }
};
