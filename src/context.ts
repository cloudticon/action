console.log(process.env);

const [project, repository] = process.env.GITHUB_REPOSITORY.split("/");
const [, , branch] = process.env.GITHUB_REF.split("/");

export const context = {
  project,
  repository,
  branch,
  workingDir: process.env.DEPLOYMENT_BASEPATH,
};
