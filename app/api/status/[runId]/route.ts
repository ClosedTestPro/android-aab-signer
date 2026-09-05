/**
 * GET /api/status/[runId] — poll a signing job.
 * Closed Test Pro AAB Signer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readJob, findSignedArtifactZipUrl } from '@/lib/ctp-actions';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    const id = parseInt(runId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ ok: false, error: 'Bad run ID' }, { status: 400 });
    }

    const job = await readJob(id);

    const out: Record<string, unknown> = {
      ok: true,
      status: job.phase,
      conclusion: job.result,
    };

    if (job.phase === 'completed') {
      if (job.result === 'success') {
        const zipUrl = await findSignedArtifactZipUrl(id);
        if (zipUrl) out.artifactUrl = `/api/download/${id}`;
      } else {
        out.error =
          job.result === 'cancelled'
            ? 'Signing was cancelled.'
            : 'Signing failed — check keystore credentials.';
      }
    }

    return NextResponse.json(out);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Status check failed';
    console.error('GET /api/status:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
