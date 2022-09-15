import { context } from "../context";

export const getContext = () => ({
  branch: {
    name: context.branch,
  },
});
