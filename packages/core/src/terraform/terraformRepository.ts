import { map } from "terraform-generator";
import { getCtCreds } from "../utils/setupCreds";
import { context } from "../context";
import { Terraform } from "./Terraform";

export const terraformRepository = () => {
  const dir = `/tmp/.ct/repository`;
  const creds = getCtCreds().sentry;

  const tf = new Terraform(`${context.project}-${context.repository}`, dir, {
    required_version: ">= 0.12",
    required_providers: {
      sentry: map({
        source: "jianyuan/sentry",
        version: "0.9.4",
      }),
    },
  });

  tf.provider("sentry", {
    base_url: `${creds.url}/api/`,
    token: creds.token,
  });

  const project = tf.resource("sentry_project", "default", {
    organization: creds.organization,
    team: creds.team,
    name: `${context.project}-${context.repository}`,
    slug: `${context.project}-${context.repository}`.toLowerCase(),
  });

  const key = tf.resource("sentry_key", "default", {
    organization: creds.organization,
    project: project.attr("slug"),
    name: "main",
  });

  tf.output("sentry_dsn", {
    value: key.attr("dsn_public"),
  });

  tf.output("sentry_project_name", {
    value: project.attr("name"),
  });

  return tf;
};
