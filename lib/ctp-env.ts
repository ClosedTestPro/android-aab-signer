/**
 * Closed Test Pro — environment helpers for the AAB Signer service.
 */

export type SignerEnv = {
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
  workflowFile: string;
};

export function requireSignerEnv(): SignerEnv {
  const githubToken = process.env.GITHUB_TOKEN?.trim();
  const githubOwner = process.env.GITHUB_OWNER?.trim();
  const githubRepo = process.env.GITHUB_REPO?.trim();
  const workflowFile = process.env.SIGN_WORKFLOW_FILE?.trim() || 'ctp-aab-sign.yml';

  if (!githubToken || !githubOwner || !githubRepo) {
    throw new Error('Server is missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO');
  }

  return { githubToken, githubOwner, githubRepo, workflowFile };
}

export function githubHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}
