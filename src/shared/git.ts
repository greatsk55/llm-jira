import simpleGit, { SimpleGit } from 'simple-git';
import * as fs from 'fs-extra';
import * as path from 'path';

let gitInstance: SimpleGit | null = null;

function getGit(projectRoot: string): SimpleGit {
  if (!gitInstance) {
    gitInstance = simpleGit(projectRoot);
  }
  return gitInstance;
}

export async function isGitRepo(projectRoot: string): Promise<boolean> {
  try {
    const gitPath = path.join(projectRoot, '.git');
    return await fs.pathExists(gitPath);
  } catch {
    return false;
  }
}

export async function initGitRepo(projectRoot: string): Promise<void> {
  const git = getGit(projectRoot);
  const isRepo = await isGitRepo(projectRoot);
  
  if (!isRepo) {
    await git.init();
  }
}

export async function createRelease(
  projectRoot: string,
  version: string,
  snapshot: string
): Promise<{ commitHash: string; tag: string }> {
  const git = getGit(projectRoot);
  
  // .llm-jira 디렉토리를 커밋
  await git.add('.llm-jira/');
  
  // 커밋 메시지
  const commitMessage = `Release ${version}`;
  
  // 커밋
  const commitResult = await git.commit(commitMessage);
  const commitHash = commitResult.commit || '';

  // 태그 생성
  const tag = version.startsWith('v') ? version : `v${version}`;
  await git.addAnnotatedTag(tag, `Release ${version}`);

  return {
    commitHash,
    tag,
  };
}

export async function checkoutRelease(
  projectRoot: string,
  tag: string
): Promise<void> {
  const git = getGit(projectRoot);
  await git.checkout(tag);
}

export async function getCurrentBranch(projectRoot: string): Promise<string> {
  const git = getGit(projectRoot);
  const branch = await git.branch();
  return branch.current;
}

export async function getTags(projectRoot: string): Promise<string[]> {
  const git = getGit(projectRoot);
  const tags = await git.tags();
  return tags.all;
}
