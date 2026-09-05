/**
 * POST /api/blob-upload — Vercel Blob client upload handler.
 * Closed Test Pro AAB Signer.
 */

import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED = new Set(['aab', 'jks', 'keystore', 'p12', 'pfx']);
const MAX_UPLOAD = 150 * 1024 * 1024;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as HandleUploadBody;

    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const ext = pathname.split('.').pop()?.toLowerCase();
        if (!ext || !ALLOWED.has(ext)) {
          throw new Error('File type not allowed');
        }
        return { maximumSizeInBytes: MAX_UPLOAD };
      },
      onUploadCompleted: async () => {
        /* no-op */
      },
    });

    return NextResponse.json(json);
  } catch (err) {
    console.error('POST /api/blob-upload:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 400 }
    );
  }
}
