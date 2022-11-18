import { getGitInfo } from "./gitInfo";

export const getContext = async () => {
  const info = await getGitInfo();

  return {
    ...info,
    namespace: `${info.project}-${info.branch}`,
  };
};
