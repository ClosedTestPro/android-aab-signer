/**
 * POST /api/sign — start a jarsigner job on GitHub Actions.
 * Closed Test Pro AAB Signer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkCredentials } from '@/lib/ctp-files';
import { dispatchSignJob, resolveNewestJobId } from '@/lib/ctp-actions';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bundleUrl,
      storeUrl,
      bundleName,
      storeName,
      storePassword,
      alias,
      keyPassword,
    } = body as Record<string, string>;

    if (!bundleUrl || !storeUrl) {
      return NextResponse.json({ ok: false, error: 'Missing file URLs' }, { status: 400 });
    }

    const creds = checkCredentials({ storePassword, alias, keyPassword });
    if (!creds.ok) {
      return NextResponse.json({ ok: false, error: creds.message }, { status: 400 });
    }

    await dispatchSignJob({
      bundleUrl,
      storeUrl,
      bundleName: bundleName || 'unsigned.aab',
      storeName: storeName || 'keystore.jks',
      storePassword,
      alias,
      keyPassword,
    });

    // Small pause then find the run that was just created
    await new Promise((r) => setTimeout(r, 2500));
    const jobId = await resolveNewestJobId(60_000);

    return NextResponse.json({ ok: true, jobId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Signing request failed';
    console.error('POST /api/sign:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
