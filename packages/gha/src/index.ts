import {restoreCache, saveCache} from "./cache";

const cmd = "test"

const main = await () => {
  if (cmd === "apply") {
    await restoreCache([
      repositoryScore,
      projectBranchScope,
      repositoryBranchScope,
    ]);
  }
    ////deploy
  if (cmd === "apply") {
    await saveCache([
      repositoryScore,
      projectBranchScope,
      repositoryBranchScope,
    ]);
  }
}