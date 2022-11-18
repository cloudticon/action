import { V1Deployment } from "@kubernetes/client-node";

export const isKubeDeployReady = (deploy: V1Deployment) => {
  const condition = deploy.status.conditions.find(
    (c) => c.type === "Available"
  );
  // console.log(deploy.status.conditions.map((s) => `${s.reason}: ${s.status}`));
  return condition.status === "True";
};
