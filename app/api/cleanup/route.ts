/**
 * POST /api/cleanup — delete temporary blob files.
 * Closed Test Pro AAB Signer.
 */

import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { urls } = (await req.json()) as { urls?: string[] };
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ ok: false, error: 'No URLs provided' }, { status: 400 });
    }

    await del(urls);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/cleanup:', err);
    return NextResponse.json({ ok: false, error: 'Cleanup failed' }, { status: 500 });
  }
}
