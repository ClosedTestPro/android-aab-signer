'use client';

import { useState } from 'react';

export type SigningStatus =
  | 'idle'
  | 'uploading'
  | 'triggering'
  | 'signing'
  | 'completed'
  | 'failed';

interface ProgressDisplayProps {
  status: SigningStatus;
  error?: string;
  downloadUrl?: string;
  onReset?: () => void;
}

const stages = [
  { id: 'uploading', label: 'Secure upload', detail: 'Sending bundle and keystore' },
  { id: 'triggering', label: 'Queue job', detail: 'Starting Actions runner' },
  { id: 'signing', label: 'jarsigner', detail: 'Applying your upload key' },
  { id: 'completed', label: 'Artifact ready', detail: 'Signed AAB available' },
] as const;

export function ProgressDisplay({ status, error, downloadUrl, onReset }: ProgressDisplayProps) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!downloadUrl) return;
    setDownloadError(null);
    setIsDownloading(true);
    try {
      const response = await fetch(downloadUrl);
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await response.json();
        throw new Error(data.error || 'Download failed');
      }

      if (!response.ok) {
        throw new Error(
          response.status === 410
            ? 'Download expired. Please sign your AAB again.'
            : 'Download failed. Please try again or sign your AAB again.'
        );
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty. Please sign your AAB again.');
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'signed.aab';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : 'Download failed. Please try again.'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const order = ['uploading', 'triggering', 'signing', 'completed'] as const;
  const activeStatus =
    status === 'idle' ? 'uploading' : status === 'failed' ? 'signing' : status;
  const currentIndex = Math.max(0, order.indexOf(activeStatus as (typeof order)[number]));

  const title =
    status === 'completed' && !downloadError
      ? 'Signed successfully'
      : status === 'failed' || downloadError
        ? 'Signing stopped'
        : 'Signing in progress';

  const subtitle =
    status === 'completed' && !downloadError
      ? 'Your App Bundle is ready for Play Console'
      : status === 'failed' || downloadError
        ? 'Check credentials or try again'
        : 'Usually finishes in 2–3 minutes';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-[#6b6b6b] mb-2">Job status</p>
        <h3 className="text-xl font-bold tracking-tight text-[#0a0a0a]">{title}</h3>
        <p className="mt-1 text-sm text-[#6b6b6b]">{subtitle}</p>
      </div>

      <ol className="space-y-0">
        {stages.map((stage, index) => {
          let state: 'done' | 'current' | 'pending' | 'failed' = 'pending';
          if (status === 'completed' && !downloadError) state = 'done';
          else if (status === 'failed' || downloadError) {
            if (index < currentIndex) state = 'done';
            else if (index === currentIndex) state = 'failed';
          } else if (index < currentIndex) state = 'done';
          else if (index === currentIndex) state = 'current';

          return (
            <li key={stage.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    state === 'done'
                      ? 'bg-[#0a0a0a] text-white'
                      : state === 'current'
                        ? 'border-2 border-[#0a0a0a] text-[#0a0a0a]'
                        : state === 'failed'
                          ? 'bg-red-600 text-white'
                          : 'bg-[#e5e5e5] text-[#6b6b6b]'
                  }`}
                >
                  {state === 'done' ? '✓' : state === 'failed' ? '!' : index + 1}
                </span>
                {index < stages.length - 1 ? (
                  <span
                    className={`my-1 w-px flex-1 min-h-6 ${
                      state === 'done' ? 'bg-[#0a0a0a]' : 'bg-[#e5e5e5]'
                    }`}
                  />
                ) : null}
              </div>
              <div className="pb-5">
                <p
                  className={`text-sm font-medium ${
                    state === 'pending' ? 'text-[#6b6b6b]' : 'text-[#0a0a0a]'
                  }`}
                >
                  {stage.label}
                  {state === 'current' ? (
                    <span className="ml-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 align-middle" />
                  ) : null}
                </p>
                <p className="text-xs text-[#6b6b6b]">{stage.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {(status === 'failed' || downloadError) && (error || downloadError) ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{downloadError || error}</p>
          <a href="mailto:closedtestpro@gmail.com" className="mt-2 inline-block font-medium underline">
            closedtestpro@gmail.com
          </a>
        </div>
      ) : null}

      {status === 'completed' && downloadUrl && !downloadError ? (
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full rounded-full btn-ink py-3 text-sm font-semibold disabled:opacity-50"
        >
          {isDownloading ? 'Preparing download…' : 'Download signed AAB'}
        </button>
      ) : null}

      {(status === 'completed' || status === 'failed') && onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-full border border-[#e5e5e5] py-3 text-sm font-semibold text-[#0a0a0a] hover:bg-[#f5f5f5]"
        >
          Sign another bundle
        </button>
      ) : null}

      {status === 'uploading' || status === 'triggering' || status === 'signing' ? (
        <a
          href="https://github.com/ClosedTestPro/android-aab-signer/actions"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-sm font-medium text-[#0a0a0a] underline underline-offset-2"
        >
          Open live Actions runs
        </a>
      ) : null}
    </div>
  );
}
