/**
 * GET /api/download/[runId] — stream signed AAB zip to the browser.
 * Closed Test Pro AAB Signer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { readJob, findSignedArtifactZipUrl, fetchArtifactZip } from '@/lib/ctp-actions';

export const runtime = 'nodejs';
export const maxDuration = 60;

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
    if (job.phase !== 'completed' || job.result !== 'success') {
      return NextResponse.json({ ok: false, error: 'Job not finished or failed' }, { status: 400 });
    }

    const zipUrl = await findSignedArtifactZipUrl(id);
    if (!zipUrl) {
      return NextResponse.json({ ok: false, error: 'Artifact missing' }, { status: 404 });
    }

    const buf = await fetchArtifactZip(zipUrl);

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="ctp-signed-${id}.zip"`,
        'Content-Length': String(buf.length),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Download failed';
    const expired = msg.includes('expired');
    console.error('GET /api/download:', msg);
    return NextResponse.json({ ok: false, error: msg, expired }, { status: expired ? 410 : 500 });
  }
}
