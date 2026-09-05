'use client';

import { useState, useCallback, useEffect } from 'react';
import { upload } from '@vercel/blob/client';
import { UploadForm, type SignFormData } from '@/components/upload-form';
import { ProgressDisplay, type SigningStatus } from '@/components/progress-display';

const CheckIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ChevronDownIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const GitHubIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const faqData = [
  {
    question: 'Do I have to pay?',
    answer:
      'No. This tool is free. Signing uses free GitHub Actions time on our public repo, and Closed Test Pro does not charge for it.',
  },
  {
    question: 'Will my keystore stay private?',
    answer:
      'Yes. Your keystore is sent over HTTPS, used only to sign this one job, then deleted. The job runs on a temporary GitHub machine that is thrown away after. You can check the public workflow code anytime.',
  },
  {
    question: 'Why does my AAB need a signature?',
    answer:
      'Google Play will not accept an unsigned App Bundle. You must sign it with your app’s private key before you upload it to Play Console.',
  },
  {
    question: 'Which tool creates the signature?',
    answer:
      'We use jarsigner from the official Java tools, with the SHA256withRSA method. That is a standard way to sign Android App Bundles.',
  },
  {
    question: 'Is this okay for a real Play Store release?',
    answer:
      'Yes. The file you download is a normal signed AAB. You can upload it to production if you used the correct keystore for that app.',
  },
  {
    question: 'How do I create a keystore?',
    answer:
      'In Android Studio use Build → Generate Signed Bundle/APK, or use the keytool command. If the app is already on Play, keep using the same upload keystore you used before.',
  },
  {
    question: 'How is this different from signing in Android Studio?',
    answer:
      'Android Studio is great when you build on your machine. This online AAB signer helps when you already have an unsigned .aab and need jarsigner without installing a local JDK. Both use the same signing standards Google expects.',
  },
  {
    question: 'What file types does the signer accept?',
    answer:
      'Upload an unsigned .aab up to 100 MB, and a keystore as .jks, .keystore, .p12, or .pfx up to 10 MB. You also need the keystore password, key alias, and key password.',
  },
];

