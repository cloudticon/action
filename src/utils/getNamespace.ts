import { context } from "../context";

export const getNamespace = () => {
  return `${context.project}-${context.branch}`;
};
