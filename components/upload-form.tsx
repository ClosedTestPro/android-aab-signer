'use client';

import { useState, useCallback, useRef } from 'react';
import {
  checkAab,
  checkKeystore,
  checkCredentials,
  AAB_MAX_BYTES,
  KEYSTORE_MAX_BYTES,
  AAB_SUFFIXES,
  KEYSTORE_SUFFIXES,
} from '@/lib/ctp-files';

export type SignFormData = {
  aabFile: File;
  keystoreFile: File;
  keystorePassword: string;
  keyAlias: string;
  keyPassword: string;
};

interface UploadFormProps {
  onSubmit: (data: SignFormData) => void;
  disabled?: boolean;
}

type Step = 1 | 2 | 3;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileRow({
  label,
  hint,
  file,
  accept,
  inputRef,
  onChange,
  onClear,
  error,
  disabled,
}: {
  label: string;
  hint: string;
  file: File | null;
  accept: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-[#0a0a0a]">{label}</label>
        <span className="text-xs text-[#6b6b6b]">{hint}</span>
      </div>
      <div
        className={`flex items-center gap-3 rounded-lg border px-3 py-3 ${
          error ? 'border-red-400 bg-red-50' : 'border-[#e5e5e5] bg-white'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onChange}
          disabled={disabled}
          className="hidden"
        />
        <div className="min-w-0 flex-1">
          {file ? (
            <>
              <p className="truncate text-sm font-medium text-[#0a0a0a]">{file.name}</p>
              <p className="text-xs text-[#6b6b6b]">{formatFileSize(file.size)}</p>
            </>
          ) : (
            <p className="text-sm text-[#6b6b6b]">No file selected</p>
          )}
        </div>
        {file ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            className="shrink-0 text-sm font-medium text-[#6b6b6b] hover:text-[#0a0a0a]"
          >
            Remove
          </button>
        ) : null}
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="shrink-0 rounded-full border border-[#e5e5e5] bg-[#0a0a0a] px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
        >
          {file ? 'Replace' : 'Choose file'}
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export function UploadForm({ onSubmit, disabled = false }: UploadFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [aabFile, setAabFile] = useState<File | null>(null);
  const [keystoreFile, setKeystoreFile] = useState<File | null>(null);
  const [keystorePassword, setKeystorePassword] = useState('');
  const [keyAlias, setKeyAlias] = useState('');
  const [keyPassword, setKeyPassword] = useState('');
  const [sameAsKeystore, setSameAsKeystore] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState(false);

  const aabInputRef = useRef<HTMLInputElement>(null);
  const keystoreInputRef = useRef<HTMLInputElement>(null);

  const effectiveKeyPassword = sameAsKeystore ? keystorePassword : keyPassword;

  const setAabFromInput = useCallback((file: File | null) => {
    if (!file) {
      setAabFile(null);
      return;
    }
    const validation = checkAab(file);
    if (validation.ok) {
      setAabFile(file);
      setErrors((prev) => ({ ...prev, aab: '' }));
    } else {
      setErrors((prev) => ({ ...prev, aab: validation.message }));
    }
  }, []);

  const setKeystoreFromInput = useCallback((file: File | null) => {
    if (!file) {
      setKeystoreFile(null);
      return;
    }
    const validation = checkKeystore(file);
    if (validation.ok) {
      setKeystoreFile(file);
      setErrors((prev) => ({ ...prev, keystore: '' }));
    } else {
      setErrors((prev) => ({ ...prev, keystore: validation.message }));
    }
  }, []);

  const goNextFromBundle = () => {
    const validation = checkAab(aabFile);
    if (!validation.ok) {
      setErrors({ aab: !validation.ok ? validation.message : 'Select an AAB file' });
      return;
    }
    setErrors({});
    setStep(2);
  };

  const goNextFromKeys = () => {
    const newErrors: Record<string, string> = {};
    const ksCheck = checkKeystore(keystoreFile);
    if (!ksCheck.ok) newErrors.keystore = ksCheck.message;

    const credCheck = checkCredentials({
      storePassword: keystorePassword,
      alias: keyAlias,
      keyPassword: effectiveKeyPassword,
    });
    if (!credCheck.ok) {
      const m = credCheck.message;
      if (m.includes('password') && !m.includes('Key')) {
        newErrors.keystorePassword = m;
      } else if (m.includes('Alias')) {
        newErrors.keyAlias = m;
      } else if (m.includes('Key')) {
        newErrors.keyPassword = m;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStep(3);
  };

  const handleFinalSubmit = () => {
    if (!aabFile || !keystoreFile) return;
    onSubmit({
      aabFile,
      keystoreFile,
      keystorePassword,
      keyAlias,
      keyPassword: effectiveKeyPassword,
    });
  };

  const steps: { id: Step; label: string }[] = [
    { id: 1, label: 'Bundle' },
    { id: 2, label: 'Signing key' },
    { id: 3, label: 'Confirm' },
  ];

  return (
    <div className={disabled ? 'pointer-events-none opacity-60' : ''}>
      <ol className="mb-8 flex items-center gap-2">
        {steps.map((s, index) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <li key={s.id} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                disabled={disabled || s.id > step}
                onClick={() => s.id < step && setStep(s.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                  active
                    ? 'bg-[#0a0a0a] text-white'
                    : done
                      ? 'bg-[#f5f5f5] text-[#0a0a0a]'
                      : 'bg-transparent text-[#6b6b6b]'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    active
                      ? 'bg-white text-[#0a0a0a]'
                      : done
                        ? 'bg-[#0a0a0a] text-white'
                        : 'bg-[#e5e5e5] text-[#6b6b6b]'
                  }`}
                >
                  {done ? '✓' : s.id}
                </span>
                <span className="hidden font-medium sm:inline">{s.label}</span>
              </button>
              {index < steps.length - 1 ? (
                <span className="hidden h-px w-3 shrink-0 bg-[#e5e5e5] sm:block" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[#0a0a0a]">Add your App Bundle</h3>
            <p className="mt-1 text-sm text-[#6b6b6b]">
              Use an unsigned `.aab` from your build. Max {formatFileSize(AAB_MAX_BYTES)}.
            </p>
          </div>
          <FileRow
            label="App Bundle"
            hint=".aab"
            file={aabFile}
            accept={AAB_SUFFIXES.join(',')}
            inputRef={aabInputRef}
            disabled={disabled}
            error={errors.aab}
            onChange={(e) => setAabFromInput(e.target.files?.[0] || null)}
            onClear={() => {
              setAabFile(null);
              if (aabInputRef.current) aabInputRef.current.value = '';
            }}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={goNextFromBundle}
              disabled={disabled}
              className="rounded-full btn-ink px-5 py-2.5 text-sm font-semibold"
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[#0a0a0a]">Add your upload key</h3>
            <p className="mt-1 text-sm text-[#6b6b6b]">
              Same keystore you use for Play Console uploads. Max {formatFileSize(KEYSTORE_MAX_BYTES)}.
            </p>
          </div>

          <FileRow
            label="Keystore"
            hint=".jks · .keystore · .p12 · .pfx"
            file={keystoreFile}
            accept={KEYSTORE_SUFFIXES.join(',')}
            inputRef={keystoreInputRef}
            disabled={disabled}
            error={errors.keystore}
            onChange={(e) => setKeystoreFromInput(e.target.files?.[0] || null)}
            onClear={() => {
              setKeystoreFile(null);
              if (keystoreInputRef.current) keystoreInputRef.current.value = '';
            }}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="keyAlias" className="mb-1.5 block text-sm font-medium text-[#0a0a0a]">
                Alias
              </label>
              <input
                id="keyAlias"
                type="text"
                value={keyAlias}
                disabled={disabled}
                onChange={(e) => setKeyAlias(e.target.value)}
                className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#0a0a0a] ${
                  errors.keyAlias ? 'border-red-400' : 'border-[#e5e5e5]'
                }`}
                placeholder="alias from your keystore"
                autoComplete="off"
              />
              {errors.keyAlias ? <p className="mt-1.5 text-sm text-red-600">{errors.keyAlias}</p> : null}
            </div>

            <div>
              <label htmlFor="keystorePassword" className="mb-1.5 block text-sm font-medium text-[#0a0a0a]">
                Keystore password
              </label>
              <input
                id="keystorePassword"
                type={showPasswords ? 'text' : 'password'}
                value={keystorePassword}
                disabled={disabled}
                onChange={(e) => setKeystorePassword(e.target.value)}
                className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#0a0a0a] ${
                  errors.keystorePassword ? 'border-red-400' : 'border-[#e5e5e5]'
                }`}
                autoComplete="new-password"
              />
              {errors.keystorePassword ? (
                <p className="mt-1.5 text-sm text-red-600">{errors.keystorePassword}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="keyPassword" className="mb-1.5 block text-sm font-medium text-[#0a0a0a]">
                Key password
              </label>
              <input
                id="keyPassword"
                type={showPasswords ? 'text' : 'password'}
                value={sameAsKeystore ? keystorePassword : keyPassword}
                disabled={disabled || sameAsKeystore}
                onChange={(e) => setKeyPassword(e.target.value)}
                className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#0a0a0a] disabled:bg-[#f5f5f5] ${
                  errors.keyPassword ? 'border-red-400' : 'border-[#e5e5e5]'
                }`}
                autoComplete="new-password"
              />
              {errors.keyPassword ? <p className="mt-1.5 text-sm text-red-600">{errors.keyPassword}</p> : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-[#6b6b6b]">
              <input
                type="checkbox"
                checked={sameAsKeystore}
                disabled={disabled}
                onChange={(e) => setSameAsKeystore(e.target.checked)}
                className="rounded border-[#e5e5e5]"
              />
              Key password matches keystore
            </label>
            <button
              type="button"
              onClick={() => setShowPasswords((v) => !v)}
              className="text-sm font-medium text-[#0a0a0a] underline underline-offset-2"
            >
              {showPasswords ? 'Hide passwords' : 'Show passwords'}
            </button>
          </div>

          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={disabled}
              className="rounded-full border border-[#e5e5e5] px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:bg-[#f5f5f5]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNextFromKeys}
              disabled={disabled}
              className="rounded-full btn-ink px-5 py-2.5 text-sm font-semibold"
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[#0a0a0a]">Confirm and sign</h3>
            <p className="mt-1 text-sm text-[#6b6b6b]">
              Review once. Signing starts a public GitHub Actions job on Closed Test Pro infrastructure.
            </p>
          </div>

          <dl className="divide-y divide-[#e5e5e5] rounded-lg border border-[#e5e5e5] bg-[#fafafa]">
            <div className="flex items-start justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-[#6b6b6b]">Bundle</dt>
              <dd className="text-right text-sm font-medium text-[#0a0a0a] break-all">{aabFile?.name}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-[#6b6b6b]">Keystore</dt>
              <dd className="text-right text-sm font-medium text-[#0a0a0a] break-all">{keystoreFile?.name}</dd>
            </div>
            <div className="flex items-start justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-[#6b6b6b]">Alias</dt>
              <dd className="text-right text-sm font-medium text-[#0a0a0a]">{keyAlias}</dd>
            </div>
          </dl>

          <ul className="space-y-2 text-sm text-[#6b6b6b]">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              Passwords stay in memory for this job only, then discarded
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              Temporary uploads are deleted after signing finishes
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              Workflow source is public on GitHub for audit
            </li>
          </ul>

          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={disabled}
              className="rounded-full border border-[#e5e5e5] px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] hover:bg-[#f5f5f5]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={disabled}
              className="rounded-full btn-ink px-5 py-2.5 text-sm font-semibold"
            >
              {disabled ? 'Starting…' : 'Start signing'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