const pipelineDemo = [
  { label: 'Secure upload', state: 'done' as const },
  { label: 'Start Actions job', state: 'done' as const },
  { label: 'Run jarsigner', state: 'active' as const },
  { label: 'Verify signature', state: 'pending' as const },
  { label: 'Ready to download', state: 'pending' as const },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[#e5e5e5] last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-5 text-left group"
      >
        <span className="pr-4 font-medium text-[#0a0a0a] group-hover:opacity-80">{question}</span>
        <ChevronDownIcon
          className={`h-5 w-5 shrink-0 text-[#6b6b6b] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-5' : 'max-h-0'}`}>
        <p className="text-[15px] leading-relaxed text-[#6b6b6b]">{answer}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [status, setStatus] = useState<SigningStatus>('idle');
  const [error, setError] = useState<string | undefined>();
  const [downloadUrl, setDownloadUrl] = useState<string | undefined>();
  const [runId, setRunId] = useState<number | null>(null);
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [blobUrls, setBlobUrls] = useState<string[]>([]);

  const cleanupBlobs = useCallback(async (urls: string[]) => {
    if (urls.length === 0) return;
    try {
      await fetch('/api/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  }, []);

  useEffect(() => {
    if (status !== 'signing' || !runId) return;

    const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
    const startedAt = Date.now();

    const pollInterval = setInterval(async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        cleanupBlobs(blobUrls);
        setBlobUrls([]);
        setError('Signing timed out. The workflow may still be running — check GitHub Actions and try again.');
        setStatus('failed');
        clearInterval(pollInterval);
        return;
      }

      try {
        const response = await fetch(`/api/status/${runId}`);
        const data = await response.json();

        if (data.status === 'completed') {
          cleanupBlobs(blobUrls);
          setBlobUrls([]);

          if (data.conclusion === 'success' && data.artifactUrl) {
            setDownloadUrl(data.artifactUrl);
            setStatus('completed');
          } else {
            setError(data.error || 'Signing failed. Check your keystore credentials and try again.');
            setStatus('failed');
          }
          clearInterval(pollInterval);
        } else if (data.status === 'failed' || data.conclusion === 'failure') {
          cleanupBlobs(blobUrls);
          setBlobUrls([]);
          setError(data.error || 'Signing failed. Check your keystore credentials and try again.');
          setStatus('failed');
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [status, runId, blobUrls, cleanupBlobs]);

  const handleSubmit = useCallback(
    async (data: SignFormData) => {
      setStatus('uploading');
      setError(undefined);
      setDownloadUrl(undefined);
      setShowSigningModal(true);

      const uploadedUrls: string[] = [];
      try {
        const tag = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const bundleBlob = await upload(`ctp-${tag}/${data.aabFile.name}`, data.aabFile, {
          access: 'public',
          handleUploadUrl: '/api/blob-upload',
        });
        uploadedUrls.push(bundleBlob.url);

        const storeBlob = await upload(`ctp-${tag}/${data.keystoreFile.name}`, data.keystoreFile, {
          access: 'public',
          handleUploadUrl: '/api/blob-upload',
        });
        uploadedUrls.push(storeBlob.url);

        setBlobUrls(uploadedUrls);
        setStatus('triggering');

        const res = await fetch('/api/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bundleUrl: bundleBlob.url,
            storeUrl: storeBlob.url,
            bundleName: data.aabFile.name,
            storeName: data.keystoreFile.name,
            storePassword: data.keystorePassword,
            alias: data.keyAlias,
            keyPassword: data.keyPassword,
          }),
        });

        const result = await res.json();

        if (!result.ok) {
          throw new Error(result.error || 'Failed to start signing');
        }

        setStatus('signing');
        setRunId(result.jobId ?? null);

        if (!result.jobId) {
          await new Promise((r) => setTimeout(r, 5000));
        }
      } catch (err) {
        console.error('Signing error:', err);
        if (uploadedUrls.length > 0) {
          cleanupBlobs(uploadedUrls);
        }
        setBlobUrls([]);
        setError(err instanceof Error ? err.message : 'Something went wrong.');
        setStatus('failed');
      }
    },
    [blobUrls, cleanupBlobs]
  );

  const handleReset = useCallback(() => {
    setStatus('idle');
    setError(undefined);
    setDownloadUrl(undefined);
    setRunId(null);
    setShowSigningModal(false);
    setBlobUrls([]);
  }, []);

  const isProcessing = status !== 'idle' && status !== 'completed' && status !== 'failed';

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a]">
      <header className="sticky top-0 z-50 h-16 border-b border-[#e5e5e5] bg-white/70 backdrop-blur-xl">
        <div className="container-custom flex h-full items-center justify-between">
          <a href="https://closedtestpro.com" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <img src="/logo.png" alt="Closed Test Pro" width={32} height={32} className="h-8 w-8 rounded-lg" />
            <span className="text-[15px] font-bold tracking-tight">Closed Test Pro</span>
          </a>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://closedtestpro.com"
              className="hidden px-2 text-[13.5px] font-medium text-[#6b6b6b] transition-colors hover:text-[#0a0a0a] sm:inline"
            >
              Main site
            </a>
            <a
              href="https://closedtestpro.com/blog/sign-android-aab-online-free"
              className="hidden px-2 text-[13.5px] font-medium text-[#6b6b6b] transition-colors hover:text-[#0a0a0a] md:inline"
            >
              Guide
            </a>
            <a
              href="https://github.com/ClosedTestPro/android-aab-signer"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-2 text-[13.5px] font-medium text-[#6b6b6b] transition-colors hover:text-[#0a0a0a]"
            >
              <GitHubIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Source</span>
            </a>
            <a
              href="#signer"
              className="inline-flex items-center rounded-full bg-[#0a0a0a] px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Open signer
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="bg-hero-ink text-white">
          <div className="container-custom py-16 sm:py-20 lg:py-24">
            <p className="mb-5 text-[11px] uppercase tracking-[0.14em] text-white/40">Developer tools</p>
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              AAB Signer
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/55 sm:text-xl">
              Sign an Android App Bundle for Google Play in your browser. Free, open source, built for Closed Test Pro
              developers.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/60">
              {['No account', 'Keystore deleted after job', 'jarsigner on GitHub Actions'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="signer" className="border-b border-[#e5e5e5] py-14 sm:py-20">
          <div className="container-custom max-w-3xl">
            <div className="mb-8">
              <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[#6b6b6b]">Studio</p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Prepare a signed release</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[#6b6b6b]">
                Walk through bundle → key → confirm. Nothing is stored after the job ends.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-5 sm:p-8">
              <UploadForm onSubmit={handleSubmit} disabled={isProcessing} />
            </div>

            <p className="mt-4 text-center text-xs text-[#6b6b6b]">
              Limits: AAB {100} MB · keystore {10} MB · artifact kept ~24 hours
            </p>
          </div>
        </section>

        {showSigningModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="animate-fade-in w-full max-w-md rounded-2xl border border-[#e5e5e5] bg-white p-6 shadow-xl sm:p-8">
              <ProgressDisplay
                status={status}
                error={error}
                downloadUrl={downloadUrl}
                onReset={handleReset}
              />
            </div>
          </div>
        ) : null}

        <section id="pipeline" className="border-b border-[#e5e5e5] bg-[#fafafa] py-16 sm:py-20">
          <div className="container-custom">
            <div className="mb-10 max-w-2xl">
              <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[#6b6b6b]">Transparency</p>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Live signing pipeline</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#6b6b6b]">
                Every run is public. You can follow the same stages below in GitHub Actions and read the exact workflow
                that touches your files.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white">
              <div className="grid gap-0 lg:grid-cols-5">
                {pipelineDemo.map((stage, index) => (
                  <div
                    key={stage.label}
                    className={`relative border-b border-[#e5e5e5] p-5 lg:border-b-0 lg:border-r lg:last:border-r-0 ${
                      stage.state === 'active' ? 'bg-[#0a0a0a] text-white' : ''
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-medium uppercase tracking-[0.12em] ${
                          stage.state === 'active' ? 'text-white/45' : 'text-[#6b6b6b]'
                        }`}
                      >
                        Stage {index + 1}
                      </span>
                      {stage.state === 'done' ? (
                        <CheckIcon className="h-4 w-4 text-emerald-600" />
                      ) : stage.state === 'active' ? (
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-[#e5e5e5]" />
                      )}
                    </div>
                    <p className={`text-sm font-semibold tracking-tight ${stage.state === 'active' ? 'text-white' : 'text-[#0a0a0a]'}`}>
                      {stage.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#e5e5e5] bg-[#fafafa] px-5 py-5">
                <p className="mb-4 max-w-2xl text-sm leading-relaxed text-[#6b6b6b]">
                  Every signing job is public. Read the workflow source, then watch live Actions runs while your bundle is
                  signed.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href="https://github.com/ClosedTestPro/android-aab-signer/blob/main/.github/workflows/ctp-aab-sign.yml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-[#0a0a0a] bg-white px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#0a0a0a] hover:text-white"
                  >
                    Read workflow source
                  </a>
                  <a
                    href="https://github.com/ClosedTestPro/android-aab-signer/actions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0a0a0a] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    <GitHubIcon className="h-4 w-4" />
                    Watch live runs
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#e5e5e5] py-16 sm:py-20">
          <div className="container-custom">
            <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
            <p className="mb-10 max-w-xl text-[#6b6b6b]">Four steps. No desktop JDK install required.</p>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { n: '01', t: 'Upload', d: 'Add your unsigned AAB in the studio wizard.' },
                { n: '02', t: 'Key', d: 'Attach keystore and alias credentials for Play upload signing.' },
                { n: '03', t: 'Sign', d: 'A GitHub Actions job runs jarsigner on a clean VM.' },
                { n: '04', t: 'Download', d: 'Get the signed bundle and upload it to Play Console.' },
              ].map((step) => (
                <div key={step.n} id={`step-${step.n}`}>
                  <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[#6b6b6b]">{step.n}</div>
                  <h3 className="mb-2 text-lg font-semibold tracking-tight">{step.t}</h3>
                  <p className="text-sm leading-relaxed text-[#6b6b6b]">{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#e5e5e5] bg-[#fafafa] py-16 sm:py-20">
          <div className="container-custom max-w-3xl">
            <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[#6b6b6b]">Developer guide</p>
            <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Sign an Android App Bundle online for Google Play
            </h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-[#6b6b6b]">
              <p>
                Google Play requires a signed Android App Bundle (AAB) before you can ship to closed testing or
                production. If your build pipeline produces an unsigned `.aab`, you need{' '}
                <strong className="font-medium text-[#0a0a0a]">jarsigner</strong> (or Android Studio) with your upload
                keystore.
              </p>
              <p>
                Closed Test Pro AAB Signer runs that signing step in the browser: upload the unsigned AAB and keystore,
                enter alias and passwords, then download a signed bundle ready for Play Console. Files are processed on
                ephemeral GitHub Actions runners and deleted after the job.
              </p>
              <p>
                Prefer a written walkthrough? Read our guide:{' '}
                <a
                  href="https://closedtestpro.com/blog/sign-android-aab-online-free"
                  className="font-medium text-[#0a0a0a] underline underline-offset-2"
                >
                  How to sign an Android AAB online free
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[#e5e5e5] py-16 sm:py-20">
          <div className="container-custom">
            <div className="overflow-hidden rounded-2xl border border-[#e5e5e5]">
              <div className="grid lg:grid-cols-2">
                <div className="bg-hero-ink px-8 py-10 text-white sm:px-10 sm:py-12">
                  <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-white/40">Closed Test Pro</p>
                  <h2 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    Finished signing? Complete closed testing next.
                  </h2>
                  <p className="max-w-md leading-relaxed text-white/55">
                    New Play developer accounts still need 12 opted-in testers for 14 days. Closed Test Pro helps you
                    find real Android developers and track daily opens.
                  </p>
                </div>
                <div className="flex flex-col justify-center gap-4 bg-white px-8 py-10 sm:px-10 sm:py-12">
                  <a
                    href="https://closedtestpro.com/get-12-testers-free"
                    className="inline-flex items-center justify-center rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Get 12 testers free
                  </a>
                  <a
                    href="https://closedtestpro.com/pricing"
                    className="inline-flex items-center justify-center rounded-full border border-[#e5e5e5] px-5 py-3 text-sm font-semibold text-[#0a0a0a] hover:bg-[#f5f5f5]"
                  >
                    Compare Free, Pro & Premium
                  </a>
                  <a
                    href="https://closedtestpro.com/blog/sign-android-aab-online-free"
                    className="text-center text-sm font-medium text-[#6b6b6b] underline underline-offset-2 hover:text-[#0a0a0a]"
                  >
                    Read the AAB signing guide
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#e5e5e5] py-16 sm:py-20">
          <div className="container-custom max-w-3xl">
            <h2 className="mb-3 text-center text-2xl font-bold tracking-tight sm:text-3xl">FAQ</h2>
            <p className="mb-10 text-center text-[#6b6b6b]">Simple answers about signing AABs online</p>
            <div className="surface-card px-6 sm:px-8">
              {faqData.map((faq) => (
                <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-[#6b6b6b]">
              Need help?{' '}
              <a
                href="mailto:closedtestpro@gmail.com"
                className="font-medium text-[#0a0a0a] underline underline-offset-2"
              >
                closedtestpro@gmail.com
              </a>
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e5e5e5] bg-[#fafafa] py-14">
        <div className="container-custom">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <a href="https://closedtestpro.com" className="mb-3 inline-flex items-center gap-2.5">
                <img src="/logo.png" alt="Closed Test Pro" width={32} height={32} className="h-8 w-8 rounded-lg" />
                <span className="text-[15px] font-bold tracking-tight">Closed Test Pro</span>
              </a>
              <p className="max-w-sm text-sm leading-relaxed text-[#6b6b6b]">
                Free online AAB signer for Google Play. Open source under AGPL-3.0. Built for developers who also use
                Closed Test Pro for closed testing.
              </p>
            </div>
            <div>
              <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[#6b6b6b]">Product</p>
              <ul className="space-y-2 text-sm text-[#6b6b6b]">
                <li>
                  <a href="#signer" className="hover:text-[#0a0a0a]">
                    AAB Signer
                  </a>
                </li>
                <li>
                  <a href="https://closedtestpro.com/get-12-testers-free" className="hover:text-[#0a0a0a]">
                    Get 12 testers free
                  </a>
                </li>
                <li>
                  <a href="https://closedtestpro.com/pricing" className="hover:text-[#0a0a0a]">
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="https://closedtestpro.com/blog/sign-android-aab-online-free"
                    className="hover:text-[#0a0a0a]"
                  >
                    Signing guide
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[#6b6b6b]">Open source</p>
              <ul className="space-y-2 text-sm text-[#6b6b6b]">
                <li>
                  <a
                    href="https://github.com/ClosedTestPro/android-aab-signer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#0a0a0a]"
                  >
                    GitHub repository
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/ClosedTestPro/android-aab-signer/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#0a0a0a]"
                  >
                    LICENSE
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/ClosedTestPro/android-aab-signer/blob/main/NOTICE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#0a0a0a]"
                  >
                    NOTICE
                  </a>
                </li>
                <li>
                  <a href="mailto:closedtestpro@gmail.com" className="hover:text-[#0a0a0a]">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col justify-between gap-3 border-t border-[#e5e5e5] pt-6 text-[13px] text-[#6b6b6b] sm:flex-row">
            <p>© {new Date().getFullYear()} Closed Test Pro</p>
            <p>
              <a href="https://closedtestpro.com" className="hover:text-[#0a0a0a]">
                closedtestpro.com
              </a>
              {' · '}
              <a href="https://closedtestpro.com/blog" className="hover:text-[#0a0a0a]">
                Blog
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
