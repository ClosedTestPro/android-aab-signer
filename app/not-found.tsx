import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'Page not found. Return to Closed Test Pro AAB Signer.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[#6b6b6b] mb-4">Error</p>
        <h1 className="text-6xl font-bold tracking-tight mb-4">404</h1>
        <p className="text-[#6b6b6b] mb-8 leading-relaxed">
          That page does not exist. Head back to the AAB Signer.
        </p>
        <Link
          href="/"
          className="inline-flex items-center rounded-full btn-ink text-sm font-semibold px-5 py-2.5"
        >
          Back to AAB Signer
        </Link>
        <div className="mt-10 text-sm text-[#6b6b6b]">
          <a href="https://closedtestpro.com" className="hover:text-[#0a0a0a] underline underline-offset-2">
            closedtestpro.com
          </a>
        </div>
      </div>
    </div>
  );
}
