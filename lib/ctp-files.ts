/**
 * Closed Test Pro — client-side / shared file checks for AAB signing.
 * Never include password values in returned messages.
 */

export const AAB_MAX_BYTES = 100 * 1024 * 1024;
export const KEYSTORE_MAX_BYTES = 10 * 1024 * 1024;

export const AAB_SUFFIXES = ['.aab'] as const;
export const KEYSTORE_SUFFIXES = ['.jks', '.keystore', '.p12', '.pfx'] as const;

export type CheckResult = { ok: true } | { ok: false; message: string };

function hasSuffix(name: string, suffixes: readonly string[]) {
  const lower = name.toLowerCase();
  return suffixes.some((s) => lower.endsWith(s));
}

export function checkAab(file: File | null): CheckResult {
  if (!file) return { ok: false, message: 'Please choose an .aab file' };
  if (!hasSuffix(file.name, AAB_SUFFIXES)) {
    return { ok: false, message: 'Only .aab files are accepted' };
  }
  if (file.size <= 0) return { ok: false, message: 'The AAB file is empty' };
  if (file.size > AAB_MAX_BYTES) {
    return { ok: false, message: 'AAB must be 100 MB or smaller' };
  }
  return { ok: true };
}

export function checkKeystore(file: File | null): CheckResult {
  if (!file) return { ok: false, message: 'Please choose a keystore file' };
  if (!hasSuffix(file.name, KEYSTORE_SUFFIXES)) {
    return { ok: false, message: 'Use .jks, .keystore, .p12, or .pfx' };
  }
  if (file.size <= 0) return { ok: false, message: 'The keystore file is empty' };
  if (file.size > KEYSTORE_MAX_BYTES) {
    return { ok: false, message: 'Keystore must be 10 MB or smaller' };
  }
  return { ok: true };
}

export function checkCredentials(input: {
  storePassword?: string;
  alias?: string;
  keyPassword?: string;
}): CheckResult {
  const alias = input.alias?.trim() ?? '';
  if (!alias) return { ok: false, message: 'Alias is required' };
  if (!/^[A-Za-z0-9._-]+$/.test(alias)) {
    return { ok: false, message: 'Alias may only use letters, numbers, . _ -' };
  }
  if (!input.storePassword?.length) {
    return { ok: false, message: 'Keystore password is required' };
  }
  if (!input.keyPassword?.length) {
    return { ok: false, message: 'Key password is required' };
  }
  return { ok: true };
}
