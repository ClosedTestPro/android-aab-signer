/**
 * Closed Test Pro — GitHub Actions integration for remote jarsigner jobs.
 * Passwords are forwarded to workflow inputs only; they are never written to logs here.
 */

import { githubHeaders, requireSignerEnv } from './ctp-env';

const API = 'https://api.github.com';

export type JobPhase = 'queued' | 'in_progress' | 'completed';
export type JobResult = 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out' | null;

export type DispatchPayload = {
  bundleUrl: string;
  storeUrl: string;
  bundleName: string;
  storeName: string;
  storePassword: string;
  alias: string;
  keyPassword: string;
};

export async function dispatchSignJob(payload: DispatchPayload): Promise<void> {
  const env = requireSignerEnv();
  const url = `${API}/repos/${env.githubOwner}/${env.githubRepo}/actions/workflows/${env.workflowFile}/dispatches`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...githubHeaders(env.githubToken),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ref: 'main',
      inputs: {
        bundle_url: payload.bundleUrl,
        store_url: payload.storeUrl,
        bundle_name: payload.bundleName,
        store_name: payload.storeName,
        store_password: payload.storePassword,
        key_alias: payload.alias,
        key_password: payload.keyPassword,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('dispatchSignJob failed', res.status);
    throw new Error(detail || 'Could not start signing job');
  }
}

export async function resolveNewestJobId(withinMs = 90_000): Promise<number | null> {
  const env = requireSignerEnv();
  const url = `${API}/repos/${env.githubOwner}/${env.githubRepo}/actions/workflows/${env.workflowFile}/runs?per_page=8`;
  const res = await fetch(url, { headers: githubHeaders(env.githubToken) });
  if (!res.ok) return null;

  const body = (await res.json()) as {
    workflow_runs?: Array<{ id: number; created_at: string }>;
  };

  const now = Date.now();
  const match = body.workflow_runs?.find((run) => now - new Date(run.created_at).getTime() < withinMs);
  return match?.id ?? null;
}

export async function readJob(jobId: number): Promise<{
  id: number;
  phase: JobPhase;
  result: JobResult;
}> {
  const env = requireSignerEnv();
  const res = await fetch(`${API}/repos/${env.githubOwner}/${env.githubRepo}/actions/runs/${jobId}`, {
    headers: githubHeaders(env.githubToken),
  });
  if (!res.ok) throw new Error('Could not read job status');

  const data = (await res.json()) as {
    id: number;
    status: JobPhase;
    conclusion: JobResult;
  };

  return { id: data.id, phase: data.status, result: data.conclusion };
}

export async function findSignedArtifactZipUrl(jobId: number): Promise<string | null> {
  const env = requireSignerEnv();
  const res = await fetch(
    `${API}/repos/${env.githubOwner}/${env.githubRepo}/actions/runs/${jobId}/artifacts`,
    { headers: githubHeaders(env.githubToken) }
  );
  if (!res.ok) throw new Error('Could not list job artifacts');

  const data = (await res.json()) as {
    artifacts?: Array<{ id: number; name: string }>;
  };

  const artifact = data.artifacts?.find((a) => a.name === 'ctp-signed-aab');
  if (!artifact) return null;

  return `${API}/repos/${env.githubOwner}/${env.githubRepo}/actions/artifacts/${artifact.id}/zip`;
}

export async function fetchArtifactZip(zipApiUrl: string): Promise<Buffer> {
  const env = requireSignerEnv();
  const res = await fetch(zipApiUrl, {
    headers: {
      Authorization: `Bearer ${env.githubToken}`,
      Accept: 'application/vnd.github+json',
    },
    redirect: 'follow',
  });

  if (res.status === 404 || res.status === 410) {
    throw new Error('Signed file expired. Please run signing again.');
  }
  if (!res.ok) throw new Error('Could not download signed file');

  const type = res.headers.get('content-type') || '';
  if (type.includes('text/html') || type.includes('text/plain')) {
    throw new Error('Signed file expired. Please run signing again.');
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 4 || buf[0] !== 0x50 || buf[1] !== 0x4b) {
    throw new Error('Signed file expired. Please run signing again.');
  }
  return buf;
}
