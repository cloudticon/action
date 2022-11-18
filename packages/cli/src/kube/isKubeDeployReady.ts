import { V1Deployment } from "@kubernetes/client-node";

export const isKubeDeployReady = (deploy: V1Deployment) => {
  const condition = deploy.status.conditions.find(
    (c) => c.type === "Available"
  );
  return condition.status === "True";
};
