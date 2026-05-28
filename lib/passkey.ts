// Lightweight WebAuthn / passkey helpers used by the login flow,
// the passkey-promotion drawer and the account settings page.

import { apiClient } from './api';

export function isPasskeySupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.credentials
  );
}

export async function hasPlatformAuthenticator(): Promise<boolean> {
  try {
    if (!isPasskeySupported()) return false;
    return await (
      window.PublicKeyCredential as unknown as {
        isUserVerifyingPlatformAuthenticatorAvailable: () => Promise<boolean>;
      }
    ).isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// --- base64url <-> ArrayBuffer ---

export function b64urlToBuffer(input: string): ArrayBuffer {
  const pad = '='.repeat((4 - (input.length % 4)) % 4);
  const b64 = (input + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

export function bufferToB64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// --- registration / authentication ceremonies ---

type CredentialDescriptor = { id: string; type: 'public-key'; transports?: AuthenticatorTransport[] };

interface ServerRegistrationOptions {
  rp: { id: string; name: string };
  user: { id: string; name: string; displayName: string };
  challenge: string;
  pubKeyCredParams: { type: 'public-key'; alg: number }[];
  timeout?: number;
  attestation?: AttestationConveyancePreference;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  excludeCredentials?: CredentialDescriptor[];
}

interface ServerAuthenticationOptions {
  challenge: string;
  rpId: string;
  timeout?: number;
  userVerification?: UserVerificationRequirement;
  allowCredentials?: CredentialDescriptor[];
}

function toPublicKeyCreationOptions(opts: ServerRegistrationOptions): PublicKeyCredentialCreationOptions {
  return {
    ...opts,
    challenge: b64urlToBuffer(opts.challenge),
    user: { ...opts.user, id: b64urlToBuffer(opts.user.id) },
    excludeCredentials: opts.excludeCredentials?.map((c) => ({
      ...c,
      id: b64urlToBuffer(c.id),
    })),
  } as PublicKeyCredentialCreationOptions;
}

function toPublicKeyRequestOptions(opts: ServerAuthenticationOptions): PublicKeyCredentialRequestOptions {
  return {
    ...opts,
    challenge: b64urlToBuffer(opts.challenge),
    allowCredentials: opts.allowCredentials?.map((c) => ({
      ...c,
      id: b64urlToBuffer(c.id),
    })),
  } as PublicKeyCredentialRequestOptions;
}

function serializeAttestation(cred: PublicKeyCredential) {
  const att = cred.response as AuthenticatorAttestationResponse;
  // Browsers expose getTransports() on AuthenticatorAttestationResponse
  let transports: string[] = [];
  const maybe = att as unknown as { getTransports?: () => string[] };
  if (typeof maybe.getTransports === 'function') {
    try {
      transports = maybe.getTransports();
    } catch {
      transports = [];
    }
  }
  return {
    id: cred.id,
    rawId: bufferToB64url(cred.rawId),
    type: cred.type,
    response: {
      attestationObject: bufferToB64url(att.attestationObject),
      clientDataJSON: bufferToB64url(att.clientDataJSON),
      transports,
    },
    clientExtensionResults: cred.getClientExtensionResults?.() ?? {},
  };
}

function serializeAssertion(cred: PublicKeyCredential) {
  const ass = cred.response as AuthenticatorAssertionResponse;
  return {
    id: cred.id,
    rawId: bufferToB64url(cred.rawId),
    type: cred.type,
    response: {
      authenticatorData: bufferToB64url(ass.authenticatorData),
      clientDataJSON: bufferToB64url(ass.clientDataJSON),
      signature: bufferToB64url(ass.signature),
      userHandle: ass.userHandle ? bufferToB64url(ass.userHandle) : null,
    },
    clientExtensionResults: cred.getClientExtensionResults?.() ?? {},
  };
}

export async function enrollPasskey(name: string): Promise<void> {
  if (!isPasskeySupported()) throw new Error('passkey-unsupported');
  const opts = (await apiClient.passkeyRegisterOptions({ name })) as unknown as ServerRegistrationOptions;
  const cred = (await navigator.credentials.create({
    publicKey: toPublicKeyCreationOptions(opts),
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error('passkey-cancelled');
  await apiClient.passkeyRegisterVerify({ name, response: serializeAttestation(cred) });
}

export async function authenticateWithPasskey(username?: string): Promise<void> {
  if (!isPasskeySupported()) throw new Error('passkey-unsupported');
  const { options, challenge_id } = await apiClient.passkeyAuthOptions({ username });
  const cred = (await navigator.credentials.get({
    publicKey: toPublicKeyRequestOptions(options as unknown as ServerAuthenticationOptions),
    mediation: 'optional',
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error('passkey-cancelled');
  await apiClient.passkeyAuthVerify({
    challenge_id,
    response: serializeAssertion(cred),
  });
}

export function describePasskeyError(err: unknown): string {
  if (!err) return 'Ismeretlen hiba történt.';
  const message = err instanceof Error ? err.message : String(err);
  if (message === 'passkey-unsupported') return 'Az eszközöd nem támogatja a passkey-t.';
  if (message === 'passkey-cancelled') return 'A passkey művelet megszakadt.';
  if (err && typeof err === 'object' && 'name' in err) {
    const name = (err as { name?: string }).name;
    if (name === 'NotAllowedError') return 'A passkey művelet megszakadt vagy időtúllépés történt.';
    if (name === 'InvalidStateError') return 'Ez a passkey már regisztrálva van ezen a fiókon.';
    if (name === 'SecurityError') return 'Biztonsági hiba: ellenőrizd, hogy https-en éred-e el az oldalt.';
    if (name === 'AbortError') return 'A passkey művelet megszakadt.';
  }
  return message || 'Ismeretlen hiba történt.';
}
