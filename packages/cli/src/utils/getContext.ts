import process from "process";
import getRepoInfo from "git-repo-info";
import gitconfig from "gitconfiglocal";
import { promisify } from "util";
const pGitconfig = promisify(gitconfig);

async function gitRemoteOriginUrl({
  cwd = process.cwd(),
  remoteName = "origin",
} = {}) {
  const config = await pGitconfig(cwd);
  const url =
    config.remote && config.remote[remoteName] && config.remote[remoteName].url;

  if (!url) {
    throw new Error(`Couldn't find ${remoteName} url`);
  }

  return url;
}

const getGitInfo = async () => {
  const url = await gitRemoteOriginUrl();
  const info = getRepoInfo();
  let [project, repository] = url
    .replace("git@github.com:", "")
    .replace("https://github.com/", "")
    .replace(".git", "")
    .split("/");
  project = project.toLowerCase();
  repository = repository.toLowerCase();
  const branch = info.branch;
  const commit = info.sha;
  const namespace = `${project}-${branch}`;
  return { project, repository, branch, namespace };
};

export const getContext = async () => {
  const info = await getGitInfo();

  return {
    ...info,
    namespace: `${info.project}-${info.branch}`,
  };
};
